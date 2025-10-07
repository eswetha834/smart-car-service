
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import multer from "multer";
import fs from "fs";
import Car from "./models/Car.js";
import User from "./models/user.js";
import Booking from "./models/Booking.js";
import Service from "./models/Service.js";
import adminRoutes from "./routes/admin.js";
import bookingRoutes from './routes/bookings.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

app.use('/booking', bookingRoutes);
app.use('/admin', adminRoutes);

// ---------------- Middleware ----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ---------------- Database ----------------
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ---------------- Razorpay ----------------
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});
import adminCarRoutes from "./routes/adminCars.js";
app.use("/admin/cars", adminCarRoutes);

// ---------------- Multer Setup ----------------
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, req.user.id + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ---------------- Auth Middleware ----------------
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

function verifyAdmin(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admins only" });
  next();
}

// ---------------- Auth Routes ----------------
app.post("/auth/register", async (req, res) => {
  const { username, email, password, phone } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = new User({ username, email, password, phone, loyaltyPoints: 0 });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.status(201).json({ message: "Registration successful", token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------------- Upload Profile Picture ----------------
app.post(
  "/auth/upload-profile",
  verifyToken,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.profilePic = `/uploads/${req.file.filename}`;
      await user.save();

      res.json({
        success: true,
        message: "Profile picture updated",
        profilePic: user.profilePic,
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);
// Booking Route
app.post("/bookings", verifyToken, async (req, res) => {
  try {
    const { serviceType, carModel, customerName, email, phone, date, recurring, paymentMethod } = req.body;
    if (!serviceType || !carModel || !customerName || !date || !paymentMethod)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    const service = await Service.findOne({ name: serviceType });
    if (!service) return res.status(400).json({ success: false, message: "Invalid service" });

    // Fetch car multiplier dynamically
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
app.post("/bookings", verifyToken, async (req, res) => {
  const { serviceType, carModel, customerName, email, phone, date, recurring, paymentMethod } = req.body;

  // Validate required fields
  if (!serviceType || !carModel || !customerName || !date || !paymentMethod) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Fetch service
  const service = await Service.findOne({ name: serviceType });
  if (!service) return res.status(400).json({ success: false, message: "Invalid service" });

  // Fetch car multiplier dynamically
  const car = await Car.findOne({ name: carModel });
  const multiplier = car?.multiplier || 1;

  const totalAmount = service.price * multiplier;

  // Create booking
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
});

// Booking page cars fetch
app.get("/booking/cars", verifyToken, async (req, res) => {
  try {
    const cars = await Car.find().lean();
    res.json(cars.map(c => ({ name: c.name, price: c.price, multiplier: c.multiplier || 1 })));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- User Profile ----------------
app.get("/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const completedBookings = await Booking.find({
      email: user.email,
      status: "Completed",
    });
    user.loyaltyPoints = completedBookings.length * 10;
    await user.save();

    const bookingsCount = await Booking.countDocuments({ email: user.email });
    res.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        phone: user.phone || "N/A",
        bookingsCount,
        loyaltyPoints: user.loyaltyPoints,
        profilePic: user.profilePic || "/images/default-avatar.png",
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------------- Bookings ----------------
app.post("/bookings", verifyToken, async (req, res) => {
  try {
    const {
      serviceType,
      carModel,
      customerName,
      email,
      phone,
      date,
      recurring,
      paymentMethod,
    } = req.body;

    if (!serviceType || !carModel || !customerName || !date || !paymentMethod)
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });

    const service = await Service.findOne({ name: serviceType });
    if (!service)
      return res.status(400).json({ success: false, message: "Invalid service" });

    const carMultiplier = { Sedan: 1, SUV: 1.5, Hatchback: 0.8, Coupe: 1.2 };
    const totalAmount = service.price * (carMultiplier[carModel] || 1);

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
    res
      .status(201)
      .json({ success: true, message: "Booking created successfully", booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/bookings/user", verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ email: req.user.email }).lean();
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------------- Submit Review ----------------
app.post("/bookings/:id/review", verifyToken, async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "Completed")
      return res
        .status(400)
        .json({ message: "Only completed bookings can be reviewed" });
    if (booking.reviewCompleted)
      return res.status(400).json({ message: "Review already submitted" });

    booking.review = { rating, comment };
    booking.reviewCompleted = true;
    await booking.save();

    res.json({
      success: true,
      message: "Review submitted successfully",
      booking,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------------- Get All Reviews ----------------
app.get("/reviews", verifyToken, async (req, res) => {
  try {
    const reviews = await Booking.find({
      reviewCompleted: true,
    })
      .select("customerName review _id")
      .lean();
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ---------------- Admin Routes ----------------
app.get("/admin/bookings", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post(
  "/admin/bookings/:id/complete",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      booking.status = "Completed";
      await booking.save();
      res.json({ success: true, message: "Booking marked as completed" });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

app.post(
  "/admin/bookings/:id/message",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { message } = req.body;
      if (!message)
        return res.status(400).json({ message: "Message is required" });

      const booking = await Booking.findById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      booking.messages.push(message);
      await booking.save();
      res.json({ success: true, message: "Message sent successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// ---------------- Admin Booking Delete with Warning ----------------
app.delete(
  "/admin/bookings/:id",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking)
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });

      // ⚠️ Warning: This action is permanent
      if (req.query.confirm !== "true") {
        return res.json({
          success: false,
          message:
            "⚠️ Warning: Deleting this booking is permanent. Add ?confirm=true to the request to confirm.",
        });
      }

      await Booking.deleteOne({ _id: req.params.id });
      res.json({ success: true, message: "Booking deleted successfully" });
    } catch (err) {
      res
        .status(500)
        .json({ success: false, message: "Server error while deleting booking" });
    }
  }
);

// ---------------- Admin Service Delete with Warning ----------------
app.delete("/admin/services/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });

    // ⚠️ Warning: This action is permanent
    if (req.query.confirm !== "true") {
      return res.json({
        success: false,
        message:
          "⚠️ Warning: Deleting this service is permanent. Add ?confirm=true to the request to confirm.",
      });
    }

    await Service.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- Admin Service Routes ----------------
app.get("/admin/services", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const services = await Service.find().lean();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

app.post("/admin/services", verifyToken, verifyAdmin, async (req, res) => {
  const { name, price } = req.body;
  if (!name || !price)
    return res
      .status(400)
      .json({ success: false, message: "Name and price are required" });
  try {
    const service = new Service({ name, price });
    await service.save();
    res.json({ success: true, message: "Service added successfully", service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/admin/services/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { name, price } = req.body;
  if (!name || !price)
    return res
      .status(400)
      .json({ success: false, message: "Name and price are required" });
  try {
    const service = await Service.findById(req.params.id);
    if (!service)
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });

    service.name = name;
    service.price = price;
    await service.save();
    res.json({ success: true, message: "Service updated successfully", service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- Get single user + their bookings ----------------
app.get("/admin/user/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const bookings = await Booking.find({ userId: user._id }).lean();
    const completedBookings = bookings.filter(b => b.status === "Completed");
    user.loyaltyPoints = completedBookings.length * 10;

    res.json({
      success: true,
      user,
      bookings
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ success: false, message: "Server error fetching user" });
  }
});

// ---------------- Public Service Route ----------------
app.get("/services", async (req, res) => {
  try {
    const services = await Service.find().lean();
    res.json(services);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching services" });
  }
});

// ---------------- Serve HTML Pages ----------------
app.get("/dashboard.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "dashboard.html"))
);
app.get("/booking.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "booking.html"))
);
app.get("/login.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "login.html"))
);
app.get("/admin.html", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin.html"))
);
app.get("/bookings/top-services", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().lean();
    const serviceCount = {};
    bookings.forEach(b => {
      serviceCount[b.serviceType] = (serviceCount[b.serviceType] || 0) + 1;
    });
    const topServices = Object.entries(serviceCount)
      .sort((a,b) => b[1]-a[1])
      .slice(0,5)
      .map(([serviceType,count]) => ({ serviceType, count }));

    res.json({ success:true, topServices });
  } catch(err){
    res.status(500).json({ success:false, message: err.message });
  }
});
app.use((req,res,next)=>{
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});
// ---------------- Booking Analytics for Dashboard ----------------
app.get("/bookings/analytics", verifyToken, async (req, res) => {
  try {
    const range = req.query.range || "6months"; // default range
    const bookings = await Booking.find().lean();
    const now = new Date();

    let revenue = [];
    if(range === "weekly") {
      // Last 7 days
      for(let i=6; i>=0; i--){
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const dayStr = day.toISOString().split('T')[0]; // YYYY-MM-DD
        const dayBookings = bookings.filter(b=>{
          if(!b.date || b.status!=="Completed") return false;
          const bDate = new Date(b.date).toISOString().split('T')[0];
          return bDate === dayStr;
        });
        const amount = dayBookings.reduce((sum,b)=>sum+(b.totalAmount||0),0);
        revenue.push({ label: dayStr, amount });
      }
    } else if(range === "monthly") {
      // Last 30 days grouped by date
      for(let i=29;i>=0;i--){
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const dayStr = day.toISOString().split('T')[0]; // YYYY-MM-DD
        const dayBookings = bookings.filter(b=>{
          if(!b.date || b.status!=="Completed") return false;
          const bDate = new Date(b.date).toISOString().split('T')[0];
          return bDate === dayStr;
        });
        const amount = dayBookings.reduce((sum,b)=>sum+(b.totalAmount||0),0);
        revenue.push({ label: dayStr, amount });
      }
    } else if(range === "6months") {
      // Last 6 months grouped by month
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      for(let i=5;i>=0;i--){
        const d = new Date(now);
        d.setMonth(now.getMonth()-i);
        const monthStr = monthNames[d.getMonth()] + "-" + d.getFullYear();
        const monthBookings = bookings.filter(b=>{
          if(!b.date || b.status!=="Completed") return false;
          const bDate = new Date(b.date);
          return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
        });
        const amount = monthBookings.reduce((sum,b)=>sum+(b.totalAmount||0),0);
        revenue.push({ label: monthStr, amount });
      }
    } else if(range === "yearly") {
      // Last 12 months grouped by month
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      for(let i=11;i>=0;i--){
        const d = new Date(now);
        d.setMonth(now.getMonth()-i);
        const monthStr = monthNames[d.getMonth()] + "-" + d.getFullYear();
        const monthBookings = bookings.filter(b=>{
          if(!b.date || b.status!=="Completed") return false;
          const bDate = new Date(b.date);
          return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
        });
        const amount = monthBookings.reduce((sum,b)=>sum+(b.totalAmount||0),0);
        revenue.push({ label: monthStr, amount });
      }
    }

    // Overall stats
    const completed = bookings.filter(b=>b.status==="Completed").length;
    const pending = bookings.filter(b=>b.status!=="Completed").length;

    const serviceCount = {};
    bookings.forEach(b=>{
      serviceCount[b.serviceType] = (serviceCount[b.serviceType] || 0) + 1;
    });
    const topServices = Object.entries(serviceCount)
      .sort((a,b)=> b[1]-a[1])
      .slice(0,5)
      .map(([serviceType,count])=>({ serviceType, count }));

    res.json({
      success: true,
      revenue,
      completed,
      pending,
      topServices
    });
  } catch(err){
    res.status(500).json({ success:false, message: err.message });
  }
});


// ---------------- Start Server ----------------
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
