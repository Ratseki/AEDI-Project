// ===============================
// ✅ user_gallery.js (TOKEN AUTH FIXED)
// ===============================

const API_BASE = "http://localhost:3000";
const token = localStorage.getItem("token");

// --- Global Variables ---
let currentReviewBookingId = null;
let userId = null;
let selectedPhotos = new Set();
let remainingDownloads = 0;


// --- Elements ---
let galleryContent, bookingsContent, tabGallery, tabBookings, reviewModal, closeReviewModalBtn, submitReviewBtn, previewModal, modalCloseBtn;
let transactionsContent, tabTransactions;

// ===============================
// 1. Initialize Gallery
// ===============================
async function initGallery() {
  // 1. Check Token Existence
  if (!token) {
    alert("Please log in first.");
    window.location.href = '/login.html';
    return;
  }

  try {
    // 2. Verify Token with Backend (Auth Check)
    const res = await fetch('/api/auth/verify', { 
        headers: { "Authorization": `Bearer ${token}` } 
    });
    
    if (!res.ok) throw new Error('Not logged in');

    const data = await res.json();
    if (!data.valid) throw new Error('Invalid session');

    userId = data.user.id;

    // 3. Fetch Fresh Profile Data (Name & Pic)
    try {
        const profileRes = await fetch('/api/profile', {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (profileRes.ok) {
            const profileData = await profileRes.json();
            
            // Update Sidebar Name
            const sidebarName = document.getElementById("sidebar-username");
            if (sidebarName) sidebarName.textContent = profileData.name || "User";

            // Update Sidebar Picture (with timestamp to force refresh)
            const sidebarPic = document.getElementById("sidebar-profile-pic");
            if (sidebarPic && profileData.profile_pic) {
                sidebarPic.src = `${profileData.profile_pic}?t=${Date.now()}`;
            }
        }
    } catch (pErr) {
        console.error("Could not sync profile data:", pErr);
    }

    // 4. Load Content
    await loadDownloadInfo();
    await loadGallery();

    // 5. Set Date
    const dateElem = document.getElementById('gallery-date');
    if (dateElem) {
      dateElem.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
      });
    }

  } catch (err) {
    console.error('Gallery init error:', err);
    alert('Session expired. Please log in again.');
    localStorage.removeItem("token");
    window.location.href = '/login.html';
  }
}

async function loadDownloadInfo() {
  try {
    const res = await fetch('/api/photos/downloads', { 
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch downloads');

    const { remaining, total } = await res.json();
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
    const url = forUserId
      ? `/api/photos/gallery/customer/${forUserId}`
      : '/api/photos/gallery/user';

    const res = await fetch(url, { 
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load gallery');

    const data = await res.json();
    const photos = data.photos || data;
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';

    if (!photos.length) {
      galleryGrid.innerHTML = '<p>No photos found.</p>';
      return;
    }

    photos.forEach(photo => {
      const card = document.createElement('div');
      card.className = `photo-card ${photo.status === 'expired' ? 'expired' : ''}`;
      card.style.position = 'relative';

      const img = document.createElement('img');
      img.src = photo.preview_path;
      img.alt = photo.file_name || 'Gallery Photo';
      img.style.objectFit = 'cover';
      img.style.cursor = 'pointer'; 
      img.onclick = () => openPreviewModal(photo.preview_path);
      card.appendChild(img);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'photo-checkbox';
      checkbox.disabled = photo.status !== 'available';
      
      checkbox.onclick = (e) => {
        e.stopPropagation(); 
        if (checkbox.checked) selectedPhotos.add(photo.photo_id); 
        else selectedPhotos.delete(photo.photo_id);
        card.classList.toggle('selected', checkbox.checked);
      };
      card.appendChild(checkbox);

      const statusBadge = document.createElement('div');
      statusBadge.className = `status ${photo.status}`;
      statusBadge.textContent = photo.status ? (photo.status.charAt(0).toUpperCase() + photo.status.slice(1)) : 'N/A';
      card.appendChild(statusBadge);

      const btn = document.createElement('button');
      btn.style.width = '100%';
      btn.style.cursor = 'pointer';
      
      if (photo.status === 'available') {
        btn.textContent = `Buy ₱${photo.price}`;
        btn.style.backgroundColor = '#CE6826';
        btn.style.color = '#fff';
        
        btn.onclick = (e) => { 
          e.stopPropagation(); 
          btn.disabled = true;
          btn.textContent = "Processing...";
          purchasePhoto(photo.photo_id, photo.price, btn); 
        };

      } else if (photo.status === 'purchased') {
        btn.textContent = 'Download';
        btn.style.backgroundColor = '#4CAF50';
        btn.onclick = (e) => { e.stopPropagation(); downloadPhoto(photo.photo_id); };
      } else {
        btn.textContent = 'Expired';
        btn.disabled = true;
      }
      card.appendChild(btn);

      card.addEventListener('click', (e) => {
        if (!checkbox.disabled) {
          checkbox.click();
        }
      });
      
      img.addEventListener('click', (e) => e.stopPropagation());

      galleryGrid.appendChild(card);
    });
  } catch (err) {
    console.error('Load gallery error:', err);
    document.getElementById('gallery-grid').innerHTML = '<p style="color:red">Error loading gallery.</p>';
  }
}

function openPreviewModal(imageSrc) {
  if (previewModal) {
    document.getElementById('modal-image').src = imageSrc;
    previewModal.style.display = 'flex';
  }
}

function closePreviewModal() {
  if (previewModal) {
    previewModal.style.display = 'none';
    document.getElementById('modal-image').src = ""; 
  }
}

function getSelectedPaymentMethod() {
  const select = document.getElementById("payment-method-select");
  return select?.value || "card";
}

async function purchasePhoto(photoId, price, btnElement) {
  try {
    const method = getSelectedPaymentMethod();
    const res = await fetch('/api/photo-purchases/buy', {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ photo_id: photoId, method })
    });

    const data = await res.json();
    if (res.ok && data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      alert(data.message || 'Purchase failed');
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.textContent = `Buy ₱${price}`;
      }
    }
  } catch (err) {
    console.error('Purchase error:', err);
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = `Buy ₱${price}`;
    }
  }
}

