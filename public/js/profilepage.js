// ===============================
// ✅ profilepage.js (FINAL CLEAN VERSION)
// ===============================

const API_BASE = "http://localhost:3000";
// Use the cookie for auth, but some routes might check the token header
const token = localStorage.getItem("token");

// --- Elements ---
const navItems = document.querySelectorAll(".sidebar nav ul li");
const panels = {
  "Profile": document.getElementById("panelProfile"),
  "Banks & Cards": document.getElementById("panelBanks"),
  "Change Password": document.getElementById("panelPassword"),
  // Note: Gallery/Bookings will redirect, so no panels needed here
};

// Profile Elements
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileDOB = document.getElementById("profileDOB");
const genderRadios = document.getElementsByName("profileGender");
const saveProfileBtn = document.getElementById("saveProfileBtn");

const profilePic = document.getElementById("profilePic");
const changePicBtn = document.getElementById("changePicBtn");
const profileModal = document.getElementById("profileModal");
const modalProfileUpload = document.getElementById("modalProfileUpload");
const passwordForm = document.getElementById("passwordForm");

// ===============================
// 1. Initialize
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadProfileData();
  setupSidebar();
  setupModal();
});

// ===============================
// 2. Load Profile Data
// ===============================
async function loadProfileData() {
  try {
    // Check auth first
    const res = await fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' });
    if (!res.ok) window.location.href = "/login.html";
    const authData = await res.json();
    if (!authData.valid) window.location.href = "/login.html";

    // Now load profile details
    const profileRes = await fetch(`${API_BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await profileRes.json();

    // Fill Inputs
    if (profileName) profileName.value = data.name || "";
    if (profileEmail) profileEmail.textContent = data.email || "No email";
    if (profilePhone) profilePhone.value = data.contact || "";
    if (profileDOB) profileDOB.value = data.dob ? data.dob.split("T")[0] : "";

    // Set Gender
    if (data.gender) {
      for (const radio of genderRadios) {
        if (radio.value === data.gender) radio.checked = true;
      }
    }

    // Set Pic
    if (data.profile_pic) {
      const freshUrl = `${data.profile_pic}?t=${Date.now()}`;
      if (profilePic) profilePic.src = freshUrl;
      const sidebarAvatar = document.querySelector(".sidebar .avatar");
      if (sidebarAvatar) sidebarAvatar.src = freshUrl;
    }

    // Set Sidebar Name
    const sidebarName = document.querySelector(".sidebar h2");
    if (sidebarName) sidebarName.textContent = data.name || "User";

  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// ===============================
// 3. Save Profile Changes
// ===============================
if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", async () => {
    const gender = Array.from(genderRadios).find(r => r.checked)?.value || null;

    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName.value.trim(),
          contact: profilePhone.value.trim(),
          gender: gender,
          dob: profileDOB.value,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("✅ Profile updated successfully!");
      loadProfileData(); // Refresh UI
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  });
}

// ===============================
// 4. Change Password
// ===============================
if (passwordForm) {
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      return alert("New passwords do not match!");
    }

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
      if (!res.ok) throw new Error(data.message);

      alert("✅ Password changed successfully!");
      passwordForm.reset();
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  });
}

// ===============================
// 5. Profile Picture Logic
// ===============================
function setupModal() {
  if (!changePicBtn) return;

  // Open Modal
  changePicBtn.addEventListener("click", () => {
    if (profileModal) profileModal.style.display = "flex";
  });

  // Close Modal Global Function (for HTML onclick)
  window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
  };

  // Save Pic (Upload)
  window.saveProfilePic = async () => {
    if (!modalProfileUpload.files[0]) return alert("Please select a file.");

    const formData = new FormData();
    formData.append("profile_pic", modalProfileUpload.files[0]);

    try {
      const res = await fetch(`${API_BASE}/api/profile/upload-pic`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("✅ Profile picture updated!");
      closeModal("profileModal");
      loadProfileData(); // Refresh images
    } catch (err) {
      console.error(err);
      alert("Failed to upload profile picture.");
    }
  };
}

// ===============================
// 6. Sidebar Navigation Logic
// ===============================
function setupSidebar() {
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      // Ignore section titles
      if (item.classList.contains("section-title")) return;

      const text = item.innerText.trim();

      // ✅ REDIRECT Logic for Gallery Pages
      if (text === "My Gallery" || text === "My Photos" || text === "Bookings") {
        window.location.href = "/user/user_gallery.html";
        return;
      }

      // Normal Tab Switching
      navItems.forEach(li => li.classList.remove("active"));
      item.classList.add("active");

      Object.values(panels).forEach(panel => {
        if (panel) panel.style.display = "none";
      });

      if (panels[text]) {
        panels[text].style.display = "block";
      }
    });
  });
}