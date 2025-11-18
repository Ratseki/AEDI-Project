// ===============================
// ✅ Full Dashboard Script (FIXED: QR, Upload, and Payments)
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
// ✅ Dashboard Data (FIXED)
// -------------------------------
async function loadDashboardData() {
  try {
    // The '/api/admin/payments' call is now redundant for analytics
    // but we'll leave it for the 'loadPayments' function.
    const [statsRes, bookingsRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/api/admin/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const stats = await statsRes.json();
    const bookings = await bookingsRes.json();
    
    // --- THIS IS THE FIX ---
    // The stats object now contains all the correct, calculated values
    totalBookingsElem.textContent = stats.total_bookings || 0;
    totalRevenueElem.textContent = "₱" + Number(stats.total_revenue || 0).toLocaleString();
    totalClientsElem.textContent = stats.total_users || 0;
    popularPackageElem.textContent = stats.popular_package || "-";
    // --- END OF FIX ---

    // Tables
    loadDashboardBookings(bookings); // This will now load with correct data
    loadTransactions(); 
    loadPayments();
    loadNotifications();

    // Charts
    renderCharts(bookings); // This will now show location data

    // Admin-only
    loadAdminUsers();

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

  const bookingsChartCtx = document.getElementById("bookingsChart");
  if (bookingsChartCtx) {
    new Chart(bookingsChartCtx, {
      type: "line",
      data: { labels: months, datasets: [{ label:"Bookings", data: monthlyData, borderColor:"#CE6826", backgroundColor:"rgba(206,104,38,0.2)", fill:true }] },
      options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
    });
  }

  // Top Locations
  const locations = {};
  bookings.forEach(b => {
    if(b.location) locations[b.location] = (locations[b.location] || 0) + 1;
  });
  const locationLabels = Object.keys(locations);
  const locationData = Object.values(locations);

  const locationChartCtx = document.getElementById("locationChart");
  if (locationChartCtx && locationLabels.length > 0) {
    new Chart(locationChartCtx, {
      type: "bar",
      data: { labels: locationLabels, datasets: [{ label:"Bookings", data: locationData, backgroundColor: "#CE6826" }] },
      options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
    });
  }
}

// -------------------------------
// ✅ Bookings Table (UPDATED)
// -------------------------------
async function loadDashboardBookings(bookings = []) {
  if (!bookingTableBody) return;
  bookingTableBody.innerHTML = "";
  bookings.forEach(b => {
    // This calculation is now just for display, the summary modal has the official numbers
    const tax = Number(b.payment || 0) * 0.12;
    const total = Number(b.payment || 0) + tax;
    const reviewText = (b.review && b.review.rating) ? `${b.review.rating} ⭐ — ${b.review.text}` : "N/A";

    const row = document.createElement("tr");
    
    // ✅ FIX: Added the 'View' button and dynamic actions
    let actionsHtml = `
      <button onclick="openBookingSummaryModal(${b.id})" class="btn" style="background:#007bff; color:white; margin-right:5px;">View</button>
    `;

    if (b.status === "pending") {
      actionsHtml += `
        <button onclick="openDownpaymentModal(${b.id})" class="btn btn-down">💰 Downpayment</button>
        <button onclick="openCancelModal(${b.id})" class="btn btn-cancel">❌ Cancel</button>
      `;
    } else if (b.status === "partial") {
       actionsHtml += `
        <button onclick="openDownpaymentModal(${b.id})" class="btn btn-down">💰 Pay Balance</button>
        <button onclick="openCancelModal(${b.id})" class="btn btn-cancel">❌ Cancel</button>
      `;
    } else {
      actionsHtml += "-";
    }

    row.innerHTML = `
      <td>${b.id}</td>
      <td>${b.client_name || "N/A"}</td>
      <td>${b.package || "N/A"}</td>
      <td>${new Date(b.date).toLocaleDateString()}</td>
      <td>${b.status}</td>
      <td>₱${Number(b.payment || 0).toLocaleString()} + ₱${tax.toLocaleString()} = ₱${total.toLocaleString()}</td>
      <td>${reviewText}</td>
      <td>${actionsHtml}</td>
    `;
    bookingTableBody.appendChild(row);
  });
}

// -------------------------------
// ✅ Transactions (Fixed)
// -------------------------------
async function loadTransactions() {
  const tableBody = document.getElementById("transactionTable");
  if (!tableBody) return; // Element might not exist on all pages
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
      const customerName = tx.customer || "N/A";
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
function loadAdminUsers() { /* Placeholder */ } 

// -------------------------------
// ✅ Payments (FIXED)
// This function was missing, causing the "Loading..." error.
// -------------------------------
async function loadPayments() {
  const container = document.getElementById("payments");
  if (!container) return;
  container.innerHTML = "<p>Loading...</p>"; // Set loading state
  try {
    // We fetch from /api/payments, which is defined in your server.js
    const res = await fetch(`${API_BASE}/api/payments`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      // Render a simple list. You can change this to a table later.
      container.innerHTML = `<ul style="list-style:none; padding:0;">
        ${data.map(p => `
          <li style="border-bottom:1px solid #eee; padding: 5px 0;">
            ${new Date(p.created_at).toLocaleDateString()} - 
            <strong>₱${Number(p.amount || 0).toLocaleString()}</strong> - 
            (<i>${p.payment_method || 'N/A'}</i>) - 
            <strong>${p.status || 'N/A'}</strong>
          </li>`).join("")}
      </ul>`;
    } else {
      container.innerHTML = "<p>No payments found.</p>";
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color:red;'>Error loading payments.</p>";
  }
}

// -------------------------------
// ✅ Notifications
// -------------------------------
async function loadNotifications() {
  const container = document.getElementById("notifications");
  if (!container) return;
  container.innerHTML = "<p>Loading...</p>";
  try {
    const res = await fetch(`${API_BASE}/api/notifications`, { headers:{ Authorization:`Bearer ${token}` } });
    const data = await res.json();
    container.innerHTML = data.length ? `<ul>${data.map(n=>`<li>${n.message}</li>`).join("")}</ul>`:"<p>No notifications.</p>";
  } catch(err){ console.error(err); container.innerHTML="<p>Error loading notifications</p>"; }
}

// -------------------------------
// ✅ Customers Dropdown
// -------------------------------
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
// ✅ Customer Select Event Listener
// -------------------------------
customerSelect?.addEventListener("change", () => {
  const customerId = customerSelect.value;
  if (customerId) {
    loadPhotos(customerId); // Load photos for the selected customer
  } else {
    photoList.innerHTML = "<p>Select a customer to view their gallery.</p>"; // Clear list
  }
});


// -------------------------------
// ✅ Photo Upload & QR (FIXED)
// -------------------------------
bulkUploadForm?.addEventListener("submit", async e=>{
  e.preventDefault();
  
  // ✅ FIX: We must get ALL form fields to send to the backend
  const customerId = customerSelect.value;
  const bookingId = document.getElementById('bookingId').value;
  const price = document.getElementById('price').value;
  const files = document.getElementById('bulkPhotos').files;

  if (!customerId) {
    uploadStatus.textContent = "❌ Please select a customer first.";
    return;
  }
  if (!files || files.length === 0) {
    uploadStatus.textContent = "❌ Please select files to upload.";
    return;
  }

  // Create FormData and append all fields
  const formData = new FormData();
  for (const file of files) {
      formData.append('photos', file);
  }
  
  // ✅ FIX: Send 'customer_id' to match routes/photos.js
  formData.append('customer_id', customerId); 
  formData.append('booking_id', bookingId || null);
  formData.append('price', price || 100); // Default price if empty

  uploadStatus.textContent = "Uploading...";
  try {
    const res = await fetch(`${API_BASE}/api/photos/upload`, { 
      method:"POST", 
      headers:{ Authorization:`Bearer ${token}` }, // No 'Content-Type' for FormData
      body: formData 
    });
    
    const data = await res.json();
    if(!res.ok) throw new Error(data.message || "Upload failed");
    
    uploadStatus.textContent = `✅ ${data.message || 'Upload successful'}`;
    
    // Refresh the gallery for the current customer
    loadPhotos(customerId); 
    
    // Clear form
    bulkUploadForm.reset();
    
  } catch(err){ 
    console.error(err); 
    uploadStatus.textContent = `❌ Upload failed: ${err.message}`; 
  }
});

// Load photos for a specific customer
async function loadPhotos(customerId) {
  if (!customerId) {
    photoList.innerHTML = "<p>Select a customer to view their gallery.</p>";
    return;
  }
  
  photoList.innerHTML = "<p>Loading gallery...</p>"; // Add loading state

  try {
    const res = await fetch(`${API_BASE}/api/photos/gallery/customer/${customerId}`, { headers:{ Authorization:`Bearer ${token}` } });
    
    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fetch gallery");
    }

    const photos = await res.json();

    if (Array.isArray(photos) && photos.length > 0) {
      // Use p.url which is what your /gallery/customer/:id route provides
      photoList.innerHTML = photos.map(p=>`<img src="${p.url}" width="100" style="margin:5px" alt="Gallery photo">`).join("");
    } else {
      photoList.innerHTML = "<p>This customer has no photos yet.</p>";
    }
  } catch(err){ 
    console.error(err); 
    photoList.innerHTML = `<p style="color:red;">Error loading photos: ${err.message}</p>`; 
  }
}

// Generate QR Code
generateQRBtn?.addEventListener("click", async ()=>{
  const customerId = customerSelect.value;
  if (!customerId) {
    document.getElementById("qrResult").textContent = "Please select a customer.";
    return;
  }
  
  document.getElementById("qrResult").textContent = "Generating QR code...";
  
  try{
    const res = await fetch(`${API_BASE}/api/qr/generate`, { 
      method:"POST", 
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      // ✅ FIX: Send 'user_id' to match routes/qr.js
      body: JSON.stringify({ user_id: customerId }) 
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "QR generation failed");
    
    // ✅ FIX: Use the correct response keys 'qr_image' and 'gallery_link'
    document.getElementById("qrResult").innerHTML = `
      <p>Scan the code or share this link:</p>
      <img src="${data.qr_image}" alt="Generated QR Code" style="max-width:200px;">
      <p><a href="${data.gallery_link}" target="_blank">${data.gallery_link}</a></p>
    `;

  } catch(err){ 
    console.error(err); 
    document.getElementById("qrResult").textContent = `Error: ${err.message}`; 
  }
});

// -------------------------------
// ✅ Booking Summary Logic (FIXED)
// -------------------------------
async function openBookingSummaryModal(bookingId) {
  const modalContent = document.getElementById("summaryContent");
  modalContent.innerHTML = "<p>Loading summary...</p>";
  document.getElementById("summaryModal").style.display = "flex";

  try {
    // ✅ FIX: Call the new admin-specific route
    const res = await fetch(`${API_BASE}/api/bookings/admin/summary/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load summary");

    const { booking, summary } = data;

    // Build the HTML for the summary
    // This now uses the customer_name/email from the new query
    modalContent.innerHTML = `
      <ul style="list-style:none; padding:0;">
        <li><strong>Customer:</strong> ${
          booking.customer_name || booking.first_name + " " + booking.last_name
        }</li>
        <li><strong>Email:</strong> ${booking.customer_email || booking.email}</li>
        <li><strong>Package:</strong> ${
          booking.service_name || booking.package_name
        }</li>
        <li><strong>Date:</strong> ${new Date(
          booking.date
        ).toLocaleDateString()} at ${booking.time}</li>
        <li><strong>Status:</strong> <strong style="text-transform:capitalize;">${
          booking.status
        }</strong></li>
        <li><strong>Location:</strong> ${booking.location || "N/A"}</li>
        <hr style="margin: 10px 0;">
        <li>Subtotal: ₱${summary.subtotal.toLocaleString()}</li>
        <li>Tax (${summary.tax_rate * 100}%): ₱${summary.tax.toLocaleString()}</li>
        <li><strong>Total: ₱${summary.total.toLocaleString()}</strong></li>
      </ul>
      <p style="font-size:0.9em; color:#555;"><i>Note: ${summary.notice}</i></p>
    `;
  } catch (err) {
    console.error(err);
    modalContent.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

// ================================
// ✅ Modals (SMART BALANCE FIX)
// ================================

// ✅ FIX 1: This function is now ASYNC and fetches the real balance
async function openDownpaymentModal(id){ 
  currentBookingId = id; 
  const amountInput = document.getElementById("downpaymentAmount");
  
  // Show modal with loading state
  amountInput.value = "Loading...";
  amountInput.disabled = true;
  document.getElementById("downpaymentModal").style.display = "flex"; 

  try {
    // Call the new 'smart' route we added to routes/bookings.js
    const res = await fetch(`${API_BASE}/api/bookings/admin/payment-details/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load balance");

    // Set the input value to the exact remaining balance
    amountInput.value = data.remaining_balance;
    amountInput.disabled = false;

  } catch (err) {
    console.error(err);
    alert(`Error: ${err.message}`);
    amountInput.value = "0";
    amountInput.disabled = false;
  }
}

// This function is unchanged
function openCancelModal(id){ currentBookingId=id; document.getElementById("cancelModal").style.display="flex"; }
function closeModal(modalId){ document.getElementById(modalId).style.display="none"; }

// ✅ FIX 2: This function no longer sends 'is_downpayment'
// The backend is smart enough to figure it out
async function submitDownpayment(){
  const amount = document.getElementById("downpaymentAmount").value;
  if (!amount || amount < 0) { // Allow 0, but not negative
    alert("Please enter a valid payment amount.");
    return;
  }
  try{
    const res = await fetch(`${API_BASE}/api/bookings/${currentBookingId}/pay`, { 
      method:"POST", 
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` }, 
      body: JSON.stringify({ 
          amount: amount,
          payment_method: "cash" // Or another default
      }) 
    });
    
    const data = await res.json();
    if(!res.ok) throw new Error(data.message);
    
    alert("✅ Payment submitted"); 
    closeModal("downpaymentModal"); 
    
    // Refresh all data
    loadDashboardData();
    loadPayments();
    
  } catch(err){ 
    console.error(err); 
    alert(`Error: ${err.message}`); 
  }
}

// This function is unchanged
async function confirmCancel(){
  try{
    const res = await fetch(`${API_BASE}/api/bookings/status/${currentBookingId}`, { 
      method:"PATCH", 
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ status: "cancelled" })
    });
    
    const data = await res.json();
    if(!res.ok) throw new Error(data.message);
    
    alert("✅ Booking cancelled"); 
    closeModal("cancelModal"); 
    loadDashboardData(); // Refresh the booking table
    
  } catch(err){ 
    console.error(err); 
    alert(`Error: ${err.message}`); 
  }
}

// ✅ FIX 2: Cancel Function
// This version calls the correct '/status/:id' route
async function confirmCancel(){
  try{
    // This route is CORRECT: PATCH /api/bookings/status/:id
    const res = await fetch(`${API_BASE}/api/bookings/status/${currentBookingId}`, { 
      method:"PATCH", 
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      // It MUST send this body
      body: JSON.stringify({ status: "cancelled" })
    });
    
    const data = await res.json();
    if(!res.ok) throw new Error(data.message);
    
    alert("✅ Booking cancelled"); 
    closeModal("cancelModal"); 
    loadDashboardData(); // Refresh the booking table
    
  } catch(err){ 
    console.error(err); 
    alert(`Error: ${err.message}`); 
  }
}

// -------------------------------
// ✅ Profile (optional)
// -------------------------------
function loadProfile(){
  if(!profileForm) return;
  // fetch user profile and populate form
}

// -------------------------------
// ✅ Auto-refresh every 30s
// -------------------------------
// setInterval(loadDashboardData, 30000); // Still commented out for debugging