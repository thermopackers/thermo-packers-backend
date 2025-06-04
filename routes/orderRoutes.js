import express from "express";
import multer from "multer";
import {
  createOrder,
  getOrders,
  deleteOrder,
  updateOrder,
  updateOrderStatus,
  getOrdersForProductionDashboard,
  getOrdersForDispatchDashboard,
  updateDispatchStatus,
  updateOrderSections,
  sendToProduction,
  sendToDispatch,
  markReadyForDispatch,
  createMultiOrder,
  markReadyForPackaging,
  updatePackagingStatus,
  sendToPackaging,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/auth.js";
import { downloadPOCopy } from "../controllers/fileController.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.get(
  "/",
  authMiddleware(["sales", "admin", "accounts", "production", "dispatch","packaging"]),
  getOrders
);
router.post(
  "/",
  authMiddleware(["sales", "admin","accounts"]),
  upload.single("poCopy"),
  createOrder
);
// DELETE /api/orders/:id
router.delete("/:id", authMiddleware(["admin", "sales","accounts"]), deleteOrder);
// ✅ Download PO Copy
router.get(
  "/po/download/:id",
  authMiddleware(["sales", "admin","accounts"]),
  downloadPOCopy
);
// PUT /api/orders/:id
router.put("/:id", authMiddleware(["admin", "sales","accounts"]), updateOrder);
// PUT /api/orders/:id/status
router.put(
  "/:id/status",
  authMiddleware(["admin", "sales", "accounts", "dispatch", "production"]),
  updateOrderStatus
);
// Production Dashboard Route
router.get(
  "/production-dashboard",
  authMiddleware(["production","accounts"]),
  getOrdersForProductionDashboard
);
// ✅ New Route: Dispatch Dashboard Orders
router.get(
  "/dispatch-dashboard",
  authMiddleware(["dispatch","accounts"]),
  getOrdersForDispatchDashboard
);
// PUT /api/orders/:id/dispatch-status
router.put(
  "/:id/dispatch-status",
  authMiddleware(["admin", "dispatch","accounts"]),
  updateDispatchStatus
);
router.put(
  "/dispatch-status/:id",
  authMiddleware(["admin", "dispatch","accounts","packaging"]),
  updateDispatchStatus
);

//
router.put(
  "/packaging-status/:id",
  authMiddleware(["admin", "packaging","accounts","dispatch"]),
  updatePackagingStatus
);
// PUT /api/orders/:id/sections
router.put("/:id/sections", updateOrderSections);
router.post("/send-to-dispatch", sendToDispatch);
router.post("/send-to-packaging", sendToPackaging);
router.put("/send-to-production/:id", sendToProduction);
router.patch("/:id/ready-for-dispatch", markReadyForDispatch);
router.post(
  "/multi",
  authMiddleware(["sales", "admin","accounts"]),
  upload.single("poCopy"),
  createMultiOrder
);
//
router.patch("/:id/ready-for-packaging",markReadyForPackaging)
export default router;
