// =======================
// payments.js (frontend)
// =======================
const token = localStorage.getItem("token");
const payError = document.getElementById("payError");
const bookingDetails = document.getElementById("bookingDetails");
const urlParams = new URLSearchParams(window.location.search);
const bookingId = urlParams.get("booking_id");

function showPayError(msg) {
  payError.style.display = "block";
  payError.textContent = msg;
}

// === Token & Booking Check ===
if (!bookingId) showPayError("Invalid booking. Please start again.");
if (!token) {
  alert("Please log in again to continue your payment.");
  window.location.href = "/login.html";
}

// === Load booking details ===
async function loadBookingDetails() {
  try {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      headers: { Authorization: "Bearer " + token }
    });

    if (!res.ok) {
      const err = await res.json();
      showPayError(err.message || "Failed to load booking details. Token may be expired.");
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
      <strong>Location:</strong> ${data.location}<br>
    `;
  } catch (err) {
    console.error("❌ Error loading booking:", err);
    showPayError("Network error. Please try again.");
  }
}

loadBookingDetails();

// === PayMongo Integration ===
async function createPayMongoLink(amount, method) {
  try {
            await fetch("/api/paymongo/create-checkout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            booking_id: bookingId,
            amount,
            method
        })
        });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create PayMongo checkout.");

    // Redirect to PayMongo checkout page
    window.location.href = data.checkout_url;
  } catch (err) {
    console.error("❌ PayMongo error:", err);
    showPayError(err.message);
  }
}


document.getElementById("payBtn").addEventListener("click", async () => {
  const amount = document.getElementById("paymentAmount").value;
  const urlParams = new URLSearchParams(window.location.search);
  const booking_id = urlParams.get("booking_id");

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/payments/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, booking_id }),
    });

    const data = await res.json();

    if (!data.data || !data.data.attributes.checkout_url) {
      alert("Failed to create checkout session.");
      console.error(data);
      return;
    }

    const checkoutUrl = data.data.attributes.checkout_url;
    window.location.href = checkoutUrl; // ✅ redirect to PayMongo-hosted checkout
  } catch (err) {
    console.error("Payment error:", err);
    alert("Something went wrong with the payment.");
  }
});
