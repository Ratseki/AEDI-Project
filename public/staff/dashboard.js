const token = localStorage.getItem("token");
if (!token) {
  alert("Please log in as staff to access this page.");
  window.location.href = "/login.html";
}

const customerSelect = document.getElementById("customerSelect");
const uploadBtn = document.getElementById("uploadBtn");
const generateQRBtn = document.getElementById("generateQRBtn");
const qrResult = document.getElementById("qrResult");
const uploadStatus = document.getElementById("uploadStatus");
const photoFile = document.getElementById("photoFile");
const photoList = document.getElementById("photoList");

// ✅ Load all customers for staff selection
async function loadCustomers() {
  try {
    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const users = await res.json();

    // Filter customers only
    const customers = users.filter((u) => u.role === "customer");

    if (customers.length === 0) {
      customerSelect.innerHTML = `<option value="">No customers found</option>`;
      return;
    }

    // Populate dropdown
    customerSelect.innerHTML = `<option value="">-- Select Customer --</option>`;
    customers.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.email})`;
      customerSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading customers:", err);
    customerSelect.innerHTML = `<option value="">Error loading customers</option>`;
  }
}


// ✅ Fetch uploaded photos for selected customer
async function loadCustomerPhotos(userId) {
  if (!userId) {
    photoList.innerHTML = "";
    return;
  }

  const res = await fetch(`/api/photos/gallery/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const photos = await res.json();
  if (!Array.isArray(photos)) {
    photoList.innerHTML = `<p style="color:red">Error loading photos.</p>`;
    return;
  }

  if (photos.length === 0) {
    photoList.innerHTML = `<p>No uploaded photos yet.</p>`;
    return;
  }

  photoList.innerHTML = photos
    .map(
      (p) => `
      <div style="background:#fafafa; border:1px solid #ddd; padding:10px; border-radius:8px; text-align:center;">
        <img src="${p.file_path}" style="width:100%; border-radius:5px; cursor:pointer;" onclick="showModal('${p.file_path}')">
        <p>Status: <strong>${p.status}</strong></p>
        <p>₱${p.price}</p>
        <button onclick="deletePhoto(${p.id})" style="color:white;background:red;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">Delete</button>
      </div>`
    )
    .join("");
}

// ✅ Multi-upload logic
document.getElementById("bulkUploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userId = customerSelect.value;
  const files = document.getElementById("bulkPhotos").files;

  if (!userId) return alert("Select a customer first!");
  if (files.length === 0) return alert("Select at least one photo!");

  const formData = new FormData();
  formData.append("user_id", userId);
  for (const file of files) formData.append("photos", file);

  const res = await fetch("/api/photos/upload-multiple", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  alert(data.message);
  loadCustomerPhotos(userId);
});


// ✅ Delete photo (staff only)
async function deletePhoto(photoId) {
  if (!confirm("Are you sure you want to delete this photo?")) return;

  const res = await fetch(`/api/photos/${photoId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  alert(data.message);
  loadCustomerPhotos(customerSelect.value);
}

// ✅ Preview modal logic
const modal = document.getElementById("photoModal");
const modalImage = document.getElementById("modalImage");

function showModal(src) {
  modalImage.src = src;
  modal.style.display = "flex";
}
modal.addEventListener("click", () => (modal.style.display = "none"));

// ✅ Auto-refresh gallery when customer is selected
customerSelect.addEventListener("change", (e) => {
  const userId = e.target.value;
  if (userId) loadCustomerPhotos(userId);
});

// ✅ Generate QR for selected customer
generateQRBtn.addEventListener("click", async () => {
  const userId = customerSelect.value;
  if (!userId) return alert("Please select a customer first!");

  const res = await fetch("/api/qr/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });

  const data = await res.json();
  if (res.ok) {
    qrResult.innerHTML = `
      <p><strong>QR Code Generated!</strong></p>
      <p>Code: <b>${data.code}</b></p>
      <p>Gallery Link: <a href="${data.gallery_link}" target="_blank">${data.gallery_link}</a></p>
      <p>Expires At: ${new Date(data.expires_at).toLocaleString()}</p>
    `;
  } else {
    alert("Error generating QR: " + data.message);
  }
});


// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadCustomers(); // ✅ load list of customers on page load
});
