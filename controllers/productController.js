import Product from "../models/product.js";
import BackendProduct from "../models/BackendProducts.js";
import mongoose from "mongoose";

// Get all products
// Get all products with pagination
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;      
    const limit = parseInt(req.query.limit) || 12;   
    const skip = (page - 1) * limit;

    const filter = {};

    // Add category filter if present
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // If you want to support search by name
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    const total = await Product.countDocuments(filter);    // count filtered docs
    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching products" });
  }
};




//
// Route: GET /products/category-products?category=CategoryName
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }
    // Fetch all products for this category, no pagination needed for dropdown
    const products = await Product.find({ category }).select("name _id"); // select only necessary fields
    res.json({ products });
  } catch (error) {
    console.error("Error fetching category products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all products
export const getAllBackendProducts = async (req, res) => {
  try {
    const products = await BackendProduct.find().populate("inventoryHistory") // ✅ Populate the history

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
};

  //get a product by slug
  export const getProductBySlug = async (req, res) => {
    const { slug } = req.params;
    
    try {
      const products = await Product.findOne({ slug });
      
      if (!products) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(200).json(products);
    } catch (error) {
      console.error("Error fetching product by slug:", error);
      res.status(500).json({ message: "Server Error" });
    }
  };

//

export const inventory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const {
      previousStock,
      materialPacked,
      materialDispatch,
      stockStatus,
      quantity,
    } = req.body;

    const product = await BackendProduct.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (previousStock !== undefined) {
      product.previousStock = Number(previousStock);
    }
    if (materialPacked !== undefined) {
      product.materialPacked = (product.materialPacked || 0) + Number(materialPacked);
    }
    if (materialDispatch !== undefined) {
      product.materialDispatch = (product.materialDispatch || 0) + Number(materialDispatch);
    }
    if (quantity !== undefined) {
      product.quantity = Number(quantity);
    }
    if (stockStatus) {
      product.stockStatus = stockStatus;
    }

    // Calculate netStock on backend
    product.netStock =
      (product.quantity || 0) +
      (product.materialPacked || 0) -
      (product.materialDispatch || 0);

    await product.save();

    res.json(product); // netStock included

  } catch (error) {
    console.error("Inventory update error:", error.stack || error.message || error);
    res.status(500).json({ message: "Server error" });
  }
};

//
// POST /api/inventory/update
export const updateProductInventory = async (req, res) => {
  try {
    const { productId, date, previousStock, materialPacked, materialDispatch } = req.body;
    const netStock = previousStock + materialPacked - materialDispatch;

    const product = await BackendProduct.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existingEntryIndex = product.inventoryHistory.findIndex((entry) => entry.date === date);

    if (existingEntryIndex !== -1) {
      // Update existing entry
      product.inventoryHistory[existingEntryIndex] = {
        date,
        previousStock,
        materialPacked,
        materialDispatch,
        netStock,
      };
    } else {
      // Add new entry
      product.inventoryHistory.push({
        date,
        previousStock,
        materialPacked,
        materialDispatch,
        netStock,
      });
    }

    // Optionally update live fields
    product.materialPacked = materialPacked;
    product.materialDispatch = materialDispatch;
    product.quantity = netStock;

    await product.save();

    res.status(200).json({ message: 'Inventory updated', product });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product." });
  }
}