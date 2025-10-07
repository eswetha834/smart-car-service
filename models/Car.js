import mongoose from "mongoose";

const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  multiplier: { type: Number, default: 1 },
});

const Car = mongoose.model("Car", carSchema);
export default Car;
