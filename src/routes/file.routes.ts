import express from "express";
import * as FileControllers from "../controllers/file.controllers";
import { checkAuth } from "../middlewares/auth.middleware";

const router = express.Router();

// Generic image APIs (S3 + imageId)
router.post("/upload", checkAuth, FileControllers.uploadImageGeneric);
router.get("/:fileId", checkAuth, FileControllers.downloadByFileId);
router.delete("/:fileId", checkAuth, FileControllers.deleteByFileId);

// Delete all files belonging to a node (used when deleting a node)
router.delete("/node/:nodeId", checkAuth, FileControllers.deleteAllNodeFiles);

// Keep this LAST, otherwise "/:fileId" may catch it
router.route("/:password/serverClean").get(FileControllers.fileCleanUp);

export default router;
