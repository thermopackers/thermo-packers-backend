// utils/getNextShortOrderId.js
import Counter from "../models/Counter.js";

const getNextShortOrderId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "orderId" },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  return counter.value; // returns 1, 2, 3, ...
};

export default getNextShortOrderId;
