import mongoose from 'mongoose';

// Define the slip schema
const slipSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  remarks: { type: String },
  size: { type: String },         // for dispatch
  density: { type: String },      // for dispatch
  dryWeight: { type: String },    // for production
  type: { type: String, enum: ['production','packaging', 'dispatch','dana'], required: true },
});


// Create the Slip model
export const Slip = mongoose.model('Slip', slipSchema);
