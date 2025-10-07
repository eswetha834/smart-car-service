import express from "express";
import Car from "../models/Car.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";

// Middleware: Verify Token
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// Middleware: Admin only
function verifyAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
}

// Get all cars
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const cars = await Car.find().lean();
    res.json(cars);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add car
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  const { name, multiplier, price } = req.body;
  if (!name || !price) return res.status(400).json({ success: false, message: "Name and price required" });

  try {
    const car = new Car({ name, multiplier, price });
    await car.save();
    res.json({ success: true, message: "Car added successfully", car });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update car
router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { name, multiplier, price } = req.body;
  try {
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { name, multiplier, price },
      { new: true }
    );
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });
    res.json({ success: true, message: "Car updated successfully", car });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete car
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: "Car not found" });

    await Car.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: "Car deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
