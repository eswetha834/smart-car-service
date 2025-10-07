import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  code: { type: String },
  validTill: { type: Date }
}, { timestamps: true });

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
