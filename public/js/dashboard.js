// ===============================
// ✅ Full Dashboard Script
// ===============================

const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

const API_BASE = "http://localhost:3000";

// -------------------------------
// Elements
// -------------------------------
const totalRevenueElem = document.getElementById("totalRevenue");
const totalBookingsElem = document.getElementById("totalBookings");
const totalClientsElem = document.getElementById("totalClients");
const popularPackageElem = document.getElementById("popularPackage");

const bookingTableBody = document.getElementById("bookingTableBody");
const transactionTable = document.getElementById("transactionTable");
const reviewSection = document.getElementById("reviewSection");
const submitReviewBtn = document.getElementById("submitReview");

const customerSelect = document.getElementById("customerSelect");
const photoList = document.getElementById("photoList");
const uploadStatus = document.getElementById("uploadStatus");
const generateQRBtn = document.getElementById("generateQRBtn");

const bulkUploadForm = document.getElementById("bulkUploadForm");

// Optional forms
const profileForm = document.getElementById("profile-form");
const passwordForm = document.getElementById("password-form");
const profileUploadForm = document.getElementById("profile-upload-form");

// Modal handling
let currentBookingId = null;

// -------------------------------
// ✅ Auth check & initial load
// -------------------------------
(async function initDashboard() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok || !data.valid) throw new Error("Unauthorized");

    if (data.role !== "admin") {
      document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
    }

    await loadDashboardData();
    await loadCustomers();
    loadProfile();

  } catch (err) {
    console.error("Auth verification failed:", err);
    localStorage.clear();
    window.location.href = "/login.html";
  }
})();

// -------------------------------
// ✅ Dashboard Data
// -------------------------------
async function loadDashboardData() {
  try {
    const [statsRes, bookingsRes, paymentsRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/api/admin/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/api/admin/payments`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const stats = await statsRes.json();
    const bookings = await bookingsRes.json();
    const payments = await paymentsRes.json();

    // Analytics cards
    totalBookingsElem.textContent = bookings.length;
    totalRevenueElem.textContent = Array.isArray(payments)
      ? "₱" + payments.reduce((a, b) => a + Number(b.amount || 0), 0).toLocaleString()
      : "₱" + Number(payments.total || 0).toLocaleString();
    totalClientsElem.textContent = stats.total_users || 0;
    popularPackageElem.textContent = stats.popular_package || "-";

    // Tables
    loadDashboardBookings(bookings);
    loadTransactions();

    // Charts
    renderCharts(bookings);

    // Admin-only
    loadAdminUsers();
    loadNotifications();

  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }
}

// -------------------------------
// ✅ Charts
// -------------------------------
function renderCharts(bookings) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyData = Array(12).fill(0);

  bookings.forEach(b => {
    const date = new Date(b.date);
    if (!isNaN(date)) monthlyData[date.getMonth()]++;
  });

  new Chart(document.getElementById("bookingsChart"), {
    type: "line",
    data: { labels: months, datasets: [{ label:"Bookings", data: monthlyData, borderColor:"#CE6826", backgroundColor:"rgba(206,104,38,0.2)", fill:true }] },
    options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
  });

  // Top Locations
  const locations = {};
  bookings.forEach(b => locations[b.location] = (locations[b.location] || 0) + 1);
  const locationLabels = Object.keys(locations);
  const locationData = Object.values(locations);

  new Chart(document.getElementById("locationChart"), {
    type: "bar",
    data: { labels: locationLabels, datasets: [{ label:"Bookings", data: locationData, backgroundColor: "#CE6826" }] },
    options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
  });
}

// -------------------------------
// ✅ Bookings Table
// -------------------------------
async function loadDashboardBookings(bookings = []) {
  bookingTableBody.innerHTML = "";
  bookings.forEach(b => {
    const tax = Number(b.payment || 0) * 0.12;
    const total = Number(b.payment || 0) + tax;
    const reviewText = b.review ? `${b.review.rating} ⭐ — ${b.review.text}` : "N/A";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${b.id}</td>
      <td>${b.client_name || "N/A"}</td>
      <td>${b.package || "N/A"}</td>
      <td>${b.date}</td>
      <td>${b.status}</td>
      <td>₱${Number(b.payment || 0).toLocaleString()} + ₱${tax.toLocaleString()} = ₱${total.toLocaleString()}</td>
      <td>${reviewText}</td>
      <td>
        ${b.status === "pending" 
          ? `<button onclick="openDownpaymentModal(${b.id})" class="btn btn-down">💰 Downpayment</button>
             <button onclick="openCancelModal(${b.id})" class="btn btn-cancel">❌ Cancel</button>` 
          : "-"}
      </td>
    `;
    bookingTableBody.appendChild(row);
  });
}

