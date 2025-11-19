const API_BASE = "http://localhost:3000";
const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

// DOM Elements
const nameInput = document.getElementById("name");
const contactInput = document.getElementById("contact");
const genderInputs = document.getElementsByName("gender");
const dobInput = document.getElementById("dob");
const profilePic = document.getElementById("profilePic");

const infoForm = document.getElementById("infoForm");
const passwordForm = document.getElementById("passwordForm");
const picForm = document.getElementById("picForm");
const picInput = document.getElementById("picInput");

// ===============================
// Load profile
// ===============================
async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    nameInput.value = data.name || "";
    contactInput.value = data.contact || "";
    dobInput.value = data.dob ? data.dob.split("T")[0] : "2000-01-01";

    // Set gender radio
    if (data.gender) {
      for (let radio of genderInputs) {
        radio.checked = radio.value === data.gender;
      }
    } else {
      genderInputs[0].checked = true; // default to first option
    }

    // Profile picture
    profilePic.src = data.profile_pic || "/assets/default-avatar.png";
  } catch (err) {
    console.error(err);
    alert("Failed to load profile.");
  }
}

// ===============================
// Update personal info
// ===============================
infoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const gender = Array.from(genderInputs).find(r => r.checked)?.value || "Other";

  try {
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        contact: contactInput.value.trim(),
        gender,
        dob: dobInput.value,
      }),
    });

    const data = await res.json();
    alert(data.message || "Profile updated successfully!");
    loadProfile();
  } catch (err) {
    console.error(err);
    alert("Failed to update profile.");
  }
});

// ===============================
// Change password
// ===============================
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
    alert(data.message || "Password changed successfully!");
    passwordForm.reset();
  } catch (err) {
    console.error(err);
    alert("Failed to change password.");
  }
});

// ===============================
// Upload profile picture
// ===============================
picForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!picInput.files[0]) return alert("Please select a file.");

  const formData = new FormData();
  formData.append("profile_pic", picInput.files[0]);

  try {
    const res = await fetch(`${API_BASE}/api/profile/upload-pic`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    
    // ✅ FIX: Add a random query param to force the browser to reload the image
    // This prevents the "old image still showing" bug
    profilePic.src = `${data.path}?t=${new Date().getTime()}`;
    
    alert(data.message || "Profile picture updated!");
    // Clear the file input
    picInput.value = ""; 
  } catch (err) {
    console.error(err);
    alert("Failed to upload profile picture.");
  }
});

// Initialize
loadProfile();
