import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";
import Service from "./models/Service.js";
import Car from "./models/Car.js";
import Booking from "./models/Booking.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/car_service";

const sampleUsers = [
  {
    username: "Admin User",
    email: "admin@smartcar.com",
    password: "admin123",
    phone: "9876543210",
    role: "admin",
    loyaltyPoints: 0,
    profilePic: "/images/default-avatar.svg"
  },
  {
    username: "John Smith",
    email: "john@example.com",
    password: "user123",
    phone: "9876543211",
    role: "user",
    loyaltyPoints: 150,
    profilePic: "/images/default-avatar.svg"
  },
  {
    username: "Sarah Johnson",
    email: "sarah@example.com",
    password: "user123",
    phone: "9876543212",
    role: "user",
    loyaltyPoints: 320,
    profilePic: "/images/default-avatar.svg"
  },
  {
    username: "Mike Wilson",
    email: "mike@example.com",
    password: "user123",
    phone: "9876543213",
    role: "user",
    loyaltyPoints: 85,
    profilePic: "/images/default-avatar.svg"
  },
  {
    username: "Emily Davis",
    email: "emily@example.com",
    password: "user123",
    phone: "9876543214",
    role: "user",
    loyaltyPoints: 210,
    profilePic: "/images/default-avatar.svg"
  }
];

const sampleServices = [
  { name: "Basic Oil Change", price: 499 },
  { name: "Premium Oil Change", price: 799 },
  { name: "Battery Check & Replacement", price: 299 },
  { name: "Tire Rotation & Balancing", price: 599 },
  { name: "Wheel Alignment", price: 899 },
  { name: "Basic Car Wash", price: 399 },
  { name: "Premium Car Wash & Detailing", price: 999 },
  { name: "Engine Diagnostics", price: 699 },
  { name: "Engine Repair", price: 1499 },
  { name: "AC Service & Gas Refill", price: 699 },
  { name: "Brake Service", price: 799 },
  { name: "Transmission Service", price: 1999 },
  { name: "Suspension Check", price: 599 },
  { name: "Coolant Flush", price: 449 },
  { name: "Full Service Package", price: 2999 }
];

const sampleCars = [
  { name: "Maruti Suzuki Swift", multiplier: 1.0, price: 200 },
  { name: "Hyundai i20", multiplier: 1.0, price: 200 },
  { name: "Honda City", multiplier: 1.2, price: 300 },
  { name: "Toyota Innova", multiplier: 1.5, price: 500 },
  { name: "Mahindra XUV500", multiplier: 1.4, price: 450 },
  { name: "Tata Nexon", multiplier: 1.1, price: 250 },
  { name: "Kia Seltos", multiplier: 1.2, price: 300 },
  { name: "Skoda Rapid", multiplier: 1.1, price: 250 },
  { name: "Volkswagen Polo", multiplier: 1.0, price: 200 },
  { name: "Renault Kwid", multiplier: 0.9, price: 150 }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});
    await Car.deleteMany({});
    await Booking.deleteMany({});
    console.log("🗑️ Cleared existing data");

    // Insert users
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Inserted ${users.length} users`);

    // Insert services
    const services = await Service.insertMany(sampleServices);
    console.log(`✅ Inserted ${services.length} services`);

    // Insert cars
    const cars = await Car.insertMany(sampleCars);
    console.log(`✅ Inserted ${cars.length} cars`);

    // Create sample bookings with recent dates for analytics
    const now = new Date();
    const sampleBookings = [
      {
        customerName: "John Smith",
        email: "john@example.com",
        phone: "9876543211",
        carModel: "Honda City",
        serviceType: "Full Service Package",
        serviceId: services[14]._id,
        recurring: "none",
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: "razorpay",
        totalAmount: 3599,
        status: "Completed",
        userId: users[1]._id
      },
      {
        customerName: "John Smith",
        email: "john@example.com",
        phone: "9876543211",
        carModel: "Honda City",
        serviceType: "Basic Oil Change",
        serviceId: services[0]._id,
        recurring: "monthly",
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: "cod",
        totalAmount: 499,
        status: "Pending",
        userId: users[1]._id
      },
      {
        customerName: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "9876543212",
        carModel: "Toyota Innova",
        serviceType: "Engine Diagnostics",
        serviceId: services[7]._id,
        recurring: "none",
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: "razorpay",
        totalAmount: 839,
        status: "Completed",
        userId: users[2]._id
      },
      {
        customerName: "Sarah Johnson",
        email: "sarah@example.com",
        phone: "9876543212",
        carModel: "Toyota Innova",
        serviceType: "AC Service & Gas Refill",
        serviceId: services[9]._id,
        recurring: "none",
        date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: "paypal",
        totalAmount: 699,
        status: "Pending",
        userId: users[2]._id
      },
      {
        customerName: "Mike Wilson",
        email: "mike@example.com",
        phone: "9876543213",
        carModel: "Maruti Suzuki Swift",
        serviceType: "Premium Car Wash & Detailing",
        serviceId: services[6]._id,
        recurring: "quarterly",
        date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: "cod",
        totalAmount: 999,
        status: "Completed",
        userId: users[3]._id
      },
      {
        customerName: "Emily Davis",
        email: "emily@example.com",
        phone: "9876543214",
        carModel: "Kia Seltos",
        serviceType: "Tire Rotation & Balancing",
        serviceId: services[3]._id,
        recurring: "none",
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: "razorpay",
        totalAmount: 719,
        status: "Completed",
        userId: users[4]._id
      },
      {
        customerName: "Emily Davis",
        email: "emily@example.com",
        phone: "9876543214",
        carModel: "Kia Seltos",
        serviceType: "Brake Service",
        serviceId: services[10]._id,
        recurring: "none",
        date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: "gpay",
        totalAmount: 959,
        status: "Completed",
        userId: users[4]._id
      }
    ];

    const bookings = await Booking.insertMany(sampleBookings);
    console.log(`✅ Inserted ${bookings.length} bookings`);

    // Add reviews to completed bookings
    await Booking.findByIdAndUpdate(bookings[0]._id, {
      reviewCompleted: true,
      rating: 5,
      comment: "Excellent service! Very professional and on time."
    });
    await Booking.findByIdAndUpdate(bookings[2]._id, {
      reviewCompleted: true,
      rating: 4,
      comment: "Good service, but took a bit longer than expected."
    });
    await Booking.findByIdAndUpdate(bookings[4]._id, {
      reviewCompleted: true,
      rating: 5,
      comment: "Amazing detailing work! My car looks brand new."
    });
    await Booking.findByIdAndUpdate(bookings[6]._id, {
      reviewCompleted: true,
      rating: 4,
      comment: "Professional brake service. Would recommend."
    });

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("   Admin: admin@smartcar.com / admin123");
    console.log("   User: john@example.com / user123");
    console.log("   User: sarah@example.com / user123");
    console.log("   User: mike@example.com / user123");
    console.log("   User: emily@example.com / user123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
