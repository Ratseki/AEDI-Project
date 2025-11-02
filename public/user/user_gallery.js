let userId = null;
let selectedPhotos = new Set();
let remainingDownloads = 0;

// Initialize gallery
async function initGallery() {
  try {
    // Verify logged-in user
    const res = await fetch('/api/auth/verify', { credentials: 'include' });
    if (!res.ok) throw new Error('Not logged in');

    const data = await res.json();
    if (!data.valid) throw new Error('Invalid session');

    userId = data.user.id;

    // Set sidebar username
    document.querySelector(".sidebar h3").textContent = data.user.name || "User";

    // Load remaining downloads
    await loadDownloadInfo();

    // Load gallery photos
    await loadGallery();

    // Set gallery date
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

// Fetch download info
async function loadDownloadInfo() {
  try {
    const res = await fetch('/api/gallery/downloads', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch downloads');

    const { remaining, total } = await res.json();
    remainingDownloads = remaining;

    document.getElementById('remaining-downloads').textContent = remaining;
    document.getElementById('total-downloads').textContent = total;
  } catch (err) {
    console.error('Download info error:', err);
  }
}

// Load gallery photos (Production Ready)
// Load gallery photos (live/update-ready)
async function loadGallery(userId = null) {
  try {
    // Append user_id if provided (for admin/staff selecting a customer)
    const url = userId ? `/api/gallery/gallery?user_id=${userId}` : '/api/gallery/gallery';
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load gallery');

    const data = await res.json();
    const photos = data.photos || [];
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';

    if (!photos.length) {
      galleryGrid.innerHTML = '<p>No photos found.</p>';
      return;
    }

    photos.forEach(photo => {
      const card = document.createElement('div');
      card.className = `photo-card ${photo.status === 'expired' ? 'expired' : ''}`;

      // Image
      const img = document.createElement('img');
      img.src = photo.file_path;
      img.alt = photo.file_name || 'Gallery Photo';
      img.style.objectFit = 'cover';
      card.appendChild(img);

      // Status badge
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = photo.status.charAt(0).toUpperCase() + photo.status.slice(1);
      card.appendChild(badge);

      // Checkbox for bulk purchase
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.disabled = photo.status !== 'available';
      checkbox.onclick = () => {
        if (checkbox.checked) selectedPhotos.add(photo.id);
        else selectedPhotos.delete(photo.id);
        card.classList.toggle('selected', checkbox.checked);
      };
      card.appendChild(checkbox);

      // Action button
      const btn = document.createElement('button');
      btn.style.width = '100%';
      btn.style.padding = '10px';
      btn.style.borderRadius = '6px';
      btn.style.cursor = 'pointer';

      if (photo.status === 'available') {
        btn.textContent = `Buy ₱${photo.price}`;
        btn.style.backgroundColor = '#CE6826';
        btn.style.color = '#fff';
        btn.onclick = () => purchasePhoto(photo.id);
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
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '<p style="color:red">Error loading gallery.</p>';
  }
}



// Purchase a single photo
async function purchasePhoto(photoId) {
  try {
    const res = await fetch('/api/photo-purchases/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ photo_id: photoId, method: 'card' })
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

// Purchase multiple selected photos
async function purchaseSelectedPhotos() {
  if (!selectedPhotos.size) return alert('Select at least one photo.');

  try {
    const res = await fetch('/api/photo-purchases/purchase-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_id: userId, photo_ids: Array.from(selectedPhotos) })
    });

    const data = await res.json();
    if (res.ok) {
      selectedPhotos.clear();
      await loadGallery();
      await loadDownloadInfo();
      alert('Photos purchased successfully!');
    } else {
      alert(data.message || 'Bulk purchase failed');
    }
  } catch (err) {
    console.error('Bulk purchase error:', err);
  }
}

// Download a photo
async function downloadPhoto(photoId) {
  if (remainingDownloads <= 0) return alert('No remaining downloads left!');

  try {
    const res = await fetch(`/api/photo-purchases/download/${photoId}`, { credentials: 'include' });
    if (!res.ok) {
      const data = await res.json();
      return alert(data.message || 'Download failed');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photo.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();

    remainingDownloads--;
    document.getElementById('remaining-downloads').textContent = remainingDownloads;
  } catch (err) {
    console.error('Download error:', err);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  document.getElementById('purchase-btn')?.addEventListener('click', purchaseSelectedPhotos);
});
