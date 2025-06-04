import express from 'express';
import {
  getBlockMouldingReports,
  updateBlockMouldingReports,
} from '../controllers/blockMouldingController.js';
import { verifyToken } from '../middleware/auth.js'; // Assuming JWT auth middleware

const router = express.Router();

router.get('/block-moulding', verifyToken, getBlockMouldingReports);
router.post('/block-moulding-update', verifyToken, updateBlockMouldingReports);

export default router;
