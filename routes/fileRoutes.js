import multer from "multer";
import express from "express";
import { downloadPOCopy } from "../controllers/fileController.js";
import Order from "../models/Order.js";
import upload from "../middleware/uploadPo.js";
import cloudinary from "../utils/cloudinaryPo.js";

const router = express.Router();

// 🚀 NO authMiddleware here
router.get("/download/:id", downloadPOCopy);

//upload
// routes/fileRoutes.js or api/files.js
router.post("/upload/po-copy/:orderId", upload.single("poCopy"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer || req.file.size === 0) {
      return res.status(400).json({ error: "Empty or invalid file uploaded." });
    }

    const { orderId } = req.params;
    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "po-copies",
            resource_type: "auto", // to support PDF
            public_id: `${orderId}_${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(buffer); // ✅ CRITICAL
      });
    };

    const result = await streamUpload(fileBuffer);

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        poCopy: result.secure_url,
        poOriginalName: req.file.originalname,
      },
      { new: true }
    );

    res.status(200).json({
      message: "PO Copy uploaded successfully",
      url: result.secure_url,
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload PO Copy" });
  }
});


export default router;

