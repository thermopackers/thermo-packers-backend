// controllers/notificationController.js
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  const { userId } = req.params;
  const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
  res.json(notifications);
};

export const markAsRead = async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  res.json(notification);
};

export const markNotificationsAsRead = async (req, res) => {
  const { userId } = req.params;

  try {
    await Notification.updateMany(
      { user: new mongoose.Types.ObjectId(userId), read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: "Notifications marked as read" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};