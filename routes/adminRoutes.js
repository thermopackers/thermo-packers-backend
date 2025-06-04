import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const router = express.Router();


// Route: GET /api/admin/summary
router.get('/summary', authMiddleware(['admin']), async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);

    // Group products
    const productCounts = {};
    const monthlyOrders = new Array(12).fill(0);    // Jan-Dec
    const monthlyRevenue = new Array(12).fill(0);   // Jan-Dec

    orders.forEach(order => {
      if (order.product) {
        productCounts[order.product] = (productCounts[order.product] || 0) + 1;
      }
      const month = new Date(order.date).getMonth(); // 0-11
      monthlyOrders[month]++;
      monthlyRevenue[month] += order.price || 0;
    });

    const topProducts = Object.entries(productCounts)
      .map(([product, count]) => ({ product, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

// Get users from each department
const salesEmployees = await User.find({ role: 'sales' }).select('name _id');
const accountsEmployees = await User.find({ role: 'accounts' }).select('name _id');
const productionEmployees = await User.find({ role: 'production' }).select('name _id');
const dispatchEmployees = await User.find({ role: 'dispatch' }).select('name _id');
const packagingEmployees = await User.find({ role: 'packaging' }).select('name _id');

res.json({
    totalOrders,
    totalRevenue,
    topProducts,
    departments: {
      sales: salesEmployees,
  accounts: accountsEmployees,
      production: productionEmployees,
      dispatch: dispatchEmployees,
      dispatch: packagingEmployees,
    },
    monthlyOrders,
    monthlyRevenue
  });
  

  } catch (err) {
    console.error('Error in admin summary:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
