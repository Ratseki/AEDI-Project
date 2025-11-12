document.addEventListener("DOMContentLoaded", () => {
  // ===============================
  // ✅ Profile Page Script
  // ===============================

  const API_BASE = "http://localhost:3000";
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please log in first.");
    window.location.href = "/login.html";
  }

  // 🔹 DOM Elements
  const profileName = document.querySelector("#profileName");
  const profileEmail = document.querySelector("#profileEmail");
  const profilePhone = document.querySelector("#profilePhone");
  const profileGender = document.getElementsByName("profileGender");
  const profileDOB = document.querySelector("#profileDOB");
  const profilePic = document.querySelector("#profilePic");
  const profileUploadInput = document.querySelector("#profileUploadInput");
  const changePicBtn = document.querySelector("#changePicBtn");
  const saveBtn = document.querySelector("#saveProfileBtn");
  const passwordForm = document.querySelector("#passwordForm");
  const addPaymentBtn = document.querySelector("#addPaymentBtn");

  const panelProfile = document.querySelector("#panelProfile");
  const panelBanks = document.querySelector("#panelBanks");
  const panelPassword = document.querySelector("#panelPassword");
  const panelGallery = document.querySelector("#panelGallery");
  const sidebarLinks = document.querySelectorAll(".sidebar nav ul li");

  const sidebarAvatar = document.querySelector(".user-info .avatar");
  const sidebarName = document.querySelector(".user-info h2");

  // ===============================
  // 🔹 Panel Switching
  // ===============================
  function hideAllPanels() {
    [panelProfile, panelBanks, panelPassword, panelGallery].forEach(p => p.style.display = "none");
    sidebarLinks.forEach(l => l.classList.remove("active"));
  }

  sidebarLinks.forEach(link => {
  if (link.classList.contains("section-title")) return; // ignore titles

  link.addEventListener("click", () => {
    hideAllPanels();
    switch (link.textContent.trim()) {
      case "Profile": panelProfile.style.display = "block"; break;
      case "Banks & Cards": panelBanks.style.display = "block"; break;
      case "Change Password": panelPassword.style.display = "block"; break;
      case "My Gallery": panelGallery.style.display = "block"; break;
    }
    link.classList.add("active");
  });
});


  // ===============================
  // 📥 Load User Profile
  // ===============================
  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load profile.");

      // ===== Main Profile Section =====
      profileName.value = data.name || "";
      profileEmail.textContent = data.email || "";
      profilePhone.value = data.contact || "";
      profileDOB.value = data.dob ? data.dob.split("T")[0] : "";

      if (data.gender) {
        Array.from(profileGender).forEach(r => r.checked = r.value === data.gender);
      }

      profilePic.src = data.profile_pic
        ? `${API_BASE}${data.profile_pic}?t=${Date.now()}`
        : "/assets/default-avatar.png";

      // ===== Sidebar Update =====
      sidebarAvatar.src = data.profile_pic
        ? `${API_BASE}${data.profile_pic}?t=${Date.now()}`
        : "/assets/default-avatar.png";

      sidebarName.textContent = data.name || "User";

    } catch (err) {
      console.error(err);
      alert("Error loading profile data.");
    }
  }

  // ===============================
  // 💾 Save Updated Profile Info
  // ===============================
  saveBtn.addEventListener("click", async () => {
    try {
      const gender = Array.from(profileGender).find(r => r.checked)?.value || "Other";

      const updatedData = {
        name: profileName.value.trim(),
        contact: profilePhone.value.trim(),
        dob: profileDOB.value,
        gender,
      };

      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed.");

      alert("Profile updated successfully!");
      loadProfile();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // ===============================
  // 🖼️ Profile Picture Upload
  // ===============================
  function triggerUpload() {
    profileUploadInput.click();
  }
  profilePic.addEventListener("click", triggerUpload);
  if (changePicBtn) changePicBtn.addEventListener("click", triggerUpload);

  profileUploadInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_pic", file);

    try {
      const res = await fetch(`${API_BASE}/api/profile/upload-pic`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed.");

      // Update main profile pic AND sidebar instantly
      profilePic.src = `${API_BASE}${data.path}?t=${Date.now()}`;
      sidebarAvatar.src = `${API_BASE}${data.path}?t=${Date.now()}`;

      alert("Profile picture updated!");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // ===============================
  // 🔐 Change Password
  // ===============================
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPassword = document.querySelector("#currentPassword").value;
      const newPassword = document.querySelector("#newPassword").value;
      const confirmPassword = document.querySelector("#confirmPassword").value;

      if (newPassword !== confirmPassword) return alert("New passwords do not match!");

      try {
        const res = await fetch(`${API_BASE}/api/profile/change-password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Password change failed.");

        alert("Password changed successfully!");
        passwordForm.reset();
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });
  }

  // ===============================
// 🚀 My Gallery Backend Integration
// ===============================
let userId = null;
let selectedPhotos = new Set();
let remainingDownloads = 0;

async function initGallery() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' });
    if (!res.ok) throw new Error('Not logged in');
    const data = await res.json();
    if (!data.valid) throw new Error('Invalid session');

    userId = data.user.id;

    await loadDownloadInfo();
    await loadGallery();
  } catch (err) {
    console.error('Gallery init error:', err);
    alert('Please log in first.');
  }
}

async function loadDownloadInfo() {
  try {
    const res = await fetch(`${API_BASE}/api/photos/downloads`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch downloads');
    const { remaining, total } = await res.json();
    remainingDownloads = remaining;

    document.getElementById('remaining-downloads').textContent = remaining;
  } catch (err) {
    console.error('Download info error:', err);
  }
}

async function loadGallery() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/photos/gallery/user`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to load gallery');
    const photos = await res.json();
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';

    if (!photos.length) {
      galleryGrid.innerHTML = '<p>No photos found.</p>';
      return;
    }

    photos.forEach(photo => {
  const card = document.createElement('div');
  card.className = 'gallery-item';
  card.style.position = 'relative';

  const img = document.createElement('img');
  img.src = photo.file_path;
  img.alt = photo.file_name || 'Photo';
  img.style.width = '100%';
  img.style.borderRadius = '6px';
  card.appendChild(img);

  const selectIcon = document.createElement('div');
  selectIcon.className = 'select-icon';
  selectIcon.textContent = '✓';
  selectIcon.style.cssText = 'position:absolute; top:5px; left:5px; width:20px; height:20px; background:#F4981E; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:12px;';
  card.appendChild(selectIcon);

  card.addEventListener('click', () => {
    card.classList.toggle('selected');
    selectIcon.style.background = card.classList.contains('selected') ? '#f5a623' : '#F4981E';
    selectedPhotos = new Set([...document.querySelectorAll('.gallery-item.selected')].map(el => el.dataset.id));
    document.getElementById('selected-count').textContent = `${selectedPhotos.size} Selected`;
  });

  card.dataset.id = photo.id;
  galleryGrid.appendChild(card);
});


  } catch (err) {
    console.error('Load gallery error:', err);
    document.getElementById('gallery-grid').innerHTML = '<p style="color:red">Error loading gallery.</p>';
  }
}

// Download selected photos
document.getElementById('bulkDownloadBtn')?.addEventListener('click', async () => {
  if (!selectedPhotos.size) return alert('Select at least one photo!');
  for (const photoId of selectedPhotos) {
    await fetch(`${API_BASE}/api/photos/download/${photoId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `photo_${photoId}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => console.error('Download error:', err));
  }
});

initGallery();


  const downloadBtn = panelGallery.querySelector("button.save-btn");
  downloadBtn?.addEventListener("click", () => {
    const selected = panelGallery.querySelectorAll(".gallery-item.selected");
    if (selected.length === 0) return alert("Select at least 1 photo to download!");
    alert(`You selected ${selected.length} photo(s) to download. Backend logic can be added here.`);
  });

  // ===============================
  // 💳 Banks & Cards PayMongo Integration
  // ===============================
  addPaymentBtn?.addEventListener("click", async () => {
    try {
      const bookingId = prompt("Enter your booking ID:");
      const amount = parseFloat(prompt("Enter payment amount:"));
      if (!bookingId || !amount || amount <= 0) return alert("Invalid booking or amount.");

      const method = "card"; // default to card, can extend to gcash, grabpay, etc.

      const res = await fetch(`${API_BASE}/api/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, booking_id: bookingId, method }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment session failed.");

      window.open(data.checkout_url, "_blank");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // ===============================
  // 🚀 Initialize
  // ===============================
  loadProfile();
});
