import express from "express";
import Razorpay from "razorpay";
import paypal from "paypal-rest-sdk";
import Booking from "../models/Booking.js";

const router = express.Router();

// ✅ Razorpay Setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

router.post("/razorpay/create-order", async (req, res) => {
  const { amount, bookingId } = req.body;
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${bookingId}`,
    });
    res.json(order);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ✅ PayPal Setup
paypal.configure({
  mode: "sandbox", // "live" for production
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

router.post("/paypal/create", (req, res) => {
  const { amount } = req.body;

  const create_payment_json = {
    intent: "sale",
    payer: { payment_method: "paypal" },
    redirect_urls: {
      return_url: "http://localhost:3000/payment/paypal/success",
      cancel_url: "http://localhost:3000/payment/paypal/cancel",
    },
    transactions: [{
      amount: { currency: "USD", total: amount },
      description: "Car Service Booking Payment"
    }]
  };

  paypal.payment.create(create_payment_json, (error, payment) => {
    if (error) {
      res.status(500).json(error);
    } else {
      res.json(payment);
    }
  });
});

export default router;
