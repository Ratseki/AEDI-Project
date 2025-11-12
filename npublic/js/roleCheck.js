// /public/js/roleCheck.js

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // If no token, force logout
  if (!token || !role) {
    window.location.href = "login.html";
    return;
  }

  // Decode token to check expiration (JWT exp is in seconds)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Date.now() / 1000;
    if (payload.exp && payload.exp < now) {
      // Token expired
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      alert("Session expired. Please log in again.");
      window.location.href = "login.html";
      return;
    }
  } catch (e) {
    console.error("Invalid token format:", e);
    window.location.href = "login.html";
    return;
  }

  // FRONTEND ROLE ACCESS CONTROL
  const currentPage = window.location.pathname.toLowerCase();

  // 🔒 Pages restricted to staff/admin only
  const staffOnlyPages = ["/staff/dashboard.html", "/dashboard.html"];
  if (staffOnlyPages.some(p => currentPage.endsWith(p))) {
    if (role !== "staff" && role !== "admin") {
      alert("Access denied: Staff/Admin only");
      window.location.href = "user_gallery.html";
      return;
    }
  }

  // 🔒 Pages restricted to customers only (optional)
  const customerOnlyPages = ["/user_gallery.html"];
  if (customerOnlyPages.some(p => currentPage.endsWith(p))) {
    if (role !== "customer") {
      alert("Access denied: Customer only");
      window.location.href = "dashboard.html";
      return;
    }
  }

  // (Optional) Verify token with backend for extra safety
  try {
    const res = await fetch("/api/auth/verify", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      alert("Session invalid or expired. Please log in again.");
      window.location.href = "login.html";
    }
  } catch (err) {
    console.error("Auth check failed:", err);
  }
});
