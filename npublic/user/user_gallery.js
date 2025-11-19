let userId = null;
let selectedPhotos = new Set();
let remainingDownloads = 0;

// Initialize gallery
async function initGallery() {
  try {
    const res = await fetch('/api/auth/verify', { credentials: 'include' });
    if (!res.ok) throw new Error('Not logged in');

    const data = await res.json();
    if (!data.valid) throw new Error('Invalid session');

    // In initGallery function...
    userId = data.user.id;
    
    // ✅ FIX: Select by ID
    const sidebarName = document.getElementById("sidebar-username");
    const sidebarPic = document.getElementById("sidebar-profile-pic");

    if (sidebarName) sidebarName.textContent = data.user.name || "User";
    document.querySelector(".sidebar h3").textContent = data.user.name || "User";

    await loadDownloadInfo();
    await loadGallery();

    const dateElem = document.getElementById('gallery-date');
    dateElem.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
    });

  } catch (err) {
    console.error('Gallery init error:', err);
    alert('Please log in first.');
    window.location.href = '/login.html';
  }
}

async function loadDownloadInfo() {
  try {
    const res = await fetch('/api/photos/downloads', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch downloads');

    const { remaining, total } = await res.json();
    
    // ✅ FIX: Force the UI to match the server's truth
    remainingDownloads = remaining; 
    
    const remainingElem = document.getElementById('remaining-downloads');
    const totalElem = document.getElementById('total-downloads');

    if (remainingElem) remainingElem.textContent = remaining;
    if (totalElem) totalElem.textContent = total;
    
  } catch (err) {
    console.error('Download info error:', err);
  }
}

async function loadGallery(forUserId = null) {
  try {
    const token = localStorage.getItem("token");
    const url = forUserId 
      ? `/api/photos/gallery/customer/${forUserId}` 
      : '/api/photos/gallery/user';
    
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to load gallery');

    const data = await res.json();
    const photos = data.photos || data; // staff route returns array directly
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';

    if (!photos.length) {
      galleryGrid.innerHTML = '<p>No photos found.</p>';
      return;
    }

    photos.forEach(photo => {
      const card = document.createElement('div');
      card.className = `photo-card ${photo.status === 'expired' ? 'expired' : ''}`;
      card.style.position = 'relative'; // make checkbox positioning work
      
      const img = document.createElement('img');
      img.src = photo.file_path;
      img.alt = photo.file_name || 'Gallery Photo';
      img.style.objectFit = 'cover';
      card.appendChild(img);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'photo-checkbox';
      checkbox.disabled = photo.status !== 'available';
      checkbox.onclick = () => {
        if (checkbox.checked) selectedPhotos.add(photo.id);
        else selectedPhotos.delete(photo.id);
        card.classList.toggle('selected', checkbox.checked);
      };
      card.appendChild(checkbox);

      const statusBadge = document.createElement('div');
      statusBadge.className = `status ${photo.status}`;
      statusBadge.textContent = photo.status.charAt(0).toUpperCase() + photo.status.slice(1);
      card.appendChild(statusBadge);

      const btn = document.createElement('button');
      btn.style.width = '100%';
      btn.style.padding = '10px';
      btn.style.borderRadius = '6px';
      btn.style.cursor = 'pointer';

      if (photo.status === 'available') {
        btn.textContent = `Buy ₱${photo.price}`;
        btn.style.backgroundColor = '#CE6826';
        btn.style.color = '#fff';
        btn.onclick = () => purchasePhoto(photo.id, photo.price);
      } else if (photo.status === 'purchased') {
        btn.textContent = 'Download';
        btn.style.backgroundColor = '#4CAF50';
        btn.onclick = () => downloadPhoto(photo.id);
      } else {
        btn.textContent = 'Expired';
        btn.disabled = true;
      }

      card.appendChild(btn);
      galleryGrid.appendChild(card);
    });
  } catch (err) {
    console.error('Load gallery error:', err);
    document.getElementById('gallery-grid').innerHTML = '<p style="color:red">Error loading gallery.</p>';
  }
}

// Get the selected payment method from dropdown
function getSelectedPaymentMethod() {
  const select = document.getElementById("payment-method-select");
  return select?.value || "card"; // defaults to card
}

// Purchase a single photo (with price)
async function purchasePhoto(photoId) {
  try {
    const method = getSelectedPaymentMethod();

    const res = await fetch('/api/photo-purchases/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ photo_id: photoId, method })
    });

    const data = await res.json();
    if (res.ok && data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      alert(data.message || 'Purchase failed');
    }
  } catch (err) {
    console.error('Purchase error:', err);
  }
}

// Bulk purchase remains the same
async function purchaseSelectedPhotos() {
  if (!selectedPhotos.size) return alert('Select at least one photo.');

  const method = getSelectedPaymentMethod();

  try {
    const res = await fetch('/api/photo-purchases/purchase-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ photo_ids: Array.from(selectedPhotos), method })
    });

    const data = await res.json();
    if (res.ok && data.checkout_url) {
      // redirect to PayMongo checkout
      window.location.href = data.checkout_url;
    } else {
      alert(data.message || 'Bulk purchase failed');
    }
  } catch (err) {
    console.error('Bulk purchase error:', err);
    alert('Error processing bulk purchase');
  }
}

// Download a photo
async function downloadPhoto(photoId) {
  if (remainingDownloads <= 0) return alert('No remaining downloads left!');

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`/api/photos/download/${photoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return alert(data.message || 'Download failed');
    }

    // ✅ Convert the response to a blob (image)
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo_${photoId}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // ✅ Decrease remaining download count visually
    remainingDownloads--;
    document.getElementById('remaining-downloads').textContent = remainingDownloads;

    // (Optional) Refresh from server to stay accurate:
    // await loadDownloadInfo();

  } catch (err) {
    console.error('Download error:', err);
    alert('Error downloading photo.');
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  document.getElementById('purchase-btn')?.addEventListener('click', purchaseSelectedPhotos);
});
