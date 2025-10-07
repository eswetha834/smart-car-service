import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  serviceType: String,
  carModel: String,
  customerName: String,
  email: String,
  phone: String,
  date: Date,
  status: { type: String, default: "Pending" },
  reviewCompleted: { type: Boolean, default: false },
  review: {
    rating: Number,
    comment: String,
  },
  messages: [String],
  totalAmount: Number,
  bookingId: String,
});

export default mongoose.model("Booking", BookingSchema);
