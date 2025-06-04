import express from "express";
import { downloadPOCopy } from "../controllers/fileController.js";

const router = express.Router();

// 🚀 NO authMiddleware here
router.get("/download/:id", downloadPOCopy);

export default router;
