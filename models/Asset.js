// models/Asset.js
import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  mobileNumber: String,
  issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assets: [
    {
      assetName: String,
      assetDescription: String,
            images: [String], // <-- Store image URLs

    },
  ],
}, { timestamps: true });  // <== Add this option);

export default mongoose.model('Asset', assetSchema);
