// payments.js

const token = localStorage.getItem("token");
const payError = document.getElementById("payError");
const bookingDetails = document.getElementById("bookingDetails");
const bookingId = new URLSearchParams(window.location.search).get("booking_id");

function showPayError(msg) {
  payError.style.display = "block";
  payError.textContent = msg;
}

if (!bookingId) showPayError("Invalid booking. Please start again.");

if (!token) {
  alert("Please log in again to continue your payment.");
  window.location.href = "/login.html";
}

// ----------------------------
// Load booking details
// ----------------------------
async function loadBookingDetails() {
  try {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) {
      const err = await res.json();
      showPayError(err.message || "Failed to load booking details.");
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
      }
      return;
    }

    const data = await res.json();
    bookingDetails.style.display = "block";
    bookingDetails.innerHTML = `
      <strong>Booking ID:</strong> ${data.id}<br>
      <strong>Package:</strong> ${data.package || data.package_name || "N/A"}<br>
      <strong>Date:</strong> ${data.date} ${data.time || ""}<br>
      <strong>Location:</strong> ${data.location || "N/A"}<br>
    `;
  } catch (err) {
    console.error("❌ Error loading booking:", err);
    showPayError("Network error. Please try again.");
  }
}

loadBookingDetails();

// ----------------------------
// Valid PayMongo methods
// ----------------------------
const validMethods = ["gcash", "card", "grabpay", "paymaya"];

// ----------------------------
// Create PayMongo Checkout
// ----------------------------
async function createPayMongoLink(amount, method) {
  if (!validMethods.includes(method)) {
    showPayError("Invalid payment method selected.");
    return;
  }

  try {
    const res = await fetch("/api/payments/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ booking_id: bookingId, amount, method })
    });

    const data = await res.json();

    if (!res.ok || !data.checkout_url) {
      showPayError(data.message || "Failed to create PayMongo checkout session.");
      console.error(data);
      return;
    }

    // Redirect to PayMongo checkout page
    window.location.href = data.checkout_url;

  } catch (err) {
    console.error("❌ PayMongo error:", err);
    showPayError("Something went wrong with the payment.");
  }
}

// ----------------------------
// Event listeners
// ----------------------------
document.getElementById("payBtn").addEventListener("click", async () => {
  const amount = document.getElementById("paymentAmount").value.trim();
  const method = document.getElementById("paymentMethod").value.trim();

  if (!amount || !method) {
    showPayError("Please fill in all fields.");
    return;
  }

  await createPayMongoLink(amount, method);
});

document.getElementById("cancelBtn").addEventListener("click", () => {
  window.location.href = "/bookings.html";
});
