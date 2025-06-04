import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'sales', 'accounts', 'production', 'dispatch', 'packaging'],
      default: 'sales',
    },
    phone: String,
designation: String,

 // Add this field for production sub-section
    productionSection: {
      type: String,
      enum: ['shapeMoulding', 'other'], // add as many as needed
      default: null, // or you can default to "other"
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
