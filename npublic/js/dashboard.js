// ===============================
// ✅ Unified Dashboard Script (Admin + Staff)
// ===============================

const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

const API_BASE = "http://localhost:3000";

// Table element
const transactionTable = document.getElementById("transactionTable");
const totalRevenueElem = document.getElementById("totalRevenue");

// ===============================
// ✅ Role verification & admin-only elements
// ===============================
(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data.valid) throw new Error("Unauthorized");

    let currentUserRole = data.role; // or data.user.role depending on your API
    if (currentUserRole !== "admin") {
      document.querySelectorAll(".admin-only").forEach(el => (el.style.display = "none"));
    }

    // ✅ Load main dashboard data
    await loadDashboardData();

    // ✅ Load customers for staff/admin photo uploads
    await loadCustomers();
  } catch (err) {
    console.error("Auth verification failed:", err);
    localStorage.clear();
    window.location.href = "/login.html";
  }
})();



// ===============================
// ✅ Dashboard Analytics
// ===============================
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

    document.getElementById("totalBookings").textContent = bookings.length;
    document.getElementById("totalRevenue").textContent = payments.reduce((a, b) => a + Number(b.amount), 0);
    document.getElementById("totalClients").textContent = stats.total_users;
    document.getElementById("popularPackage").textContent = "Wedding Gold"; // TODO: dynamic

    loadUsers();
    loadBookings();
    loadPayments();
    loadNotifications();
    renderCharts(bookings);
  } catch (err) { console.error(err); }
}

