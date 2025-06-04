import express from 'express';
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  issueAssets,
  getAllIssuedAssets,
} from '../controllers/assetsController.js';
import { authMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();
// Get all issued assets (admin only)
router.get('/all-assets',  authMiddleware(["admin","accounts"]), getAllIssuedAssets);

router.get('/my-assets',authMiddleware(), getAssets);
router.get('/:id', getAssetById);
router.post('/', createAsset);
router.put('/update-asset/:id', upload.array('assetImages', 10), updateAsset);
// router.put('/update-asset/:id', updateAsset);
router.delete('/delete-asset/:id', deleteAsset);
// Issue assets (protected route, e.g. only Accounts or Admin)
router.post('/issue',authMiddleware(["admin","accounts"]), upload.array('assetImages', 10), issueAssets); // 10 files max



export default router;
