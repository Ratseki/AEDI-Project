// ===============================
// ✅ Unified Dashboard Script (Admin + Staff)
// ===============================

const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

const API_BASE = "http://localhost:3000";

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

    currentUserRole = data.user.role;
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
        <button id="purchaseSelectedBtn" style="margin-left:10px;padding:5px 10px;background:green;color:white;border:none;border-radius:5px;cursor:pointer;">Purchase Selected</button>
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

    // --- checkbox logic ---
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

    // --- bulk delete ---
    document.getElementById("bulkDeleteBtn").addEventListener("click", async () => {
      if (selectedPhotos.size === 0) return alert("Select at least one photo to delete.");
      if (!confirm("Are you sure you want to delete the selected photos?")) return;
      try {
        const res = await fetch(`${API_BASE}/api/photos/delete-bulk`, {
          method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`}, 
          body: JSON.stringify({ photo_ids: Array.from(selectedPhotos) })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.message||"Bulk delete failed");
        alert(data.message); await loadCustomerPhotos(userId);
      } catch(err){ console.error(err); alert("Error deleting photos."); }
    });

    // --- new: bulk purchase ---
    document.getElementById("purchaseSelectedBtn").addEventListener("click", async () => {
      if (selectedPhotos.size === 0) return alert("Select at least one photo to purchase.");
      const selected = photos.filter(p => selectedPhotos.has(p.id));
      const totalAmount = selected.reduce((sum, p) => sum + Number(p.price || 0), 0);

      if (!confirm(`Proceed to purchase ${selected.length} photos for ₱${totalAmount}?`)) return;

      try {
        const res = await fetch(`${API_BASE}/api/photos/purchase`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: userId,
            photo_ids: Array.from(selectedPhotos),
            total_amount: totalAmount
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Purchase failed");

        alert(`✅ ${data.message || "Purchase successful!"}`);
        await loadCustomerPhotos(userId);
      } catch (err) {
        console.error(err);
        alert("Error during purchase.");
      }
    });

  } catch (err) { 
    console.error(err); 
    photoList.innerHTML = `<p style="color:red">Error loading photos</p>`; 
  }
}


// ===============================
// ✅ Upload Photos
// ===============================
document.getElementById("bulkUploadForm").addEventListener("submit", async e => {
  e.preventDefault();
  const userId = customerSelect.value;
  const files = document.getElementById("bulkPhotos").files;
  if (!userId) return alert("Select a customer first!"); 
  if (files.length === 0) return alert("Select at least one photo!");
  uploadStatus.textContent = "Uploading photos..."; uploadStatus.style.color="black";

  const formData = new FormData();
  formData.append("user_id", userId);
  for (const file of files) formData.append("photos", file);

  try {
    const res = await fetch(`${API_BASE}/api/photos/upload`, { method:"POST", headers:{Authorization:`Bearer ${token}`}, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message||"Upload failed");
    uploadStatus.textContent = data.message; uploadStatus.style.color="green";
    await loadCustomerPhotos(userId);
  } catch(err){ console.error(err); uploadStatus.textContent="Error uploading photos."; uploadStatus.style.color="red"; }
});

// ===============================
// ✅ Single Photo Delete
// ===============================
async function deletePhoto(photoId) {
  if(!confirm("Delete this photo?")) return;
  try {
    const res = await fetch(`${API_BASE}/api/photos/${photoId}`, { method:"DELETE", headers:{Authorization:`Bearer ${token}`} });
    const data = await res.json();
    if(!res.ok) throw new Error(data.message||"Delete failed");
    alert(data.message);
    loadCustomerPhotos(customerSelect.value);
  } catch(err){ console.error(err); alert("Error deleting photo."); }
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
    // ✅ Show QR code and clickable link
    document.getElementById("qrResult").innerHTML = `
      <a href="${data.gallery_link}" target="_blank" style="display:inline-block;text-align:center;">
        <img src="${data.qr_image}" alt="QR Code" style="max-width:200px; margin-bottom:5px;"/>
        <p>Open Gallery</p>
      </a>
    `;
    console.error(err);
    alert("Error generating QR.");
  } finally {
    generateQRBtn.disabled = false;
  }
});

// ===============================
// 💳 Load and Manage Transactions (Updated)
// ===============================
async function loadTransactions() {
  try {
    const res = await fetch("/api/transactions", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    if (!res.ok) throw new Error("Failed to load transactions");

    const data = await res.json();
    const tbody = document.querySelector("#transactionsTable tbody");
    tbody.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-3 text-gray-500">No transactions found</td></tr>`;
      return;
    }

    data.forEach((tx, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${tx.user_name}</td>
        <td>${tx.reference_id || "—"}</td>
        <td>${tx.type}</td>
        <td>₱${tx.amount}</td>
        <td>${tx.payment_method}</td>
        <td>
          <span class="status ${tx.status}">
            ${
              tx.status === "confirmed"
                ? "✅ Confirmed"
                : tx.status === "rejected"
                ? "❌ Rejected"
                : "⏳ Pending"
            }
          </span>
        </td>
        <td>${new Date(tx.created_at).toLocaleString()}</td>
        <td>
          ${
            tx.status === "pending"
              ? `
                <button class="confirm bg-green-500 text-white px-2 py-1 rounded" data-id="${tx.id}">Confirm</button>
                <button class="reject bg-red-500 text-white px-2 py-1 rounded" data-id="${tx.id}">Reject</button>
              `
              : `<span class="text-gray-400">—</span>`
          }
        </td>
      `;
      tbody.appendChild(tr);
    });

    // 🟢 Confirm & 🔴 Reject actions
    document.querySelectorAll(".confirm").forEach(btn => {
      btn.addEventListener("click", () => updateTransactionStatus(btn.dataset.id, "confirmed"));
    });
    document.querySelectorAll(".reject").forEach(btn => {
      btn.addEventListener("click", () => updateTransactionStatus(btn.dataset.id, "rejected"));
    });
  } catch (err) {
    console.error("Failed to load transactions:", err);
  }
}

// ===============================
// 🔄 Update Transaction Status
// ===============================
async function updateTransactionStatus(id, status) {
  try {
    const res = await fetch(`/api/transactions/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ status })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Update failed");

    alert(`Transaction ${status} successfully!`);
    loadTransactions(); // refresh
  } catch (err) {
    console.error("Error updating transaction:", err);
    alert("Error updating transaction status.");
  }
}

document.addEventListener("DOMContentLoaded", loadTransactions);

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
