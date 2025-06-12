// routes/notificationRoutes.js
import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import { markNotificationsAsRead } from '../controllers/notificationController.js';
const router = express.Router();

router.get('/:userId', getNotifications);
router.patch('/read/:id', markAsRead);
// routes/notifications.js or in your notification controller
router.patch('/mark-read/:userId', markNotificationsAsRead);

export default router;
