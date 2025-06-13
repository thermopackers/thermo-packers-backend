import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customerName: String,
  product: String,
  quantity: Number,
  price: String,
  density: String,
   stock: { type: Number, required: true, default: 0 }, // current available stock
  unit: { type: String, default: "pcs" },
  packagingCharge: Number,
  freight: String,
  freightAmount: {
  type: String,
  default: 0,
},
po: {
  type: String,
  required: true,
},
  poCopy: String,
  poOriginalName: String,
  date: Date,
  remarks: String,
  size: String,
  status: {
    type: String,
    enum: ["pending", "in process", "processed"],
    default: "pending",
  },
  dispatchStatus: {
    type: String,
    enum: ["not dispatched", "dispatched", "ready to dispatch"],
    default: "not dispatched",
  },
  requiredSections: {
    preExpander: { type: Boolean, default: false },
    shapeMoulding: { type: Boolean, default: false },
    
  },
  shortId: {
    type: String,
    required: true,
    unique: true,
  },  
  remainingToProduce: {
  type: Number,
  default: 0,
},
cuttingSlip: {
  filename: { type: String },
  url: { type: String },
},
shapeSlip: {
  filename: { type: String },
  url: { type: String },
},
packagingSlip: {
  filename: { type: String },
  url: { type: String },
},
danaSlip: {
  filename: { type: String },
  url: { type: String },
},
readyForPackaging: {
  type: Boolean,
  default: false,
},
packagingStatus: {
  type: String,
  enum: ["packaged", "unpackaged"],
  default: "unpackaged",
},
produced: {
  type: Number,
  default: 0,
},
  sentTo: {
    production: {
      type: [String], // e.g., ['cncSection', 'preExpander']
      default: [],
    },
    dispatch: {
      type: [String], // e.g., ['cutting', 'packing']
      default: [],
    },
        dispatchReady: { type: Boolean, default: false },  // Ready for dispatch from production


  },  
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set to current date/time
  },
});

export default mongoose.model("Order", orderSchema);
