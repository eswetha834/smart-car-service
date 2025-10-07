// script.js
const API_BASE = "http://localhost:3000";


const form = document.getElementById("bookingForm");
const bookingsList = document.getElementById("bookingsList");
const refreshBtn = document.getElementById("refreshBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const serviceType = document.getElementById("serviceType").value.trim();
  const carModel = document.getElementById("carModel").value.trim();
  const customerName = document.getElementById("customerName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const dateInput = document.getElementById("date").value; // datetime-local

  // Convert datetime-local to ISO string or send null if not provided
  const date = dateInput ? new Date(dateInput).toISOString() : null;

  // Prepare payload; send both customerName and name for compatibility
  const payload = {
    serviceType,
    carModel,
    customerName,
    name: customerName,
    email,
    phone,
    date,
    status: "Pending"
  };

  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Failed to create booking");

    // Add the new booking to the top of the list
    prependBooking(data.booking || data);
    form.reset();
    console.log("Booking created:", data);
  } catch (err) {
    console.error("Create error:", err);
    alert("Failed to create booking: " + err.message);
  }
});

refreshBtn.addEventListener("click", loadBookings);

async function loadBookings() {
  bookingsList.innerHTML = "Loading…";
  try {
    const res = await fetch(`${API_BASE}/bookings`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load bookings");
    renderBookings(data.bookings || []);
  } catch (err) {
    bookingsList.innerHTML = "Error loading bookings";
    console.error(err);
  }
}

function renderBookings(list) {
  if (!list.length) {
    bookingsList.innerHTML = "<em>No bookings yet.</em>";
    return;
  }
  bookingsList.innerHTML = "";
  list.forEach(b => {
    bookingsList.appendChild(createBookingElement(b));
  });
}

function prependBooking(b) {
  if (!b) return;
  const el = createBookingElement(b);
  bookingsList.prepend(el);
}

function createBookingElement(b) {
  const div = document.createElement("div");
  div.className = "booking";

  const info = document.createElement("div");
  info.innerHTML = `
    <strong>${b.customerName || b.name || "—"}</strong>
    <div class="meta">${b.serviceType || '—'} • ${b.carModel || '—'} • ${b.email || ''} ${b.phone ? '• ' + b.phone : ''}</div>
    <div class="meta">${b.status || 'Pending'} • ${b.date ? new Date(b.date).toLocaleString() : ''}</div>
  `;

  const actions = document.createElement("div");
  actions.className = "actions";

  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = b.status === "Completed" ? "Mark Pending" : "Mark Completed";
  toggleBtn.onclick = () => updateStatus(b._id, b.status === "Completed" ? "Pending" : "Completed", div);

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete";
  deleteBtn.onclick = () => deleteBooking(b._id, div);

  actions.appendChild(toggleBtn);
  actions.appendChild(deleteBtn);

  div.appendChild(info);
  div.appendChild(actions);

  return div;
}

async function updateStatus(id, newStatus, element) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Update failed");

    // Replace booking element with updated one
    const newEl = createBookingElement(data.booking);
    element.replaceWith(newEl);
  } catch (err) {
    console.error("Update error:", err);
    alert("Update failed: " + err.message);
  }
}

async function deleteBooking(id, element) {
  if (!confirm("Delete this booking?")) return;
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Delete failed");

    element.remove();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Delete failed: " + err.message);
  }
}

// Load bookings when page loads
loadBookings();
