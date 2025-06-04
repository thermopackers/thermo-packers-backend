import mongoose from 'mongoose';

const blockMouldingSchema = new mongoose.Schema({
  srNo: Number,
  date: String, // Format: YYYY-MM-DD
  mouldName: String,
  weightOfBlock: Number,
  noOfBlocks: Number,
}, { timestamps: true });

const BlockMouldingReport = mongoose.model('BlockMouldingReport', blockMouldingSchema);

export default BlockMouldingReport;
