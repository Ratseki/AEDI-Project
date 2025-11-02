// ===============================
// ✅ Staff Dashboard Script (Final Version with Bulk Delete)
// ===============================
const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in as staff to access this page.");
  window.location.href = "/login.html";
}

// 🔹 Base URL for all API calls
const API_BASE = "http://localhost:3000";

// Element references
const customerSelect = document.getElementById("customerSelect");
const generateQRBtn = document.getElementById("generateQRBtn");
const qrResult = document.getElementById("qrResult");
const uploadStatus = document.getElementById("uploadStatus");
const photoList = document.getElementById("photoList");

let selectedPhotos = new Set(); // track selected photos for bulk delete

// ===============================
// ✅ Load all customers for staff
// ===============================
async function loadCustomers() {
  try {
    const res = await fetch(`${API_BASE}/api/photos/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load customers");
    const customers = await res.json();

    if (!Array.isArray(customers) || customers.length === 0) {
      customerSelect.innerHTML = `<option value="">No customers found</option>`;
      return;
    }

    customerSelect.innerHTML = `<option value="">-- Select Customer --</option>`;
    customers.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.email})`;
      customerSelect.appendChild(opt);
    });

    console.log(`✅ Loaded ${customers.length} customers`);
  } catch (err) {
    console.error("Error loading customers:", err);
    customerSelect.innerHTML = `<option value="">Error loading customers</option>`;
  }
}

// ===============================
// ✅ Load selected customer's photos with bulk delete
// ===============================
async function loadCustomerPhotos(userId) {
  if (!userId) {
    photoList.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/photos/gallery/customer/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to load photos");
    const photos = await res.json();

    if (!Array.isArray(photos) || photos.length === 0) {
      photoList.innerHTML = `<p>No uploaded photos yet.</p>`;
      return;
    }

    selectedPhotos.clear();

    // Add select all checkbox + bulk delete button
    const selectAllHTML = `
      <div style="margin-bottom:10px;">
        <input type="checkbox" id="selectAllPhotos"> <label for="selectAllPhotos">Select All</label>
        <button id="bulkDeleteBtn" style="margin-left:10px;padding:5px 10px;background:red;color:white;border:none;border-radius:5px;cursor:pointer;">Delete Selected</button>
      </div>
    `;

    photoList.innerHTML =
      selectAllHTML +
      photos
        .map(
          (p) => `
        <div style="background:#fafafa; border:1px solid #ddd; padding:10px; border-radius:8px; text-align:center; margin-bottom:10px;" data-id="${p.id}">
          <input type="checkbox" class="photoCheckbox" style="margin-bottom:5px;">
          <img src="${p.file_path}" style="width:100%; border-radius:5px; cursor:pointer;" onclick="showModal('${p.file_path}')">
          <p>Status: <strong>${p.status}</strong></p>
          <p>₱${p.price}</p>
          <button onclick="deletePhoto(${p.id})" style="color:white;background:red;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">Delete</button>
        </div>`
        )
        .join("");

    // Event listeners for individual checkboxes
    const photoCheckboxes = document.querySelectorAll(".photoCheckbox");
    photoCheckboxes.forEach((cb, i) => {
      cb.addEventListener("change", () => {
        const photoId = photos[i].id;
        if (cb.checked) selectedPhotos.add(photoId);
        else selectedPhotos.delete(photoId);
      });
    });

    // Select all checkbox
    const selectAll = document.getElementById("selectAllPhotos");
    selectAll.addEventListener("change", () => {
      const checked = selectAll.checked;
      photoCheckboxes.forEach((cb, i) => {
        cb.checked = checked;
        const photoId = photos[i].id;
        if (checked) selectedPhotos.add(photoId);
        else selectedPhotos.delete(photoId);
      });
    });

    // Bulk delete button
    const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");
    bulkDeleteBtn.addEventListener("click", async () => {
      if (selectedPhotos.size === 0) return alert("Select at least one photo to delete.");
      if (!confirm("Are you sure you want to delete the selected photos?")) return;

      try {
        const res = await fetch(`${API_BASE}/api/photos/delete-bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ photo_ids: Array.from(selectedPhotos) }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Bulk delete failed");

        alert(data.message);
        await loadCustomerPhotos(userId); // refresh gallery
      } catch (err) {
        console.error("Bulk delete error:", err);
        alert("Error deleting photos.");
      }
    });
  } catch (err) {
    console.error("Error loading photos:", err);
    photoList.innerHTML = `<p style="color:red">Error loading photos</p>`;
  }
}

// ===============================
// ✅ Unified Upload (Single or Multiple)
// ===============================
document.getElementById("bulkUploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = customerSelect.value;
  const files = document.getElementById("bulkPhotos").files;

  if (!userId) return alert("Select a customer first!");
  if (files.length === 0) return alert("Select at least one photo!");

  uploadStatus.textContent = "Uploading photos...";
  uploadStatus.style.color = "black";

  const formData = new FormData();
  formData.append("user_id", userId);
  for (const file of files) formData.append("photos", file);

  try {
    const res = await fetch(`${API_BASE}/api/photos/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload failed");

    uploadStatus.textContent = data.message;
    uploadStatus.style.color = "green";

    // Refresh gallery with checkboxes after upload
    await loadCustomerPhotos(userId);
  } catch (err) {
    console.error("Upload error:", err);
    uploadStatus.textContent = "Error uploading photos.";
    uploadStatus.style.color = "red";
  }
});

// ===============================
// ✅ Delete photo (staff/admin only)
// ===============================
async function deletePhoto(photoId) {
  if (!confirm("Are you sure you want to delete this photo?")) return;

  try {
    const res = await fetch(`${API_BASE}/api/photos/${photoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    alert(data.message);
    await loadCustomerPhotos(customerSelect.value);
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete photo.");
  }
}

// ===============================
// ✅ Preview modal logic
// ===============================
const modal = document.getElementById("photoModal");
const modalImage = document.getElementById("modalImage");

function showModal(src) {
  modalImage.src = src;
  modal.style.display = "flex";
}
modal.addEventListener("click", () => (modal.style.display = "none"));

// ===============================
// ✅ Generate QR Code
// ===============================
generateQRBtn.addEventListener("click", async () => {
  const userId = customerSelect.value;
  if (!userId) return alert("Please select a customer first!");

  try {
    const res = await fetch(`${API_BASE}/api/qr/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "QR generation failed");

    qrResult.innerHTML = `
      <p><strong>QR Code Generated!</strong></p>
      <p>Code: <b>${data.code}</b></p>
      <p>Gallery Link: <a href="${data.gallery_link}" target="_blank">${data.gallery_link}</a></p>
      <p>Expires At: ${new Date(data.expires_at).toLocaleString()}</p>
    `;
  } catch (err) {
    console.error("QR generation error:", err);
    alert("Error generating QR.");
  }
});

// ===============================
// ✅ Listen for customer selection
// ===============================
customerSelect.addEventListener("change", (e) => {
  const userId = e.target.value;
  if (userId) loadCustomerPhotos(userId);
  else photoList.innerHTML = "";
});

// ===============================
// ✅ Verify token before loading
// ===============================
(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok || !data.valid || (data.user.role !== "staff" && data.user.role !== "admin")) {
      alert("Access denied.");
      localStorage.clear();
      window.location.href = "/forbidden.html";
      return;
    }

    console.log("✅ Access granted:", data.user.role);
    await loadCustomers();
  } catch (err) {
    console.error("Auth verification failed:", err);
    localStorage.clear();
    window.location.href = "/login.html";
  }
})();
