// routes/customers.js
import express from "express";
import Customer from "../models/Customer.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, company, phone, email, address } = req.body;

    const newCustomer = new Customer({ name, company, phone, email, address });
    await newCustomer.save();

    res.status(201).json({ message: "Customer added successfully", customer: newCustomer });
  } catch (err) {
    console.error("Add customer error:", err);
    res.status(500).json({ error: "Failed to add customer" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = search
      ? { name: { $regex: search, $options: "i" } }
      : {};
    const customers = await Customer.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await Customer.countDocuments(query);
    res.json({ customers, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get single customer
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: "Failed to get customer" });
  }
});

// Update customer
router.put("/:id", async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Customer not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update customer" });
  }
});

// Delete customer
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete customer" });
  }
});
export default router;

// Get all customer names for dropdown
router.get("/all/dropdown", async (req, res) => {
  try {
    const customers = await Customer.find({}, "_id name"); // only _id and name
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers for dropdown" });
  }
});
