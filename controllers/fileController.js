import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Order from "../models/Order.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Download PO Copy
export const downloadPOCopy = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const filePath = path.join(__dirname, "../uploads/", order.poCopy);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath, order.poOriginalName || order.poCopy); // Use original name if available
    } else {
      res.status(404).json({ message: "File not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
