import express from "express";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import Car from "../models/Car.js"; // Make sure you have a Car model
import jwt from "jsonwebtoken";

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || "your_secret_key";

// ---------------- Auth Middleware ----------------
export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// ---------------- Create Booking ----------------
router.post("/", verifyToken, async (req, res) => {
  try {
    const { serviceType, carModel, customerName, email, phone, date, recurring, paymentMethod } = req.body;
    if (!serviceType || !carModel || !customerName || !date || !paymentMethod)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    const service = await Service.findOne({ name: serviceType });
    if (!service) return res.status(400).json({ success: false, message: "Invalid service" });

    const car = await Car.findOne({ name: carModel });
    const multiplier = car?.multiplier || 1;
    const totalAmount = service.price * multiplier;

    const booking = new Booking({
      serviceType,
      carModel,
      customerName,
      email,
      phone,
      date: new Date(date),
      recurring: recurring || "none",
      totalAmount,
      paymentMethod,
      status: paymentMethod === "cod" ? "Pending" : "Paid",
      reviewCompleted: false,
      review: null,
      messages: [],
      userId: req.user.id,
    });

    await booking.save();
    res.status(201).json({ success: true, message: "Booking created successfully", booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- Get All Cars for Booking Page ----------------
router.get("/cars", verifyToken, async (req, res) => {
  try {
    const cars = await Car.find().lean();
    res.json(cars.map(c => ({ name: c.name, price: c.price, multiplier: c.multiplier || 1 })));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- Get User's Bookings ----------------
router.get("/user", verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).lean();
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------------- Submit Review ----------------
router.post("/:id/review", verifyToken, async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "Completed")
      return res.status(400).json({ message: "Only completed bookings can be reviewed" });
    if (booking.reviewCompleted)
      return res.status(400).json({ message: "Review already submitted" });

    booking.review = { rating, comment };
    booking.reviewCompleted = true;
    await booking.save();

    res.json({ success: true, message: "Review submitted successfully", booking });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------------- Get All Reviews ----------------
router.get("/reviews", verifyToken, async (req, res) => {
  try {
    const reviews = await Booking.find({ reviewCompleted: true })
      .select("customerName review _id")
      .lean();
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
