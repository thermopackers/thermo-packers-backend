import { nanoid } from "nanoid";
import { generateShapeSlipPDF, generateCuttingSlipPDF, generatePackagingSlipPDF } from "../utils/slipGenerator.js";
import path from "path";
import fs from "fs";
import Order from "../models/Order.js";
import Products from "../models/BackendProducts.js";
import mongoose from "mongoose";
import getNextShortOrderId from "../utils/getNextShortOrderId.js";
import { uploadSlipToCloudinary } from "../utils/uploadToCloudinary.js";

// ✅ Create Order
export const createOrder = async (req, res) => {
  
  try {
    const {
      customerName,
      size,
      product,
      density,
      packagingCharge,
      po,
      quantity,
      price,
      freight,
      date,
      remarks,
      status,
    } = req.body;
    const poCopy = req.file?.filename || "";
    const poOriginalName = req.file?.originalname || "";
    // const shortOrderId = `TP${nanoid(8)}`; // e.g., "AbC123xYZ0"
const shortOrderId = await getNextShortOrderId();

    const newOrder = new Order({
      shortId: shortOrderId,
      employeeId: req.user.id,
      customerName,
      product,
      quantity,
      price,
      density,
      packagingCharge,
      po,
      size,
      freight,
      date: date || new Date(),
      remarks,
      poCopy,
      poOriginalName,
      status: status,
    });
    const existing = await Order.findOne({ po: req.body.po });
if (existing) {
  return res.status(400).json({ message: "PO number already exists" });
}


    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
};

// ✅ Get Orders
export const getOrders = async (req, res) => {
  try {
    const {
      employeeId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      search, // ✅ Add search term
       packagingStatus,
      dispatchStatus,
      readyForPackaging,
    } = req.query;

    const query = {};

    // 🔐 Permissions
    if (
      req.user.role !== "admin" &&
      req.user.role !== "production" &&
      req.user.role !== "dispatch" &&
      req.user.role !== "packaging" &&
      req.user.role !== "accounts"
    ) {
      query.employeeId = new mongoose.Types.ObjectId(req.user.id);
    } else if (employeeId && mongoose.Types.ObjectId.isValid(employeeId)) {
      query.employeeId = new mongoose.Types.ObjectId(employeeId);
    }

    // 📅 Date filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    // 🔍 Search filter
    if (search) {
      const regex = new RegExp(search, "i"); // case-insensitive
      query.$or = [
        { shortId: regex },
        { customerName: regex },
        { product: regex },
        { po: regex },
      ];
    }

     // readyForPackaging filter (convert to Boolean)
    if (readyForPackaging !== undefined) {
      query.readyForPackaging = readyForPackaging === "true";
    }

    // packagingStatus filter
    if (packagingStatus) {
      query.packagingStatus = packagingStatus;
    }

    // dispatchStatus filter
    if (dispatchStatus) {
      query.dispatchStatus = dispatchStatus;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // 📦 Attach stock info
    const productStocks = await Products.find();
    const stockMap = {};
    productStocks.forEach((p) => {
      stockMap[p.name] = p.quantity;
    });

    const ordersWithStock = orders.map((order) => ({
      ...order,
      stock: stockMap[order.product] ?? 0,
    }));

    res.json({
      orders: ordersWithStock,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Server Error" });
  }
};


// ✅ Delete Order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only Admin and accounts can delete
   if (
  req.user.role !== "admin" &&
  req.user.role !== "accounts" &&
  String(order.employeeId) !== req.user.id
) {
  return res.status(403).json({ message: "Unauthorized" });
}


    await Order.findByIdAndDelete(id);

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Error deleting order:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update Order
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only Admin or Owner can update
    if (req.user.role !== "admin" && req.user.role !== "sales" && req.user.role !== "accounts" && String(order.employeeId) !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updates = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(id, updates, {
      new: true,
    });

    res.json({ message: "Order updated successfully", updatedOrder });
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// ✅ Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Allowed lowercase statuses
    const allowedStatuses = ["in process", "pending", "processed"];

    const normalizedStatus = status.trim().toLowerCase();

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (
      req.user.role !== "admin" &&
      req.user.role !== "production" &&
      req.user.role !== "accounts" &&
      String(order.employeeId) !== req.user.id
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    order.status = normalizedStatus;

    const updatedOrder = await order.save();
    res.json({ message: "Order status updated successfully", updatedOrder });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Server error" });
  }
};



export const getOrdersForProductionDashboard = async (req, res) => {
  try {
    // Get query params with defaults
    const {
      searchTerm = "",
      startDate,
      endDate,
      status = "all",
      page = 1,
      limit = 5,
    } = req.query;

    const query = {
      "sentTo.production": { $exists: true, $ne: [] },
    };

    // Status filter
    if (status !== "all") {
      query.status = status;
    }

    // Date filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search filter (PO, product, customerName, shortId)
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i"); // case insensitive
      query.$or = [
        { po: regex },
        { product: regex },
        { customerName: regex },
        { shortId: regex },
      ];
    }

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);

    // Find total count for pagination
    const totalCount = await Order.countDocuments(query);

    // Fetch paginated & filtered orders
    const orders = await Order.find(query)
      .sort({ _id: -1 })
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt)
      .lean();

    // Add remainingToProduce for each order
    const updatedOrders = await Promise.all(
      orders.map(async (order) => {
        const quantity = order.quantity || 0;
        const product = await Products.findOne({ name: order.product });
        const stockAvailable = product?.quantity || 0;
        const remainingToProduce = Math.max(quantity - stockAvailable, 0);
        return {
          ...order,
          remainingToProduce,
        };
      })
    );

    res.status(200).json({
      orders: updatedOrders,
      totalCount,
      totalPages: Math.ceil(totalCount / limitInt),
      currentPage: pageInt,
    });
  } catch (error) {
    console.error("Error fetching production orders:", error);
    res.status(500).json({ message: "Failed to fetch production orders" });
  }
};



// ✅ Get all orders for dispatch dashboard
export const getOrdersForDispatchDashboard = async (req, res) => {
  try {
    if (req.user.role !== "dispatch" && req.user.role !== "accounts") {
      return res.status(403).json({ message: "Access denied" });
    }

    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      search = "",
    } = req.query;

    const baseConditions = [
      {
        $or: [
          { "sentTo.dispatch": { $exists: true, $not: { $size: 0 } } },
          { "sentTo.dispatchReady": true },
        ],
      },
    ];

    if (status) {
      baseConditions.push({ dispatchStatus: status.trim().toLowerCase() });
    }

    if (startDate && endDate) {
      baseConditions.push({
        createdAt: {
          $gte: new Date(new Date(startDate).setHours(0, 0, 0)),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59)),
        },
      });
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      baseConditions.push({
        $or: [
          { shortId: regex },
          { customerName: regex },
          { product: regex },
          { po: regex },
        ],
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { $and: baseConditions };

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching dispatch orders:", error);
    res.status(500).json({ message: "Server Error" });
  }
};



// ✅ Update Dispatch Status
export const updateDispatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { dispatchStatus } = req.body;
    const allowedStatuses = [
      "not dispatched",
      "dispatched",
      "ready to dispatch",
    ];

    const normalizedStatus = dispatchStatus.trim().toLowerCase();

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid dispatch status" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.user.role !== "admin" && req.user.role !== "dispatch" && req.user.role !== "accounts" && req.user.role !== "packaging") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    order.dispatchStatus = normalizedStatus;
    const updatedOrder = await order.save();

    res.json({ message: "Dispatch status updated successfully", updatedOrder });
  } catch (err) {
    console.error("Error updating dispatch status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//
export const updatePackagingStatus = async (req, res) => {
  console.log("Request params:", req.params);
  console.log("Request body:", req.body);

  const { packagingStatus } = req.body;

  if (!packagingStatus) {
    return res.status(400).json({ error: "packagingStatus is required" });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { packagingStatus }, { new: true });
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ message: "Packaging status updated", order: updatedOrder });
  } catch (error) {
    console.error("Error updating packaging status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


// PUT /api/orders/:id/sections
export const updateOrderSections = async (req, res) => {
  try {
    const { id } = req.params;
    const { requiredSections } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { requiredSections },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (err) {
    console.error("Error updating sections:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const sendToDispatch = async (req, res) => {
  try {


    const { orderIds, sections, cuttingRows = [] } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "No order IDs provided." });
    }

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return res
        .status(400)
        .json({ message: "No dispatch sections provided." });
    }

    const failedOrders = [];
    const updatedOrders = [];

    for (const orderId of orderIds) {
      const order = await Order.findById(orderId);
      if (!order) {
        failedOrders.push({ orderId, reason: "Order not found" });
        continue;
      }

      const product = await Products.findOne({ name: order.product });
      if (!product) {
        failedOrders.push({
          orderId,
          reason: "Product not found in inventory",
        });
        continue;
      }

      if (product.stock < order.quantity) {
        failedOrders.push({ orderId, reason: "Insufficient stock" });
        continue;
      }

      // Deduct stock and update order
      product.stock -= order.quantity;
      await product.save();

      order.dispatchStatus = "not dispatched";
      order.sentTo.dispatch = sections; // Update with the provided dispatch sections
      
 // Generate Cutting Slip
      const slipFilename = `${order.shortId}_cutting.pdf`;
      const slipPath = path.join("uploads", "slips", slipFilename);

      // Ensure folder exists
      fs.mkdirSync(path.dirname(slipPath), { recursive: true });

      generateCuttingSlipPDF({ ...order.toObject(), sentTo: { ...order.sentTo } }, cuttingRows, slipPath);

const cuttingUrl = await uploadSlipToCloudinary(slipPath); // ⬅️ Add this

order.cuttingSlip = {
  filename: slipFilename,
  url: cuttingUrl,
};

await order.save(); // Save afterward

      updatedOrders.push({
        orderId: order._id,
        product: product.name,
        remainingStock: product.stock,
        cuttingSlipUrl: order.cuttingSlip.url,
      });
    }

    res.status(200).json({
      message: "Dispatch process completed.",
      successCount: updatedOrders.length,
      failedCount: failedOrders.length,
      updatedOrders,
      failedOrders,
    });
  } catch (error) {
    console.error("Error in sendToDispatch:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const sendToPackaging = async (req, res) => {
  try {
    const { orderId, packagingRows } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ✅ Ensure folder exists
    const slipDir = path.join("uploads", "slips");
    fs.mkdirSync(slipDir, { recursive: true });

    // ✅ Generate and save packaging slip PDF
    const filename = `${order.shortId}_packaging.pdf`;
    const localPath = path.join(slipDir, filename);

    await generatePackagingSlipPDF(order, packagingRows, localPath);

    // ✅ Upload to Cloudinary
    const cloudinaryUrl = await uploadSlipToCloudinary(localPath);

    // ✅ Save slip URL and mark packaging status
    order.packagingSlip = {
      filename,
      url: cloudinaryUrl,
    };

    order.readyForPackaging = true;
    order.packagingStatus = "unpackaged";
    order.sentTo.dispatchReady = false;

    await order.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("Failed to send to packaging:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const sendToProduction = async (req, res) => {
  try {
    const orderId = req.params.id;
    const {
      sections,
      remainingToProduce,
      cuttingRows = [],
      shapeRows = [],
      danaRows = [], // ✅ Accept danaRows from frontend
    } = req.body;

    if (
      !orderId ||
      !sections ||
      !Array.isArray(sections) ||
      sections.length === 0
    ) {
      return res.status(400).json({ message: "Order ID or sections missing." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    sections.forEach((section) => {
      if (!order.sentTo.production.includes(section)) {
        order.sentTo.production.push(section);
      }
    });

    order.status = "in process";
    order.sentTo.remainingToProduce = remainingToProduce;

    const slipDir = path.join("uploads", "slips");
    fs.mkdirSync(slipDir, { recursive: true });

    // ✅ Cutting Slip
    const cuttingFilename = `${order.shortId}_cutting.pdf`;
    const cuttingPath = path.join(slipDir, cuttingFilename);
    await generateCuttingSlipPDF(order, cuttingRows, cuttingPath);
    const cuttingUrl = await uploadSlipToCloudinary(cuttingPath);

    // ✅ Shape Slip
    const shapeFilename = `${order.shortId}_shape.pdf`;
    const shapePath = path.join(slipDir, shapeFilename);
    await generateShapeSlipPDF(order, shapeRows, shapePath);
    const shapeUrl = await uploadSlipToCloudinary(shapePath);

    // ✅ Dana Slip (if blockMoulding is included)
    if (sections.includes("blockMoulding")) {
      const danaFilename = `${order.shortId}_dana.pdf`;
      const danaPath = path.join(slipDir, danaFilename);
      await generateDanaSlipPDF(order, danaRows, danaPath);
      const danaUrl = await uploadSlipToCloudinary(danaPath);
      order.danaSlip = {
        filename: danaFilename,
        url: danaUrl,
      };
    }

    // ✅ Save all slips
    order.cuttingSlip = {
      filename: cuttingFilename,
      url: cuttingUrl,
    };
    order.shapeSlip = {
      filename: shapeFilename,
      url: shapeUrl,
    };

    await order.save();

    res.status(200).json({ message: "Order sent to production", order });
  } catch (error) {
    console.error("❌ Error in sendToProduction:", error);
    res.status(500).json({ message: "Failed to update order", error: error.message });
  }
};



export const markReadyForDispatch = async (req, res) => {
  try {
    const orderId = req.params.id;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status: "processed", "sentTo.dispatchReady": true } }, // example change
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res
      .status(200)
      .json({ message: "Marked as ready for dispatch", order: updatedOrder });
  } catch (error) {
    console.error("Error marking order as ready:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const markReadyForPackaging = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { readyForPackaging: true },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order marked as ready for packaging" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to mark as ready for packaging" });
  }
}


//
export const createMultiOrder = async (req, res) => {
  try {
    const { customerName, po, date, remarks } = req.body;
    const products = JSON.parse(req.body.products);

    // ✅ STEP 1: Check if the PO already exists in the DB
    const existing = await Order.findOne({ po });
    if (existing) {
      return res.status(400).json({ message: "PO number already exists" });
    }

    const poCopy = req.file?.filename || "";
    const poOriginalName = req.file?.originalname || "";

    const savedOrders = [];

    // ✅ STEP 2: Save each product as a new order under same PO
    for (const prod of products) {
            const shortId = await getNextShortOrderId(); // 🔁 Sequential ID

      const order = new Order({
        customerName,
                employeeId: req.user.id, // ✅ include employeeId
        po,
        date,
        remarks,
        poCopy,
        poOriginalName,
        ...prod,
shortId
      });

      const saved = await order.save();
      savedOrders.push(saved);
    }

    res.status(201).json({ message: "Orders saved", orders: savedOrders });
  } catch (err) {
    console.error("Error creating multiple orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};
