import express from "express";
import Booking from "../models/Booking.js";
import User from "../models/user.js";
import { verifyToken, verifyAdmin } from "../middlewares/auth.js"; // make sure you have auth middleware

const router = express.Router();

// Existing routes here ...

// ---------------- Get User Details for Admin ----------------
router.get("/user/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const bookings = await Booking.find({ email: user.email }).lean();

    res.json({ success: true, user, bookings });
  } catch (err) {
    console.error("Error fetching user info:", err);
    res.status(500).json({ success: false, message: "Server error while fetching user info" });
  }
});// ================= Reports =================
async function fetchReport(range){
  try{
    const res = await fetch(`/bookings/analytics?range=${range}`,{
      headers:{"Authorization":"Bearer "+token}
    });
    const data = await res.json();
    if(!data.success){ alert("Error fetching report"); return; }

    const labels = data.revenue.map(r=>r.label); // use 'label' now instead of 'month'
    const amounts = data.revenue.map(r=>r.amount);

    const ctx = document.getElementById("reportChart").getContext("2d");
    if(window.reportChart) window.reportChart.destroy();

    window.reportChart = new Chart(ctx,{
      type:'bar',
      data:{
        labels: labels,
        datasets:[{
          label:'Revenue (₹)',
          data: amounts,
          backgroundColor:'#007bff'
        }]
      },
      options:{
        responsive:true,
        scales:{
          y:{ beginAtZero:true }
        },
        plugins:{
          legend:{ position:'top' },
          tooltip:{ mode:'index', intersect:false }
        }
      }
    });
  }catch(err){ 
    console.error(err); 
    alert("Error fetching report"); 
  }
}


export default router;
