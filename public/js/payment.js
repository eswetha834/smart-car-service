// ===============================
// Payment.js
// ===============================

// Handle Proceed to Pay button
document.getElementById("proceedPay").addEventListener("click", async () => {
  const f = document.getElementById("bookingForm");
  const bookingData = {
    customerName: f.customerName.value,
    email: f.email.value,
    phone: f.phone.value,
    carModel: f.carModel.value,
    serviceType: f.serviceType.value,
    date: f.date.value,
    paymentMethod: f.paymentMethod.value
  };

  try {
    const res = await fetch("/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData)
    });
    const result = await res.json();

    if (!res.ok || !result) {
      document.getElementById("message").innerText =
        result.message || "Booking error";
      return;
    }

    // Redirect or open payment gateway
    if (bookingData.paymentMethod === "razorpay") {
      const options = {
        key: result.key || "YOUR_RAZORPAY_KEY_ID",
        amount: result.amount || 50000, // example ₹500
        currency: "INR",
        name: "Smart Car Service",
        description: "Service Booking",
        order_id: result.orderId,
        handler: function (response) {
          alert("Razorpay Payment successful! ID: " + response.razorpay_payment_id);
          // TODO: send to backend to mark booking as Paid
        },
        prefill: {
          name: bookingData.customerName,
          email: bookingData.email,
          contact: bookingData.phone
        }
      };
      new Razorpay(options).open();

    } else if (bookingData.paymentMethod === "paypal") {
      window.location.href = result.paypalUrl || "https://www.paypal.com/checkout";

    } else if (bookingData.paymentMethod === "paytm") {
      window.location.href = result.paytmUrl || "https://paytm.com";

    } else if (bookingData.paymentMethod === "gpay") {
      window.location.href =
        "upi://pay?pa=yourupi@okaxis&pn=SmartCarService&mc=1234&tid=txn123&tr=order123&tn=Car+Service+Payment&am=" +
        (result.amount / 100) +
        "&cu=INR";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("message").innerText = "Server error";
  }
});

// ===============================
// Razorpay standalone button (optional)
// ===============================
document.getElementById("razorpayBtn")?.addEventListener("click", async () => {
  const res = await fetch("/payment/razorpay/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 500, bookingId: "12345" })
  });
  const order = await res.json();

  var options = {
    key: "YOUR_RAZORPAY_KEY_ID",
    amount: order.amount,
    currency: order.currency,
    order_id: order.id,
    name: "Smart Car Service",
    description: "Booking Payment",
    handler: function (response) {
      alert("Payment Successful: " + response.razorpay_payment_id);
      // TODO: send to backend to mark booking Paid
    }
  };
  var rzp = new Razorpay(options);
  rzp.open();
});

// ===============================
// PayPal Button
// ===============================
if (document.getElementById("paypal-button-container")) {
  paypal.Buttons({
    createOrder: function (data, actions) {
      return actions.order.create({
        purchase_units: [{ amount: { value: "10.00" } }]
      });
    },
    onApprove: function (data, actions) {
      return actions.order.capture().then(function (details) {
        alert("Payment Completed by " + details.payer.name.given_name);
        // TODO: send to backend to mark booking Paid
      });
    }
  }).render("#paypal-button-container");
}
