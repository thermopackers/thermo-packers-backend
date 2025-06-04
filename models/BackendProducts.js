import mongoose from 'mongoose';

const backendProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  unit: {
    type: String,
    required: true,
    trim: true,
        // default: "",

  },
  sizes: {
    type: [String],
    default: [],
  },
images: {
  type: [String], // Array of strings
  required: false,
  default: [],
},

   // ✅ Inventory management fields
    stockStatus: {
      type: String,
      enum: ["In Stock", "Out of Stock"],
      default: "In Stock",
    },

    materialPacked: { type: Number, default: 0 },
    materialDispatch: { type: Number, default: 0 },
  netStock: { type: Number, default: 0 },

    quantity: { type: Number, default: 0 },
    inventoryHistory: [
  {
    date: String, // 'YYYY-MM-DD'
    previousStock: Number,
    materialPacked: Number,
    materialDispatch: Number,
    netStock: Number,
  }
],
}, {
  timestamps: true,
});

const Product = mongoose.model('BackendProducts', backendProductSchema);

export default Product;
