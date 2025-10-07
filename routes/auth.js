import express from "express";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { verifyToken } from "../middleware/auth.js";

dotenv.config();
const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || "fallbackSecret";

// Register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
    res.status(201).json({ message: "Registration successful", token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Verify token
router.get("/me", verifyToken, (req, res) => {
  res.json({ message: "Token valid", user: req.user });
});

export default router;
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, req.user.id + path.extname(file.originalname)); // e.g., 1.png
  }
});

export const upload = multer({ storage });
app.post("/auth/upload-profile", verifyToken, upload.single("profilePic"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Save uploaded picture path
    user.profilePic = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ success: true, message: "Profile picture updated", profilePic: user.profilePic });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