// ===============================
// ✅ Charts
// ===============================
function renderCharts(bookings) {
  new Chart(document.getElementById("bookingsChart"), {
    type: "line",
    data: {
      labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul"],
      datasets: [{
        label: "Bookings",
        data: [45,60,55,80,90,75,95],
        borderColor: "#CE6826",
        backgroundColor: "rgba(206,104,38,0.2)",
        fill: true
      }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });

  new Chart(document.getElementById("locationChart"), {
    type: "bar",
    data: {
      labels: ["Quezon City","Pasig","Cavite","Laguna","Bulacan"],
      datasets: [{
        label: "Bookings",
        data: [35,28,22,18,25],
        backgroundColor: ["#CE6826","#F4981E","#F9BF5F","#073449","#DD9149"]
      }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

// ===============================
// ✅ Admin Tables
// ===============================
async function fetchData(endpoint, elementId, columns) {
  const container = document.getElementById(elementId);
  container.innerHTML = "<p class='loading'>Loading...</p>";
  try {
    const res = await fetch(`${API_BASE}/api/admin/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) { container.innerHTML = "<p>No records found.</p>"; return; }

    const table = document.createElement("table"), thead = document.createElement("thead"), tbody = document.createElement("tbody");
    thead.innerHTML = `<tr>${columns.map(c => `<th>${c}</th>`).join("")}</tr>`;
    data.forEach(row => { 
      const tr = document.createElement("tr"); 
      columns.forEach(c => tr.innerHTML += `<td>${row[c.toLowerCase()] ?? ""}</td>`); 
      tbody.appendChild(tr); 
    });
    table.appendChild(thead); table.appendChild(tbody);
    container.innerHTML = ""; container.appendChild(table);
  } catch (err) { console.error(err); container.innerHTML = "<p style='color:red;'>Error loading data.</p>"; }
}

function loadUsers(){ fetchData("users","users",["ID","Name","Email"]); }
function loadBookings(){ fetchData("bookings","bookings",["ID","User_ID","Service_ID","Status"]); }
function loadPayments(){ fetchData("payments","payments",["ID","Booking_ID","Amount","Status"]); }
function loadNotifications(){ fetchData("notifications","notifications",["ID","User_ID","Message","Is_Read"]); }

// ===============================
// ✅ Customer Photo Gallery
// ===============================
const customerSelect = document.getElementById("customerSelect");
const photoList = document.getElementById("photoList");
const uploadStatus = document.getElementById("uploadStatus");
const generateQRBtn = document.getElementById("generateQRBtn");

let selectedPhotos = new Set();

// ===============================
// ✅ Load Customers for Upload Dropdown
// ===============================
async function loadCustomers() {
  try {
    const res = await fetch(`${API_BASE}/api/photos/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const customers = await res.json();
    const select = document.getElementById("customerSelect");
    if (!select) return;

    select.innerHTML = `<option value="">Select a customer</option>`;
    customers.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.email})`;
      select.appendChild(opt);
    });

    // auto-load photos when selected
    select.addEventListener("change", e => loadCustomerPhotos(e.target.value));
  } catch (err) {
    console.error("Error loading customers:", err);
  }
}


async function loadCustomerPhotos(userId) {
  if (!userId) { photoList.innerHTML = ""; return; }
  try {
    const res = await fetch(`${API_BASE}/api/photos/gallery/customer/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
    const photos = await res.json();
    selectedPhotos.clear();

    if (!photos || photos.length === 0) { 
      photoList.innerHTML = `<p>No uploaded photos yet.</p>`; 
      return; 
    }

    const selectAllHTML = `
      <div style="margin-bottom:10px;">
        <input type="checkbox" id="selectAllPhotos"> <label for="selectAllPhotos">Select All</label>
        <button id="bulkDeleteBtn" style="margin-left:10px;padding:5px 10px;background:red;color:white;border:none;border-radius:5px;cursor:pointer;">Delete Selected</button>
      </div>
    `;

    photoList.innerHTML = selectAllHTML + photos.map(p => `
      <div style="background:#fafafa; border:1px solid #ddd; padding:10px; border-radius:8px; text-align:center; margin-bottom:10px;" data-id="${p.id}">
        <input type="checkbox" class="photoCheckbox" style="margin-bottom:5px;">
        <img src="${p.file_path}" style="width:100%; border-radius:5px; cursor:pointer;" onclick="showModal('${p.file_path}')">
        <p>Status: <strong>${p.status}</strong></p>
        <p>₱${p.price}</p>
        <button onclick="deletePhoto(${p.id})" style="color:white;background:red;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">Delete</button>
      </div>`).join("");

    // Checkbox logic
    const photoCheckboxes = document.querySelectorAll(".photoCheckbox");
    photoCheckboxes.forEach((cb,i) => cb.addEventListener("change", () => {
      const photoId = photos[i].id;
      cb.checked ? selectedPhotos.add(photoId) : selectedPhotos.delete(photoId);
    }));

    document.getElementById("selectAllPhotos").addEventListener("change", e => {
      const checked = e.target.checked;
      photoCheckboxes.forEach((cb,i) => {
        cb.checked = checked;
        checked ? selectedPhotos.add(photos[i].id) : selectedPhotos.delete(photos[i].id);
      });
    });

    // Bulk Delete
    document.getElementById("bulkDeleteBtn").addEventListener("click", async () => {
      if (selectedPhotos.size === 0) return alert("Select at least one photo to delete.");
      if (!confirm("Are you sure you want to delete the selected photos?")) return;
      try {
        const res = await fetch(`${API_BASE}/api/photos/delete-bulk`, {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`}, 
          body: JSON.stringify({ photo_ids: Array.from(selectedPhotos) })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.message||"Bulk delete failed");
        alert(data.message); await loadCustomerPhotos(userId);
      } catch(err){ console.error(err); alert("Error deleting photos."); }
    });

    // Bulk Purchase

  } catch (err) { 
    console.error(err); 
    photoList.innerHTML = `<p style="color:red">Error loading photos</p>`; 
  }
}


// ===============================
// ✅ Upload Photos (Bulk) — Fixed
// ===============================
document.getElementById("bulkUploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const userId = customerSelect.value;
  if (!userId) return alert("Select a customer first!");

  const bookingInput = document.getElementById("bookingId");
  const priceInput = document.getElementById("price");
  const files = document.getElementById("bulkPhotos").files;

  if (!files || files.length === 0) return alert("Select at least one photo!");

  // Safely get values
  const bookingId = bookingInput.value.trim() || null; // null if empty
  const price = parseFloat(priceInput.value) || 100;   // default 100 if invalid

  uploadStatus.textContent = "Uploading photos...";
  uploadStatus.style.color = "black";

  const formData = new FormData();
  formData.append("customer_id", userId);
  formData.append("booking_id", bookingId); // will send null if not provided
  formData.append("price", price);

  for (const file of files) formData.append("photos", file);

  // DEBUG: log FormData before sending
  for (const [key, value] of formData.entries()) {
    console.log("FormData:", key, value);
  }

  try {
    const res = await fetch(`${API_BASE}/api/photos/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Upload failed");

    uploadStatus.textContent = data.message || "Upload successful!";
    uploadStatus.style.color = "green";

    // Reload photos for selected customer
    await loadCustomerPhotos(userId);

    // Clear file input
    document.getElementById("bulkPhotos").value = "";

  } catch (err) {
    console.error("Upload error:", err);
    uploadStatus.textContent = "Error uploading photos. Check console.";
    uploadStatus.style.color = "red";
  }
});


// ===============================
// ✅ Single Photo Delete
// ===============================
async function deletePhoto(photoId) {
  if (!confirm("Delete this photo?")) return;

  try {
    const res = await fetch(`${API_BASE}/api/photos/${photoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Delete failed");

    alert(data.message);
    await loadCustomerPhotos(customerSelect.value);
  } catch (err) {
    console.error(err);
    alert("Error deleting photo: " + err.message);
  }
}

// ===============================
// ✅ QR Generation
// ===============================
generateQRBtn.addEventListener("click", async () => {
  const userId = customerSelect.value;
  if (!userId) return alert("Select a customer to generate QR!");

  generateQRBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/qr/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user_id: userId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "QR generation failed");

    document.getElementById("qrResult").innerHTML = `
      <a href="${data.gallery_link}" target="_blank" style="display:inline-block;text-align:center;">
        <img src="${data.qr_image}" alt="QR Code" style="max-width:200px; margin-bottom:5px;"/>
        <p>Open Gallery</p>
      </a>
    `;
  } catch (err) {
    console.error("QR generation error:", err);
    alert("Error generating QR: " + err.message);
  } finally {
    generateQRBtn.disabled = false;
  }
});

// ===============================
// 💳 Load and Manage Transactions (Fixed & Improved)
// ===============================
async function loadTransactions() {
  try {
    const res = await fetch(`${API_BASE}/api/transactions`, {
     headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });


    if (!res.ok) throw new Error("Failed to load transactions");
    const data = await res.json();

    // Clear table
    transactionTable.innerHTML = "";

    let totalRevenue = 0;

    data.forEach(tx => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${tx.id}</td>
        <td>${tx.user_name}</td>
        <td>${tx.type}</td>
        <td>${tx.related_id || "-"}</td>
        <td>${tx.amount}</td>
        <td>${tx.payment_method}</td>
        <td>${tx.status}</td>
        <td>${new Date(tx.created_at).toLocaleString()}</td>
        <td>
          ${tx.status === "pending" ? `
          <button class="confirmBtn" data-id="${tx.id}">✅ Confirm</button>
          <button class="rejectBtn" data-id="${tx.id}">❌ Reject</button>
          ` : "-"}
        </td>
      `;
      transactionTable.appendChild(tr);

      if (tx.status === "confirmed") totalRevenue += Number(tx.amount);
    });

    totalRevenueElem.textContent = `₱${totalRevenue.toFixed(2)}`;

    // Attach button event listeners
    document.querySelectorAll(".confirmBtn").forEach(btn =>
      btn.addEventListener("click", () => updateTransaction(btn.dataset.id, "confirmed"))
    );
    document.querySelectorAll(".rejectBtn").forEach(btn =>
      btn.addEventListener("click", () => updateTransaction(btn.dataset.id, "rejected"))
    );

  } catch (err) {
    console.error("Error loading transactions:", err);
    transactionTable.innerHTML = "<tr><td colspan='9' style='color:red'>Error loading transactions.</td></tr>";
  }
}

// ===============================
// 🔄 Update Transaction Status
// ===============================
async function updateTransaction(id, status) {
  try {
    // Disable buttons for this row while processing
    const rowButtons = document.querySelectorAll(`button[data-id="${id}"]`);
    rowButtons.forEach(b => b.disabled = true);

    const res = await fetch(`${API_BASE}/api/transactions/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Update failed");
    }

    await loadTransactions(); // refresh table
  } catch (err) {
    console.error("Error updating transaction:", err);
    alert(`Error updating transaction: ${err.message}`);
  }
}

// Auto-refresh every 30s
document.addEventListener("DOMContentLoaded", () => {
  loadTransactions();
  setInterval(loadTransactions, 30000);
});

// ======= Profile Section =======
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profilePic = document.getElementById("profile-pic");
const profileForm = document.getElementById("profile-form");
const passwordForm = document.getElementById("password-form");
const profileUploadForm = document.getElementById("profile-upload-form");

// Load user profile
async function loadProfile() {
  const res = await fetch(`${API_BASE}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
  const user = await res.json();
  profileName.value = user.name;
  profileEmail.value = user.email;
  if (user.profile_pic) profilePic.src = user.profile_pic;
}

// Update profile info
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const res = await fetch(`${API_BASE}/api/users/profile/update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: profileName.value, email: profileEmail.value }),
  });
  const data = await res.json();
  alert(data.message);
});

// Change password
passwordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const oldPassword = document.getElementById("old-password").value;
  const newPassword = document.getElementById("new-password").value;
  const res = await fetch(`${API_BASE}/api/users/profile/password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  const data = await res.json();
  alert(data.message);
});

// Upload profile picture
profileUploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("profile-pic-input");
  const formData = new FormData();
  formData.append("profile_pic", fileInput.files[0]);

  const res = await fetch(`${API_BASE}/api/users/profile/upload-pic`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (data.profile_pic) profilePic.src = data.profile_pic;
  alert(data.message);
});

// Initialize
loadProfile();

// ===============================
// ✅ Notification System
// ===============================
const notifBtn = document.getElementById("notifBtn");
const notifModal = document.getElementById("notifModal");
const notifList = document.getElementById("notifList");

notifBtn.addEventListener("click", async () => {
  notifModal.classList.toggle("hidden");

  const res = await fetch(`${API_BASE}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();

  notifList.innerHTML = "";
  if (data.length === 0) {
    notifList.innerHTML = `<li>No notifications yet.</li>`;
  } else {
    data.forEach((n) => {
      notifList.innerHTML += `
        <li class="${n.is_read ? "read" : "unread"}">
          <h4>${n.title}</h4>
          <p>${n.message}</p>
          <small>${new Date(n.created_at).toLocaleString()}</small>
        </li>`;
    });
  }
});


// ===============================
// ✅ Modal Preview
// ===============================
function showModal(imgUrl) {
  const modal = document.createElement("div");
  modal.style.position="fixed";modal.style.top=0;modal.style.left=0;modal.style.width="100%";modal.style.height="100%";
  modal.style.background="rgba(0,0,0,0.7)";modal.style.display="flex";modal.style.alignItems="center";modal.style.justifyContent="center";modal.style.zIndex=9999;
  const img = document.createElement("img"); img.src = imgUrl; img.style.maxWidth="90%"; img.style.maxHeight="90%"; img.style.borderRadius="10px";
  modal.appendChild(img);
  modal.addEventListener("click",()=>document.body.removeChild(modal));
  document.body.appendChild(modal);
}
