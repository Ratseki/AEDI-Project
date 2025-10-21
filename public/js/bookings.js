console.log("✅ bookings.js loaded");

let selectedBookingId = null;
const token = localStorage.getItem("token");

// === Helper: Authorized Fetch ===
async function authorizedFetch(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });

  // If unauthorized, redirect to login
  if (res.status === 401 || res.status === 403) {
    alert("Your session has expired. Please log in again.");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return null;
  }

  return res;
}

// === Load All Bookings ===
async function loadBookings() {
  try {
    const res = await authorizedFetch("/api/bookings");
    if (!res) return;
    const data = await res.json();
    const tbody = document.getElementById("bookingTableBody");
    tbody.innerHTML = "";

    data.forEach((b) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${b.id}</td>
        <td>${b.client_name || "N/A"}</td>
        <td>${b.package || "N/A"}</td>
        <td>${b.date}</td>
        <td>${b.status}</td>
        <td>
          <button onclick="openDownpaymentModal(${b.id})" class="btn btn-down">💰 Downpayment</button>
          <button onclick="openCancelModal(${b.id})" class="btn btn-cancel">❌ Cancel</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("❌ Failed to load bookings:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadBookings);

// === Downpayment Modal ===
function openDownpaymentModal(id) {
  selectedBookingId = id;
  document.getElementById("downpaymentModal").style.display = "flex";
}

async function submitDownpayment() {
  const amount = document.getElementById("downpaymentAmount").value.trim();
  if (!amount) return alert("⚠️ Please enter an amount.");

  try {
    const res = await authorizedFetch("/api/bookings/downpayment", {
      method: "POST",
      body: JSON.stringify({ booking_id: selectedBookingId, amount }),
    });

    if (!res) return;
    const data = await res.json();

    if (res.ok) {
      alert(`✅ ${data.message}`);
      closeModal("downpaymentModal");
      loadBookings();
    } else {
      alert(`⚠️ ${data.error || "Payment failed"}`);
    }
  } catch (err) {
    console.error("❌ Downpayment error:", err);
    alert("Server error while processing payment.");
  }
}

// === Cancel Booking ===
function openCancelModal(id) {
  selectedBookingId = id;
  document.getElementById("cancelModal").style.display = "flex";
}

async function confirmCancel() {
  try {
    const res = await authorizedFetch(`/api/bookings/cancel-booking/${selectedBookingId}`, {
      method: "DELETE",
    });

    if (!res) return;
    const data = await res.json();

    if (res.ok) {
      alert(`❌ ${data.message}`);
      closeModal("cancelModal");
      loadBookings();
    } else {
      alert(`⚠️ ${data.message || "Cancellation failed"}`);
    }
  } catch (err) {
    console.error("❌ Cancellation error:", err);
    alert("Server error while cancelling booking.");
  }
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
