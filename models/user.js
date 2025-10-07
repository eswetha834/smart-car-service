import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, default: "user" },
  loyaltyPoints: { type: Number, default: 0 },
  profilePic: { type: String, default: "/images/default-avatar.png" }, // <-- new field
  cars: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }] // for multiple cars
});

export default mongoose.model("User", userSchema);
