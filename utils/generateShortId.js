// utils/generateShortId.js
import Counter from "../models/Counter.js";

const getNextShortOrderId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "orderId" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const base36 = counter.value.toString(36); // Convert number to base36
  return `TP${base36}`;
};

export default getNextShortOrderId;