// -------------------------------
// ✅ Transactions
// -------------------------------
async function loadTransactions() {
  const tableBody = document.getElementById("transactionTable");
  tableBody.innerHTML = "<tr><td colspan='9'>Loading...</td></tr>";

  try {
    const res = await fetch(`${API_BASE}/api/transactions`, { headers:{ Authorization:`Bearer ${token}` } });
    const transactions = await res.json();

    tableBody.innerHTML = "";
    if (!Array.isArray(transactions) || !transactions.length) {
      tableBody.innerHTML = "<tr><td colspan='9'>No transactions found.</td></tr>";
      return;
    }

    transactions.forEach(tx => {
      const customerName = tx.client_name || tx.customer_name || tx.user_name || "N/A";
      const date = tx.created_at ? new Date(tx.created_at).toLocaleString() : "-";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${tx.id ?? "-"}</td>
        <td>${customerName}</td>
        <td>${tx.reference_id ?? "-"}</td>
        <td>${tx.type ?? "-"}</td>
        <td>₱${Number(tx.amount ?? 0).toLocaleString()}</td>
        <td>${tx.payment_method ?? "-"}</td>
        <td>${tx.status ?? "-"}</td>
        <td>${date}</td>
        <td>${tx.status==="pending"?`<button onclick="updateTransactionStatus(${tx.id},'confirmed')">✅ Approve</button>
        <button onclick="updateTransactionStatus(${tx.id},'rejected')">❌ Reject</button>`:"-"}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = "<tr><td colspan='9' style='color:red;'>Error loading transactions</td></tr>";
  }
}

async function updateTransactionStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/api/transactions/${id}/status`, {
      method:"PATCH",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Update failed");
    loadTransactions();
  } catch (err) { console.error(err); alert("Error updating transaction"); }
}

// -------------------------------
// ✅ Reviews
// -------------------------------
submitReviewBtn?.addEventListener("click", async () => {
  const rating = document.getElementById("reviewRating").value;
  const text = document.getElementById("reviewText").value.trim();
  if (!text) return alert("⚠️ Write your review");

  try {
    const res = await fetch(`${API_BASE}/api/bookings/review`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ rating,text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to submit review");
    alert("✅ Review submitted");
    document.getElementById("reviewText").value = "";
    reviewSection.style.display="none";
    loadDashboardData();
  } catch(err){ console.error(err); alert("Error submitting review"); }
});

// -------------------------------
// ✅ Users (Admin)
function loadAdminUsers() { fetchData("users","users",["ID","Name","Email"]); }

// -------------------------------
// ✅ Notifications
async function loadNotifications() {
  const container = document.getElementById("notifications");
  container.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch(`${API_BASE}/api/notifications`, { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    container.innerHTML = data.length ? `<ul>${data.map(n=>`<li>${n.message}</li>`).join("")}</ul>`:"<p>No notifications.</p>";
  } catch(err){ console.error(err); container.innerHTML="<p>Error loading notifications</p>"; }
}

// -------------------------------
// ✅ Customers Dropdown
async function loadCustomers() {
  try {
    const res = await fetch(`${API_BASE}/api/photos/customers`, { headers:{ Authorization:`Bearer ${token}` } });
    const customers = await res.json();
    customerSelect.innerHTML = "<option value=''>Select a customer</option>";
    customers.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id; opt.textContent = c.name; customerSelect.appendChild(opt);
    });
  } catch(err){ console.error(err); }
}

// -------------------------------
// ✅ Photo Upload & QR
bulkUploadForm?.addEventListener("submit", async e=>{
  e.preventDefault();
  const formData = new FormData(bulkUploadForm);
  try {
    const res = await fetch(`${API_BASE}/api/photos/upload`, { method:"POST", headers:{ Authorization:`Bearer ${token}` }, body: formData });
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || "Upload failed");
    uploadStatus.textContent = "✅ Upload successful";
    loadPhotos();
  } catch(err){ console.error(err); uploadStatus.textContent="❌ Upload failed"; }
});

async function loadPhotos() {
  try {
    const res = await fetch(`${API_BASE}/api/photos/gallery/customer/${customerSelect.value}`, { headers:{ Authorization:`Bearer ${token}` } });
    const photos = await res.json();
    photoList.innerHTML = photos.map(p=>`<img src="${p.url}" width="100" style="margin:5px">`).join("");
  } catch(err){ console.error(err); photoList.innerHTML="Error loading photos"; }
}

generateQRBtn?.addEventListener("click", async ()=>{
  try{
    const res = await fetch(`${API_BASE}/api/qr/generate`, { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify({ customerId:customerSelect.value }) });
    const data = await res.json();
    document.getElementById("qrResult").innerHTML = data.qr || "Error generating QR";
  } catch(err){ console.error(err); document.getElementById("qrResult").textContent="Error generating QR"; }
});

// -------------------------------
// ✅ Modals
function openDownpaymentModal(id){ currentBookingId=id; document.getElementById("downpaymentModal").style.display="flex"; }
function openCancelModal(id){ currentBookingId=id; document.getElementById("cancelModal").style.display="flex"; }
function closeModal(modalId){ document.getElementById(modalId).style.display="none"; }

async function submitDownpayment(){
  const amount = document.getElementById("downpaymentAmount").value;
  try{
    const res = await fetch(`${API_BASE}/api/bookings/${currentBookingId}/downpayment`, { method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify({ amount }) });
    const data = await res.json();
    if(!res.ok) throw new Error(data.message);
    alert("✅ Downpayment submitted"); closeModal("downpaymentModal"); loadDashboardData();
  } catch(err){ console.error(err); alert("Error submitting downpayment"); }
}

async function confirmCancel(){
  try{
    const res = await fetch(`${API_BASE}/api/bookings/${currentBookingId}/cancel`, { method:"PATCH", headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    if(!res.ok) throw new Error(data.message);
    alert("✅ Booking cancelled"); closeModal("cancelModal"); loadDashboardData();
  } catch(err){ console.error(err); alert("Error cancelling booking"); }
}

// -------------------------------
// ✅ Profile (optional)
function loadProfile(){
  if(!profileForm) return;
  // fetch user profile and populate form
}

// -------------------------------
// ✅ Auto-refresh every 30s
// -------------------------------
setInterval(loadDashboardData, 30000);
