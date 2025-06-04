import express from 'express';
import { deleteUser, getUsers, loginWithGoogle, updateUser } from '../controllers/userController.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Login route for Google
router.post('/login/google', loginWithGoogle);

// Get current user info (protected)
router.get('/me', authMiddleware(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Get all employees
router.get('/employees', authMiddleware(), async (req, res) => {
    try {
      const employees = await User.find({ role: { $in: ['sales', 'admin'] } }).select('-password');
      res.json(employees);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
//get users
router.get('/get-all-users',getUsers)
router.get('/get-all-users', authMiddleware(['admin', 'accounts']), getUsers); // View all users
router.put('/update-user/:id', authMiddleware(['admin', 'accounts']), updateUser); // Edit user details
router.delete('/delete-user/:id', authMiddleware(['admin', 'accounts']), deleteUser); // Delete user

export default router;
