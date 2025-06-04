import fs from 'fs';
import Order from '../models/Order.js';
import {Slip} from '../models/Slip.js';
import path from 'path';
import { generateCuttingSlipPDF, generateDanaSlipPDF, generatePackagingSlipPDF, generateShapeSlipPDF } from '../utils/slipGenerator.js';

export const createProductionSlip = async (req, res) => {
  try {
    const { orderId, productName, dryWeight, quantity, remarks } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isDanaSlip = !order.requiredSections?.shapeMoulding;

    // Save slip to DB
    const newSlip = new Slip({
      orderId,
      productName,
      quantity,
      remarks,
      type: 'production',
    });
    await newSlip.save();

    const rows = [{ productName, dryWeight, quantity, remarks }];

    const suffix = isDanaSlip ? 'dana' : 'shape';
    const filename = `${order.shortId}_${suffix}.pdf`;
    const filePath = path.join('uploads', 'slips', filename);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    generateShapeSlipPDF(order, rows, filePath); // ✅ PDF content remains the same

    // Save to order (still using shapeSlip field for simplicity)
    order.shapeSlip = {
      filename,
      url: `/uploads/slips/${filename}`,
    };

    await order.save();

    res.status(201).json({
      message: `${isDanaSlip ? "Dana" : "Shape"} slip created`,
      url: order.shapeSlip.url,
    });

  } catch (error) {
    console.error('Error creating production slip:', error);
    res.status(500).json({ message: 'Failed to create production slip' });
  }
};


export const createDispatchSlip = async (req, res) => {
  try {
    const { orderId, row } = req.body;


    if (!Array.isArray(row) || !row[0]) {
      return res.status(400).json({ message: "Invalid or missing dispatch row data" });
    }

    const { size, density, quantity, remarks } = row[0];

    const order = await Order.findById(orderId);
    if (!order) {
      console.warn("❌ Order not found for ID:", orderId);
      return res.status(404).json({ message: "Order not found" });
    }

    // Save to DB
    const newSlip = new Slip({
      orderId,
      size,
      density,
      productName: order.product,
      quantity,
      remarks,
      type: "dispatch",
    });
    await newSlip.save();

    // Prepare data for PDF
    const rows = [{ size, density, quantity, remarks }];

    const filePath = path.join("uploads", "slips", `${order.shortId}_cutting.pdf`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    generateCuttingSlipPDF(order, rows, filePath);

    order.cuttingSlip = {
      filename: `${order.shortId}_cutting.pdf`,
      url: `/uploads/slips/${order.shortId}_cutting.pdf`,
    };

    await order.save();


    res.status(201).json({
      message: "Dispatch slip created and PDF generated",
      url: order.cuttingSlip.url,
    });
  } catch (error) {
    console.error("❌ Error creating dispatch slip:", error);
    res.status(500).json({ message: "Failed to create dispatch slip" });
  }
};


export const createPackagingSlip = async (req, res) => {
  try {
    const { orderId, productName, packagingWeight, packagingType, quantity, remarks } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Save to DB with all relevant fields
    const newSlip = new Slip({
      orderId,
      productName,
      quantity,
      remarks,
      packagingWeight,
      packagingType,
      type: 'packaging',
    });
    await newSlip.save();

    // Prepare data for PDF
    const rows = [
      {
        packagingWeight,
        packagingType,
        quantity,
        remarks,
      },
    ];

    const filePath = path.join('uploads', 'slips', `${order.shortId}_packaging.pdf`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Generate Packaging PDF
    await generatePackagingSlipPDF(order, rows, filePath);

    order.packagingSlip = {
      filename: `${order.shortId}_packaging.pdf`,
      url: `/uploads/slips/${order.shortId}_packaging.pdf`,
    };
    await order.save();

    res.status(201).json({ message: 'Packaging slip created and PDF generated', url: order.packagingSlip.url });
  } catch (error) {
    console.error('Error creating packaging slip:', error);
    res.status(500).json({ message: 'Failed to create packaging slip' });
  }
};



export const createDanaSlip = async (req, res) => {
  try {
    const { orderId, productName, rawMaterial, quantity, remarks } = req.body;

    if (!orderId || !rawMaterial || !quantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Save slip in DB
    const newSlip = new Slip({
      orderId,
      productName,
      rawMaterial,
      quantity,
      remarks,
      type: 'dana',
    });
    await newSlip.save();

    // Prepare directory & filename
    const slipDir = path.join("uploads", "slips");
    fs.mkdirSync(slipDir, { recursive: true });

    const filename = `${order.shortId}_dana.pdf`;
    const filePath = path.join(slipDir, filename);

    // Generate PDF with the slip data
    await generateDanaSlipPDF(order, { productName, rawMaterial, quantity, remarks }, filePath);

    // Save slip info to order document
    order.danaSlip = {
      filename,
      url: `/uploads/slips/${filename}`,
    };
    await order.save();

    res.status(200).json({ message: "Dana slip created", slip: order.danaSlip });
  } catch (err) {
    console.error("Error creating dana slip:", err);
    res.status(500).json({ message: "Failed to create dana slip", error: err.message });
  }
};
