import mongoose from "mongoose";

const configSchema = new mongoose.Schema({
  maxSlotsPerDay: { type: Number, default: 5 }
});

export default mongoose.model("Config", configSchema);
