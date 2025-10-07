import mongoose from "mongoose";
import Booking from "../models/Booking.js";  // relative path to Booking model

// connect to MongoDB (make sure this DB name matches your .env)
await mongoose.connect("mongodb://127.0.0.1:27017/car-service", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const servicePrices = {
  "Full Service": 2000,
  "Oil Change": 800,
  "Car Wash": 500,
  "Wheel Alignment": 1000
};
const carMultiplier = {
  "Sedan": 1,
  "SUV": 1.5,
  "Hatchback": 0.8,
  "Coupe": 1.2
  
};

// helper: make human-readable ID
function makeBookingId() {
  return "BK" + Math.floor(100000 + Math.random() * 900000);
}

// helper: check DB to avoid duplicates
async function generateUniqueBookingId() {
  for (let i = 0; i < 100; i++) {
    const id = makeBookingId();
    const found = await Booking.findOne({ bookingId: id }).lean();
    if (!found) return id;
  }
  throw new Error("Can't generate unique booking ID after many tries");
}

async function updateOldBookings() {
  const missing = await Booking.find({
    $or: [{ bookingId: { $exists: false } }, { bookingId: null }, { bookingId: "" }]
  });

  console.log("Found", missing.length, "old bookings to update");

  for (const b of missing) {
    try {
      b.bookingId = await generateUniqueBookingId();
      b.totalAmount = b.totalAmount || 
        (servicePrices[b.serviceType] || 0) * (carMultiplier[b.carModel] || 1);
      await b.save();
      console.log("Updated booking:", b._id, "=>", b.bookingId);
    } catch (err) {
      console.error("Failed to update booking", b._id, err);
    }
  }

  console.log("✅ Done updating old bookings");
  await mongoose.disconnect();
}

updateOldBookings().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
