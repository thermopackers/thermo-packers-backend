import express from "express";
import ToDo from "../models/ToDo.js";
import { authMiddleware } from "../middleware/auth.js";
import mongoose from "mongoose";
import upload from '../middleware/upload.js';
import { v2 as cloudinary } from 'cloudinary';
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
import sendWhatsAppNotification from "../utils/sendWhatsApp.js";

const router = express.Router();

// Create a task (admin/accounts only)
router.post(
  "/create",
  authMiddleware(["admin", "accounts"]),
    upload.array('files', 5), // This is used for multer, but not needed for cloudinary URLs
  async (req, res) => {
    console.log("POST /create called, user:", req.user);
    const { title, description, assignedTo, dueDate, repeat,images  } = req.body;
console.log("Received body:", req.body);
console.log("typeof images:", typeof req.body.images);

    try {

      if (!["admin", "accounts"].includes(req.user.role)) {
        console.log("User not authorized:", req.user.role);
        return res
          .status(403)
          .json({ message: "Not authorized to assign tasks" });
      }
      console.log("req.user:", req.user);
      console.log("assignedBy (from req.user.id):", req.user.id);
            const imageUrls = images || [];

      const task = new ToDo({
        title,
        description,
        assignedBy: req.user.id,
        assignedTo,
        dueDate,
        repeat: repeat || "ONE_TIME", // fallback to ONE_TIME
        assignedOn: new Date(),
        images: imageUrls, // ← store Cloudinary URLs directly
      });

      await task.save();
    
const updatedTaskUser = await User.findById(task.assignedTo);

if (updatedTaskUser?.phone) {
  await sendWhatsAppNotification(
    updatedTaskUser.phone,
   task.title // ensure this exists
  )
}


      console.log("Task saved:", task._id);
      res.status(201).json(task);
    } catch (err) {
      console.error("Error creating task:", err);
      res
        .status(500)
        .json({ message: "Failed to create task", error: err.message });
    }
  }
);

// Get tasks for logged-in user
router.get("/my-tasks", authMiddleware(), async (req, res) => {
  try {
    const tasks = await ToDo.find({ assignedTo: req.user.id }).populate(
      "assignedBy",
      "name role"
    );
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all tasks (admin/accounts)
router.get("/all", authMiddleware(), async (req, res) => {
  if (!["admin", "accounts"].includes(req.user.role)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // Parse query params
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const status = req.query.status || null; // e.g. 'DONE' or 'NOT DONE'
  const assignedTo = req.query.assignedTo; // user id to filter by

  // Build filter object
  const filter = {};
  if (status) filter.status = status;
  if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
    filter.assignedTo = assignedTo;
  }
  try {
    const totalCount = await ToDo.countDocuments(filter);

    const tasks = await ToDo.find(filter)
      .populate("assignedBy assignedTo", "name role")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ assignedOn: -1 });

    res.json({
      tasks,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark task as completed
// Mark task as completed with remarks
router.patch("/complete/:id", authMiddleware(),  upload.array('doneFiles', 5), async (req, res) => {
  try {
    const { doneRemarks } = req.body; // read remarks from request

    const task = await ToDo.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Only allow assigned user to mark done
    if (!task.assignedTo.equals(req.user.id)) {
      return res.status(403).json({ message: "Not your task" });
    }
 // Upload to Cloudinary
    const uploadedUrls = [];
    for (const file of req.files || []) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'todos',
          resource_type: 'auto', // this is important to handle PDFs
      });
      uploadedUrls.push(result.secure_url);
    }
    task.status = "DONE";
    task.doneRemarks = doneRemarks || ""; // save remarks
    task.doneOn = new Date(); // save done date
task.doneFiles = [...(task.doneFiles || []), ...uploadedUrls];

    await task.save();

    res.json({ message: "Task marked as completed", task });
  } catch (err) {
    console.error("Error marking task done:", err);
    res.status(500).json({ message: "Server error" });
  }
});


//to update
router.put("/:id", authMiddleware(["admin", "accounts"]), async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, status, doneRemarks } =
      req.body;

      const task = await ToDo.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Reset isDeletedByEmployee when admin or accounts update the task
    if (["admin", "accounts"].includes(req.user.role)) {
      task.isDeletedByEmployee = false;
    }
    
    // Detect if task was previously DONE
    const wasDone = task.status === "DONE";
    
    // Update fields
    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.assignedTo = assignedTo ?? task.assignedTo;
    task.dueDate = dueDate || null;
    task.images = req.body.images || task.images;
    

    // Set assignedOn only if it's a new assignment (optional)
    if (!task.assignedOn) {
      task.assignedOn = new Date();
    }
    
    if (status) {
      task.status = status;

      if (status === "DONE") {
        task.doneRemarks = doneRemarks || "";
        task.doneOn = new Date();
      } else if (status === "NOT DONE") {
        task.doneRemarks = "";
        task.doneOn = null;
      }
    } else {
      if (wasDone) {
        task.status = "NOT DONE";
        task.doneRemarks = "";
        task.doneOn = null;
      }
    }

    await task.save();

    // ✅ Send notification to assigned employee
   await Notification.create({
  user: task.assignedTo,
  message: `Your task "${task.title}" was updated by ${req.user.role}`,
link: `/employee/tasks/${task._id}`,
  read: false,
});

// sendEmail(to, subject, body)
const updatedTaskUser = await User.findById(task.assignedTo);

if (updatedTaskUser?.email) {
  await sendEmail(
    updatedTaskUser.email,
    'Task Updated',
    `Hi ${updatedTaskUser.name || "User"},\n\nYour task titled "${task.title}" has been updated by ${req.user.role}.\n\nPlease log in to your dashboard to view the latest updates.`
  );
}

    res.json({ message: "Task updated successfully", task });
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//to delete
// DELETE /todos/:id - Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const deletedTask = await ToDo.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//
router.patch("/employee-edit/:id", authMiddleware(), upload.array('doneFiles', 5), async (req, res) => {
  try {
    const { doneRemarks } = req.body;
    const task = await ToDo.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.assignedTo.equals(req.user.id)) {
      return res.status(403).json({ message: "You are not allowed to update this task" });
    }

    // Upload new files (if any)
    const uploadedUrls = [];
    for (const file of req.files || []) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'todos',
        resource_type: 'auto',
      });
      uploadedUrls.push(result.secure_url);
    }

    // Update doneFiles and remarks
    if (doneRemarks) task.doneRemarks = doneRemarks;
    if (uploadedUrls.length > 0) task.doneFiles.push(...uploadedUrls);

    // Optional: update doneOn again if desired
    task.doneOn = new Date();

    await task.save();
    res.json({ message: "Task updated successfully", task });
  } catch (err) {
    console.error("Error updating task by employee:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;