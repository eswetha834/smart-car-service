document.addEventListener("DOMContentLoaded", () => {
  const usernameEl = document.getElementById("username");
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if(!token || !user){
    window.location.href = "/login.html";
    return;
  }

  usernameEl.innerText = user.username;

  document.getElementById("bookingPage").addEventListener("click", () => {
    window.location.href = "/booking.html";
  });

  document.getElementById("myBookings").addEventListener("click", () => {
    window.location.href = "/mybookings.html"; // You can create this page
  });

  document.getElementById("offers").addEventListener("click", () => {
    window.location.href = "/offers.html"; // Optional offers page
  });
});
function fetchUserProfile() {
  fetch("/auth/me", {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("token")
    }
  })
    .then(res => res.json())
    .then(data => {
      const user = data.user;
      document.getElementById("profileName").innerText = user.username;
      document.getElementById("profileEmail").innerText = user.email;
      document.getElementById("profilePhone").innerText = user.phone;
      document.getElementById("profilePic").src = user.profilePic; // persistent
    });
}

