// js/gallery.js
const token = localStorage.getItem("token");
const galleryContainer = document.getElementById("gallery");
const payError = document.getElementById("payError");

// Get booking_id from URL (optional, if gallery is per booking)
const bookingId = new URLSearchParams(window.location.search).get("booking_id");

if (!token) {
  alert("Please log in again.");
  window.location.href = "/login.html";
}

async function loadGallery() {
  try {
    const res = await fetch(`/api/photos/gallery/${bookingId}`, {
      headers: { Authorization: "Bearer " + token },
    });

    if (!res.ok) {
      const err = await res.json();
      payError.textContent = err.message || "Failed to load gallery.";
      return;
    }

    const photos = await res.json();
    if (!photos.length) {
      galleryContainer.innerHTML = "<p>No photos available yet.</p>";
      return;
    }

    galleryContainer.innerHTML = photos.map(photo => `
    <div class="photo-card">
      <img src="/${photo.file_path}" alt="Photo ${photo.id}" />
      <p>Photo #${photo.id}</p>
      ${
        photo.purchase_status === 'purchased'
          ? `<a href="/${photo.file_path.replace('watermarked', 'originals')}" download>Download</a>`
          : `<button onclick="buyPhoto(${photo.id}, ${photo.price || 50}, 'gcash')">Buy ₱${photo.price || 50}</button>`
      }
    </div>
  `).join("");

  } catch (err) {
    console.error("❌ Gallery load error:", err);
    payError.textContent = "Network error loading photos.";
  }
}

async function buyPhoto(photo_id, price, method) {
  try {
    const res = await fetch("/api/photo-purchases/buy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ photo_id, price, method })
    });

    const data = await res.json();
    if (!res.ok || !data.checkout_url) {
      console.error("PayMongo error:", data);
      payError.textContent = data.message || "Failed to create checkout.";
      return;
    }

    // Redirect to PayMongo checkout
    window.location.href = data.checkout_url;
  } catch (err) {
    console.error("❌ Buy photo error:", err);
    payError.textContent = "Payment failed.";
  }
}

loadGallery();