async function purchaseSelectedPhotos() {
  const purchaseBtn = document.getElementById('purchase-btn');
  if (purchaseBtn.disabled) return; 

  if (!selectedPhotos.size) return alert('Select at least one photo.');

  purchaseBtn.disabled = true;
  purchaseBtn.textContent = "Processing...";

  const method = getSelectedPaymentMethod();
  const packageDownloadCount = 10; 

  try {
    const res = await fetch('/api/photo-purchases/purchase-bulk', {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ 
        photo_ids: Array.from(selectedPhotos), 
        method,
        package_downloads: packageDownloadCount 
      })
    });

    const data = await res.json();
    if (res.ok && data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      alert(data.message || 'Bulk purchase failed');
      purchaseBtn.disabled = false;
      purchaseBtn.textContent = "Purchase Photos";
    }
  } catch (err) {
    console.error('Bulk purchase error:', err);
    alert('Error processing bulk purchase');
    purchaseBtn.disabled = false;
    purchaseBtn.textContent = "Purchase Photos";
  }
}

async function downloadPhoto(photoId) {
  if (remainingDownloads <= 0) return alert('No remaining downloads left!');
  try {
    const res = await fetch(`/api/photos/download/${photoId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return alert(data.message || 'Download failed');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo_${photoId}.zip`; 
    document.body.appendChild(a);
    a.click();
    a.remove();
    await loadDownloadInfo(); 
  } catch (err) {
    console.error('Download error:', err);
    alert('Error downloading photo.');
  }
}

// ===================================
// BOOKING & REVIEW FUNCTIONS
// ===================================

function showGalleryTab() {
  if (galleryContent) galleryContent.style.display = 'block';
  if (bookingsContent) bookingsContent.style.display = 'none';
  if (transactionsContent) transactionsContent.style.display = 'none';
  if (tabGallery) tabGallery.classList.add('active');
  if (tabBookings) tabBookings.classList.remove('active');
  if (tabTransactions) tabTransactions.classList.remove('active');
}

function showBookingsTab() {
  if (galleryContent) galleryContent.style.display = 'none';
  if (bookingsContent) bookingsContent.style.display = 'block';
  if (transactionsContent) transactionsContent.style.display = 'none';
  if (tabGallery) tabGallery.classList.remove('active');
  if (tabBookings) tabBookings.classList.add('active');
  if (tabTransactions) tabTransactions.classList.remove('active');
  loadMyBookings();
}

function showTransactionsTab() {
  if (galleryContent) galleryContent.style.display = 'none';
  if (bookingsContent) bookingsContent.style.display = 'none';
  if (transactionsContent) transactionsContent.style.display = 'block';
  if (tabGallery) tabGallery.classList.remove('active');
  if (tabBookings) tabBookings.classList.remove('active');
  if (tabTransactions) tabTransactions.classList.add('active');
  loadMyTransactions();
}

async function loadMyBookings() {
  const tableBody = document.getElementById('bookings-table-body');
  const loadingText = document.getElementById('bookings-loading');
  if (loadingText) loadingText.style.display = 'block';
  
  try {
    const res = await fetch('/api/bookings', { 
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load bookings');
    
    const bookings = await res.json();
    if (tableBody) tableBody.innerHTML = ''; 
    
    if (!bookings.length) {
      if (loadingText) loadingText.textContent = 'No bookings found.';
      return;
    }

    bookings.forEach(booking => {
      const row = document.createElement('tr');
      let actionButton = '-';

      // ✅ NEW: Add Pay Button logic
      if (booking.status === 'pending' || booking.status === 'partial') {
          const price = parseFloat(booking.price || 0).toFixed(2);
          // Passes ID and Price to the payment function
          actionButton = `<button onclick="payForBooking(${booking.id}, ${price})" class="purchase-btn" style="background-color:#28a745; padding: 5px 10px; font-size: 0.9rem;">Pay ₱${price}</button>`;
      } 
      else if (booking.status === 'confirmed' || booking.status === 'paid') {
        actionButton = `<button onclick="openReviewModal(${booking.id})" class="purchase-btn" style="background-color:#007bff; padding: 5px 10px; font-size: 0.9rem;">Leave Review</button>`;
      }

      row.innerHTML = `
        <td>${booking.package_name || 'N/A'}</td>
        <td>${new Date(booking.date).toLocaleDateString()}</td>
        <td style="text-transform:capitalize">${booking.status}</td>
        <td>${actionButton}</td>
      `;
      if (tableBody) tableBody.appendChild(row);
    });
    if (loadingText) loadingText.style.display = 'none';
  } catch (err) {
    console.error('Load bookings error:', err);
    if (loadingText) loadingText.textContent = 'Error loading bookings.';
  }
}

async function loadMyTransactions() {
  const tableBody = document.getElementById('transactions-table-body');
  const loadingText = document.getElementById('transactions-loading');
  loadingText.style.display = 'block';

  try {
    const res = await fetch('/api/bookings/history/all', { 
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to load history');
    
    const history = await res.json();
    const transactions = history.transactions || [];
    tableBody.innerHTML = ''; 
    
    if (!transactions.length) {
      loadingText.textContent = 'No transactions found.';
      return;
    }

    transactions.forEach(tx => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(tx.created_at).toLocaleDateString()}</td>
        <td>${tx.type}</td>
        <td>₱${Number(tx.amount).toLocaleString()}</td>
        <td>${tx.status}</td>
        <td>${tx.reference_id}</td>
      `;
      tableBody.appendChild(row);
    });
    loadingText.style.display = 'none';
  } catch (err) {
    console.error('Load transactions error:', err);
    loadingText.textContent = 'Error loading transactions.';
  }
}

function openReviewModal(bookingId) {
  currentReviewBookingId = bookingId;
  if (reviewModal) reviewModal.style.display = 'flex';
}

function closeReviewModal() {
  if (reviewModal) reviewModal.style.display = 'none';
  currentReviewBookingId = null;
  document.getElementById('review-rating').value = '5';
  document.getElementById('review-comment').value = '';
}

async function submitReview() {
  const rating = document.getElementById('review-rating').value;
  const comment = document.getElementById('review-comment').value;
  if (!comment) return alert('Please write a comment for your review.');
  if (!currentReviewBookingId) return;

  try {
    const res = await fetch(`/api/bookings/${currentReviewBookingId}/review`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ rating, comment }) 
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit review');

    alert('✅ Review submitted! Thank you.');
    closeReviewModal();
    loadMyBookings(); 
  } catch (err) {
    console.error('Submit review error:', err);
    alert(`Error: ${err.message}`);
  }
}

// ===================================
// EVENT LISTENERS
// ===================================
document.addEventListener('DOMContentLoaded', () => {
  galleryContent = document.getElementById('gallery-grid')?.closest('.content');
  bookingsContent = document.getElementById('bookings-content');
  tabGallery = document.getElementById('tab-gallery');
  tabBookings = document.getElementById('tab-bookings');
  transactionsContent = document.getElementById('transactions-content');
  tabTransactions = document.getElementById('tab-transactions');

  reviewModal = document.getElementById('review-modal');
  closeReviewModalBtn = document.getElementById('close-review-modal');
  submitReviewBtn = document.getElementById('submit-review-btn');
  previewModal = document.getElementById('preview-modal');
  modalCloseBtn = document.getElementById('modal-close-btn');

  initGallery();
  
  document.getElementById('purchase-btn')?.addEventListener('click', purchaseSelectedPhotos);
  
  modalCloseBtn?.addEventListener('click', closePreviewModal);
  previewModal?.addEventListener('click', (e) => {
    if (e.target.id === 'preview-modal') closePreviewModal();
  });

  tabGallery?.addEventListener('click', (e) => {
    e.preventDefault();
    showGalleryTab();
  });
  tabBookings?.addEventListener('click', (e) => {
    e.preventDefault();
    showBookingsTab();
  });
  tabTransactions?.addEventListener('click', (e) => {
    e.preventDefault();
    showTransactionsTab();
  });

  submitReviewBtn?.addEventListener('click', submitReview);
  closeReviewModalBtn?.addEventListener('click', closeReviewModal);
  reviewModal?.addEventListener('click', (e) => {
    if (e.target.id === 'review-modal') closeReviewModal();
  });
  
  const reviewComment = document.getElementById('review-comment');
  const charCounter = document.getElementById('char-counter');
  if (reviewComment && charCounter) {
    reviewComment.addEventListener('input', () => {
      const count = reviewComment.value.length;
      charCounter.textContent = `${count} / 500`;
    });
  }
});

// ✅ NEW: Function to handle booking payments
async function payForBooking(bookingId, amount) {
    if(!confirm(`Proceed to pay ₱${amount} for Booking #${bookingId}?`)) return;

    try {
      // Calls the route that creates the PayMongo link
      const res = await fetch(`${API_BASE}/api/payments/create-checkout-session`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount, booking_id: bookingId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment session failed.");
      
      // Redirect to PayMongo
      window.location.href = data.checkout_url;
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
}

// Make it global so the HTML onclick="" can find it
window.payForBooking = payForBooking;