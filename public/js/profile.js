const API_BASE = "http://localhost:3000";
const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

// Load profile
async function loadProfile() {
  const res = await fetch(`${API_BASE}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  document.getElementById("name").value = data.name || "";
  document.getElementById("contact").value = data.contact || "";
  if (data.profile_pic)
    document.getElementById("profilePic").src = data.profile_pic;
}

// Update personal info
document.getElementById("infoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const contact = document.getElementById("contact").value;

  const res = await fetch(`${API_BASE}/api/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, contact }),
  });

  const data = await res.json();
  alert(data.message);
});

// Change password
document.getElementById("passwordForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;

  const res = await fetch(`${API_BASE}/api/profile/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();
  alert(data.message);
});

// Upload profile picture
document.getElementById("picForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append("profile_pic", document.getElementById("picInput").files[0]);

  const res = await fetch(`${API_BASE}/api/profile/upload-pic`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  alert(data.message);
  document.getElementById("profilePic").src = data.path;
});

loadProfile();
