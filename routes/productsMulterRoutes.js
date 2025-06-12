// routes/products.js
import express from "express";
import upload from '../middleware/upload.js'; // ✅ path may vary
import Product from "../models/BackendProducts.js";
import fs from "fs";

const router = express.Router();

router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const { name, unit, sizes, quantity } = req.body;
    const sizesArray = Array.isArray(sizes) ? sizes : JSON.parse(sizes || "[]");

    const product = new Product({
      name,
      unit,
      sizes: sizesArray,
      quantity,
      images: req.files.map(file => file.path), // ✅ Cloudinary URLs
    });

    await product.save();
    res.status(201).json({ message: "Product added", product });
  } catch (err) {
    console.error("Product creation error:", err);
    res.status(500).json({ error: "Failed to add product" });
  }
});



// List products with pagination & search
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = search
      ? { name: { $regex: search, $options: "i" } }
      : {};

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({ products, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to get product" });
  }
});

// Update product
router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { name, unit, sizes, quantity, removedImages } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const sizesArray = Array.isArray(sizes) ? sizes : JSON.parse(sizes || "[]");
    const removed = Array.isArray(removedImages)
      ? removedImages
      : removedImages
      ? [removedImages]
      : [];

    product.name = name;
    product.unit = unit;
    product.sizes = sizesArray;
    if (quantity != null) product.quantity = Number(quantity);

    // 🗑 Remove requested images
    if (removed.length > 0) {
      product.images = (product.images || []).filter(img => !removed.includes(img));

    
    }

    // ➕ Add new Cloudinary images
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => file.path); // ✅ Cloudinary URLs
      product.images = [...(product.images || []), ...newImageUrls];
    }

    await product.save();
    res.json({ message: "Product updated", product });
  } catch (err) {
    console.error("Product update error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});





// Delete product
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});
export default router;
