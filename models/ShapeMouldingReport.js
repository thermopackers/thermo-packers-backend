import mongoose from 'mongoose';

const ShapeMouldingSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  product: { type: String, required: true },
  operator: { type: String },
  cycle: { type: Number, default: 0 },
  pcs: { type: Number, default: 0 },
  dryWt: { type: Number, default: 0 },
  rejects: { type: Number, default: 0 },
}, { timestamps: true });

const ShapeMouldingReport = mongoose.model('ShapeMouldingReports', ShapeMouldingSchema);
export default ShapeMouldingReport;
