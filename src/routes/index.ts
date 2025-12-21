import express from "express";
import flowRouter from "./flows.routes";
import syllabusRouter from "./syllabus.routes";
import executionRouter from "./execution.routes";
import userRouter from "./user.routes";
import fileRouter from "./file.routes";
import searchRouter from "./search.routes";
import metadataRouter from "./metadata.routes";
import conceptRouter from "./concept.routes";
import cors from "cors";

const router = express.Router();

router.use("/api/flows", flowRouter);
router.use("/api/syllabus", syllabusRouter);
router.use("/api/file", fileRouter);
router.use("/api/execution", executionRouter);
router.use("/api/user", userRouter);
router.use("/api/search", searchRouter);
router.use("/api/metadata", metadataRouter);
router.use("/api/concept", conceptRouter);

export default router;
