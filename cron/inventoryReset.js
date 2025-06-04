import cron from "node-cron";
import Product from "../models/BackendProducts.js";
import moment from "moment-timezone";

export const startInventoryResetJob = () => {
  // Run every day at 11:23 PM for example
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Running daily inventory reset job...");

    try {
      const products = await Product.find({});

const currentDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

      for (const product of products) {
        const {
          quantity,
          materialPacked = 0,
          materialDispatch = 0,
        } = product;

        const netStock = quantity + materialPacked - materialDispatch;

        // Add today's history
        product.inventoryHistory.push({
          date: currentDate,
          previousStock: quantity,
          materialPacked,
          materialDispatch,
          netStock,
        });

        // Update quantity and reset packed/dispatch
        product.quantity = 0;
      product.materialPacked = 0;
      product.materialDispatch = 0;
      product.netStock = 0;        // If you have this field saved in the schema
      product.stockStatus = "Out of Stock";  // Reset to default status (string)

        // // Set stockStatus here based on netStock
        // product.stockStatus = netStock > 0 ? "In Stock" : "Out of Stock";

        await product.save();
      }

      console.log("✅ Inventory reset and history logged.");
    } catch (error) {
      console.error("❌ Error resetting inventory:", error);
    }
  });
};
