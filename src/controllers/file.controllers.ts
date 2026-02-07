import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import PolyglotFileModel from "../models/file.model";
import PolyglotFlowModel from "../models/flow.model";

const multer = require("multer");

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3, S3_BUCKET } from "../services/s3";

// --------------------
// Helpers
// --------------------
const safeName = (s: string) => s.replace(/[^a-zA-Z0-9._-]+/g, "_");
const newUuid = () =>
  (globalThis.crypto as any)?.randomUUID?.() ?? crypto.randomUUID();

interface MulterFileMem {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
type RequestWithMemFile = Request & { file?: MulterFileMem };

// Multer in-memory (NO filesystem)
const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// --------------------
// POST /api/file/upload
// multipart:
// - file
// - parentNodeId
// response: { imageId }
// --------------------
export const uploadImageGeneric = [
  uploadMem.single("file"),
  async (req: RequestWithMemFile, res: Response) => {
    try {
      const parentNodeId = (req.body?.parentNodeId as string | undefined) ?? undefined;
      if (!parentNodeId) {
        return res.status(400).json({ message: "Missing parentNodeId" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Nessun file caricato" });
      }

      const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!allowed.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json({ message: "Formato non supportato (PNG/JPG/WEBP)" });
      }

      const imageId = newUuid();

      // Key unica e raggruppata per nodo (utile per debug)
      const key = `polyglot/${parentNodeId}/images/${imageId}-${Date.now()}-${safeName(
        req.file.originalname
      )}`;

      // Upload su S3
      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      // Salva metadati su Mongo (path = S3 key)
      await PolyglotFileModel.findByIdAndUpdate(
        imageId,
        {
          _id: imageId,
          parentNodeId,
          filename: req.file.originalname, // o puoi usare un nome diverso
          path: key,
          uploadedAt: new Date(),
          // se aggiungi questi campi al model, valorizzali:
          // contentType: req.file.mimetype,
          // size: req.file.size,
          // originalName: req.file.originalname,
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({ imageId });
    } catch (err) {
      console.error("uploadImageGeneric error", err);
      return res.status(500).json({ message: "Errore upload immagine" });
    }
  },
];

// --------------------
// GET /api/file/:fileId
// Stream immagine dal bucket
// --------------------
export const downloadByFileId = async (req: Request, res: Response) => {
  const { fileId } = (req as any).params;

  try {
    const file = await PolyglotFileModel.findById(String(fileId));
    if (!file) return res.status(404).json({ message: "File not found" });

    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: file.path, // S3 key
      })
    );

    res.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);

    // Se nel model salvi contentType, puoi usare quello.
    // In assenza, prova a usare quello restituito da S3.
    const ct = (obj as any).ContentType;
    if (ct) res.setHeader("Content-Type", ct);

    (obj.Body as any).pipe(res);
  } catch (err) {
    console.error("downloadByFileId error", err);
    return res.status(500).json({ message: "Error during download" });
  }
};

// --------------------
// DELETE /api/file/:fileId
// Cancella oggetto S3 + record Mongo
// --------------------
export const deleteByFileId = async (req: Request, res: Response) => {
  const { fileId } = (req as any).params;

  try {
    const file = await PolyglotFileModel.findById(String(fileId));
    if (!file) return res.status(204).send();

    await s3.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: file.path,
      })
    );

    await PolyglotFileModel.deleteOne({ _id: String(fileId) });

    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteByFileId error", err);
    return res.status(500).json({ message: "Error during delete" });
  }
};

// --------------------
// DELETE /api/file/node/:nodeId
// Cancella tutti i file associati al nodo (S3 + Mongo)
// --------------------
export const deleteAllNodeFiles = async (req: Request, res: Response) => {
  const { nodeId } = (req as any).params;

  try {
    const files = await PolyglotFileModel.find({ parentNodeId: String(nodeId) });

    await Promise.allSettled(
      files.map((f: any) =>
        s3.send(
          new DeleteObjectCommand({
            Bucket: S3_BUCKET,
            Key: f.path,
          })
        )
      )
    );

    const resp = await PolyglotFileModel.deleteMany({
      parentNodeId: String(nodeId),
    });

    return res.status(200).json({
      message: "Node files deleted (or none existed)",
      deletedCount: resp.deletedCount ?? 0,
    });
  } catch (err) {
    console.error("deleteAllNodeFiles error", err);
    return res.status(500).json({ message: "Error during deleteAllNodeFiles" });
  }
};

// --------------------
// GET /api/file/:password/serverClean
// Ora pulisce SOLO Mongo (senza FS).
// NB: Non elimina da S3 se il record non è già in DB.
// --------------------
export async function fileCleanUp(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (req.params.password !== "polyglotClean") throw "Wrong password";

    const files = await PolyglotFileModel.find();
    const flows = await PolyglotFlowModel.find();

    const validNodeIds = flows.flatMap((flow: any) =>
      flow.nodes.map((node: any) => String(node._id))
    );

    const filesToRemove = files.filter((file: any) => {
      const parent = file.parentNodeId ? String(file.parentNodeId) : null;
      return parent ? !validNodeIds.includes(parent) : true;
    });

    if (filesToRemove.length === 0) {
      return res.status(200).json("Nessun file da rimuovere.");
    }

    // Cancella DB (S3 cleanup completo richiede o list per prefix o i record)
    const resp = await PolyglotFileModel.deleteMany({
      _id: { $in: filesToRemove.map((f: any) => String(f._id)) },
    });

    console.log(
      `Rimossi ${resp.deletedCount} record file non associati a nodi validi (solo db).`
    );
    return res
      .status(200)
      .json(
        `Rimossi ${resp.deletedCount} record file non associati a nodi validi (solo db).`
      );
  } catch (error) {
    next(error);
  }
}



