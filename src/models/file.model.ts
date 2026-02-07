import mongoose, { Model } from "mongoose";
import { PolyglotFileInfo } from "../types/PolyglotFile";

const fileSchema = new mongoose.Schema<PolyglotFileInfo>({
  // imageId (UUID)
  _id: {
    type: String,
    required: true,
  },

  // Nodo a cui il file è associato (per cleanup)
  parentNodeId: {
    type: String,
    required: true,
    index: true,
  },

  // Nome originale del file (per download)
  filename: {
    type: String,
    required: true,
  },

  // S3 key (es: polyglot/<nodeId>/images/<imageId>-xxx.png)
  path: {
    type: String,
    required: true,
  },

  // Metadata utili (consigliati)
  contentType: {
    type: String,
    required: false,
  },

  size: {
    type: Number,
    required: false,
  },

  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export interface PolyglotFileModel extends Model<PolyglotFileInfo> {}

export default mongoose.model<PolyglotFileInfo, PolyglotFileModel>(
  "File",
  fileSchema
);
