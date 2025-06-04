import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: String,
    productSize: String,
    sizes: String,
    image: String,
    weight: String,
    itemCode: String,
    gst: String,
    images: [String],
    price: String,
    minOrderQty: Number,
    unit: String,
    category: String,
    specifications: mongoose.Schema.Types.Mixed,
    description: String,
    features: [String],
    availableOptions: mongoose.Schema.Types.Mixed,
    diameter: String,
    size: {
      outer: String,
      inner: String,
    },
    sizesAvailable: [
      {
        id: String,
        inner: String,
        outer: String,
      },
    ],
    usage: String,
    color: String,
    condition: String,
    capacity: String,
    productionCapacity: String,
    deliveryTime: String,
    isCustomized: Boolean,
    compartment: String,
    depth: String,
    quantityPerPack: String,
    availableSizes: [Number],
    packSize: String,
    cover: String,
    microwaveSafe: Boolean,
    sheetsPerPack: Number,
    type: String,
    sizeDimensions: String,
    additionalInfo: Object,
    gradeStandard: String,
    dealIn: String,
    origin: String,
    slug: { type: String, unique: true },
    productionDetails: {
      productionCapacity: String,
      deliveryTime: String,
    },
    thickness: String,
    printing: String,
    shape: String,
    packagingSize: String,
    density: String,
    temperatureRange: String,
    material: String,
    usageApplication: String,
    brand: String,
    countryOfOrigin: String,
    driveLink: String, // <-- ✅ Add this

    // ✅ Inventory management fields
    stockStatus: {
      type: String,
      enum: ["In Stock", "Out of Stock"],
      default: "In Stock",
    },

    materialPacked: { type: Number, default: 0 },
    materialDispatch: { type: Number, default: 0 },

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


  },

  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
