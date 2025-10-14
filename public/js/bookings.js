console.log("✅ bookings.js loaded");

let selectedBookingId = null;

// === Load All Bookings ===
async function loadBookings() {
  try {
    const res = await fetch("/booking");
    const data = await res.json();

    const tbody = document.getElementById("bookingTableBody");
    tbody.innerHTML = "";

    data.forEach(b => {
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

// === Booking Modal (Placeholder for + New Booking) ===
function openBookingModal() {
  alert("📝 Booking form coming soon!");
}

// === Downpayment Modal ===
function openDownpaymentModal(id) {
  selectedBookingId = id;
  document.getElementById("downpaymentModal").style.display = "flex";
}

async function submitDownpayment() {
  const amount = document.getElementById("downpaymentAmount").value.trim();
  if (!amount) return alert("⚠️ Please enter an amount.");

  try {
    const res = await fetch("/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: selectedBookingId, amount })
    });

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

// === Cancellation Modal ===
function openCancelModal(id) {
  selectedBookingId = id;
  document.getElementById("cancelModal").style.display = "flex";
}

async function confirmCancel() {
  try {
    const res = await fetch(`/booking/cancel-booking/${selectedBookingId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
    });

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

// === Close Modal ===
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
