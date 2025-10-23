const userId = 4; // logged-in user
let selectedPhotos = new Set();
let remainingDownloads = 3; // optional: fetch dynamically if needed

// Load gallery
async function loadGallery() {
  try {
    const res = await fetch(`/api/photos/gallery/${userId}`);
    const photos = await res.json();

    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';

    if (!photos.length) {
      galleryGrid.innerHTML = '<p>No photos found.</p>';
      return;
    }

    photos.forEach(photo => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      card.style.border = '1px solid #ccc';
      card.style.padding = '10px';
      card.style.position = 'relative';

      // Image
      const img = document.createElement('img');
      img.src = photo.file_path;
      img.alt = 'Gallery Photo';
      img.style.width = '100%';
      img.style.height = '200px';
      img.style.objectFit = 'cover';
      img.className = 'selectable-photo';
      card.appendChild(img);

      // Checkbox for selection
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.position = 'absolute';
      checkbox.style.top = '10px';
      checkbox.style.left = '10px';
      checkbox.onclick = () => {
        if (checkbox.checked) {
          selectedPhotos.add(photo.id);
          card.style.border = '3px solid #CE6826';
        } else {
          selectedPhotos.delete(photo.id);
          card.style.border = '1px solid #ccc';
        }
      };
      card.appendChild(checkbox);

      // Status / action button
      const btn = document.createElement('button');
      btn.style.marginTop = '10px';
      btn.style.width = '100%';
      btn.style.padding = '10px';
      btn.style.borderRadius = '6px';
      btn.style.cursor = 'pointer';

      if (photo.status === 'available') {
        btn.textContent = `Buy $${photo.price}`;
        btn.style.backgroundColor = '#CE6826';
        btn.style.color = 'white';
        btn.onclick = () => purchasePhoto(photo.id);
      } else if (photo.status === 'purchased') {
        btn.textContent = 'Download';
        btn.style.backgroundColor = '#4CAF50';
        btn.style.color = 'white';
        btn.onclick = () => downloadPhoto(photo.id); // pass photo.id for API
      } else {
        btn.textContent = 'Expired';
        btn.disabled = true;
        btn.style.backgroundColor = '#ddd';
      }
      card.appendChild(btn);

      galleryGrid.appendChild(card);
    });

    // Update remaining downloads
    const remainingElem = document.getElementById('remaining-downloads');
    if (remainingElem) remainingElem.textContent = remainingDownloads;

  } catch (err) {
    console.error('Error loading gallery:', err);
  }
}

// Purchase single photo
async function purchasePhoto(photoId) {
  const photo = { photo_id: photoId, price: 100, method: 'card' }; // example
  try {
    const res = await fetch('/api/photo-purchases/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo)
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = data.checkout_url; // redirect to PayMongo checkout
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (err) {
    console.error('Purchase error:', err);
  }
}

// Purchase all selected photos
async function purchaseSelectedPhotos() {
  if (!selectedPhotos.size) {
    alert('Select at least one photo to purchase.');
    return;
  }

  const photoIds = Array.from(selectedPhotos);
  try {
    const res = await fetch('/api/photo-purchases/purchase-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, photo_ids: photoIds })
    });
    const data = await res.json();

    if (res.ok) {
      alert('Selected photos purchased!');
      selectedPhotos.clear();
      loadGallery();
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (err) {
    console.error('Bulk purchase error:', err);
  }
}

// Download photo
async function downloadPhoto(photoId) {
  if (remainingDownloads <= 0) {
    alert('No remaining downloads left!');
    return;
  }

  try {
    const res = await fetch(`/api/photo-purchases/download/${photoId}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'photo.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      remainingDownloads--;
      const remainingElem = document.getElementById('remaining-downloads');
      if (remainingElem) remainingElem.textContent = remainingDownloads;
    } else {
      const data = await res.json();
      alert(`Error downloading photo: ${data.message}`);
    }
  } catch (err) {
    console.error('Download error:', err);
  }
}

// Initialize gallery and bulk purchase button
document.addEventListener('DOMContentLoaded', () => {
  loadGallery();

  const purchaseBtn = document.getElementById('purchase-btn');
  if (purchaseBtn) {
    purchaseBtn.addEventListener('click', purchaseSelectedPhotos);
  }
});
