console.log("✅ bookings.js loaded");

let selectedBookingId = null;
const token = localStorage.getItem("token");

// === Helper: Authorized Fetch ===
async function authorizedFetch(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    alert("Your session has expired. Please log in again.");
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return null;
  }
  return res;
}

// === Load All Bookings (Admin/User table) ===
async function loadBookings() {
  try {
    const res = await authorizedFetch("/api/bookings");
    if (!res) return;

    const data = await res.json();
    const tbody = document.getElementById("bookingTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    for (const b of data) {
      const reviewText = b.review ? `${b.review.rating} ⭐ — ${b.review.comment}` : "N/A";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${b.id}</td>
        <td>${b.first_name || ""} ${b.last_name || ""}</td>
        <td>${b.package_name || b.service_id || "N/A"}</td>
        <td>${b.date}</td>
        <td>${b.status}</td>
        <td>${b.payment || "N/A"}</td>
        <td>${reviewText}</td>
        <td>
          <button onclick="openDownpaymentModal(${b.id})" class="btn btn-down">💰 Downpayment</button>
          <button onclick="openCancelModal(${b.id})" class="btn btn-cancel">❌ Cancel</button>
        </td>
      `;
      tbody.appendChild(row);
    }
  } catch (err) {
    console.error("❌ Failed to load bookings:", err);
  }
}

// === Downpayment Modal ===
function openDownpaymentModal(id) {
  selectedBookingId = id;
  document.getElementById("downpaymentModal").style.display = "flex";
}

async function submitDownpayment() {
  const amount = parseFloat(document.getElementById("downpaymentAmount").value.trim());
  if (!amount || amount <= 0) return alert("⚠️ Please enter a valid amount.");

  try {
    const res = await authorizedFetch(`/api/bookings/${selectedBookingId}/pay`, {
      method: "POST",
      body: JSON.stringify({ amount, is_downpayment: true }),
    });

    if (!res) return;
    const data = await res.json();

    if (res.ok) {
      alert(`✅ ${data.message}`);
      closeModal("downpaymentModal");
      loadBookings();
    } else {
      alert(`⚠️ ${data.message || "Payment failed"}`);
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
    const res = await authorizedFetch(`/api/bookings/status/${selectedBookingId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
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

// === Booking Page Logic ===
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("bookingTableBody")) loadBookings();

  const bkSummary = document.getElementById("bkSummary");
  const packageSelect = document.getElementById("package");
  const paymentBtn = document.getElementById("bkSubmit");
  const bkForm = document.getElementById("bkForm");

  packageSelect?.addEventListener("change", updateBookingSummary);

  paymentBtn?.addEventListener("click", async () => {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phoneNumber").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const location = document.getElementById("location").value;
    const packageOption = packageSelect.selectedOptions[0];
    const paymentMethod = document.getElementById("paymentMethod").value;
    const agree = document.getElementById("agree").checked;

    if (!firstName || !lastName || !email || !phone || !date || !time || !location || !packageOption || !paymentMethod || !agree) {
      return alert("⚠️ Please fill in all required fields and agree to terms.");
    }

    updateBookingSummary();

    try {
      const res = await authorizedFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phone,
          date,
          time,
          location,
          service_id: packageOption.value,
          package_name: packageOption.textContent,
        }),
      });

      if (!res) return;
      const data = await res.json();

      if (res.ok) {
        alert("✅ Booking successfully created!");
        bkForm.reset();
        bkSummary.style.display = "none";
        loadBookings();
      } else {
        alert(`⚠️ ${data.message || "Booking failed"}`);
      }
    } catch (err) {
      console.error("❌ Booking submission error:", err);
      alert("Server error while creating booking.");
    }
  });

  function updateBookingSummary() {
    const selectedOption = packageSelect.selectedOptions[0];
    if (!selectedOption || !selectedOption.dataset.price) {
      bkSummary.style.display = "none";
      return;
    }

    const price = parseFloat(selectedOption.dataset.price);
    const taxRate = 0.12;
    const tax = price * taxRate;
    const total = price + tax;

    bkSummary.innerHTML = `
      <p><strong>Package:</strong> ${selectedOption.textContent}</p>
      <p><strong>Price:</strong> ₱${price.toFixed(2)}</p>
      <p><strong>Tax (12%):</strong> ₱${tax.toFixed(2)}</p>
      <p><strong>Total:</strong> ₱${total.toFixed(2)}</p>
      <small>*Total includes 12% VAT</small>
    `;
    bkSummary.style.display = "block";
  }
});

// === Reviews ===
const reviewSection = document.getElementById("reviewSection");
const submitReviewBtn = document.getElementById("submitReview");

async function loadUserReviews() {
  const res = await authorizedFetch("/api/bookings/completed");
  if (!res) return;
  const data = await res.json();

  reviewSection.style.display = data.length > 0 ? "block" : "none";
}

submitReviewBtn?.addEventListener("click", async () => {
  const rating = document.getElementById("reviewRating").value;
  const comment = document.getElementById("reviewText").value.trim();
  if (!comment) return alert("⚠️ Please write your review.");

  try {
    const res = await authorizedFetch("/api/bookings/:id/review", {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    });

    if (!res) return;
    const data = await res.json();

    if (res.ok) {
      alert("✅ Review submitted successfully!");
      document.getElementById("reviewText").value = "";
      reviewSection.style.display = "none";
      loadBookings();
    } else {
      alert(`⚠️ ${data.message || "Failed to submit review"}`);
    }
  } catch (err) {
    console.error("❌ Review error:", err);
    alert("Server error while submitting review.");
  }
});
