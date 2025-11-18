// ===============================
// ✅ user_gallery.js (FINAL VERSION)
// ===============================

// --- Declare variables (but don't assign them yet) ---
let currentReviewBookingId = null;
let userId = null;
let selectedPhotos = new Set();
let remainingDownloads = 0;

// --- Declare element variables ---
let galleryContent, bookingsContent, tabGallery, tabBookings, reviewModal, closeReviewModalBtn, submitReviewBtn, previewModal, modalCloseBtn;

// ✅ ADDED: Variables for the new Transactions Tab
let transactionsContent, tabTransactions;


// Initialize gallery
async function initGallery() {
  try {
    const res = await fetch('/api/auth/verify', { credentials: 'include' });
    if (!res.ok) throw new Error('Not logged in');

    const data = await res.json();
    if (!data.valid) throw new Error('Invalid session');

    userId = data.user.id;
    
    // ✅ FIX: Update Name AND Profile Picture in Sidebar
    const sidebarName = document.querySelector(".sidebar h3");
    const sidebarPic = document.getElementById("sidebar-profile-pic");

    if (sidebarName) sidebarName.textContent = data.user.name || "User";
    
    // Add a timestamp to force refresh the image (prevent caching)
    if (sidebarPic && data.user.profile_pic) {
        sidebarPic.src = `${data.user.profile_pic}?t=${new Date().getTime()}`;
    }

    await loadDownloadInfo();
    await loadGallery();

    const dateElem = document.getElementById('gallery-date');
    if (dateElem) {
      dateElem.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
      });
    }

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
    remainingDownloads = remaining;

    document.getElementById('remaining-downloads').textContent = remaining;
    document.getElementById('total-downloads').textContent = total;
  } catch (err) {
    console.error('Download info error:', err);
  }
}

async function loadGallery(forUserId = null) {
  try {
    const url = forUserId
      ? `/api/photos/gallery/customer/${forUserId}`
      : '/api/photos/gallery/user';

    const res = await fetch(url, { credentials: 'include' });
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
        
        // ✅ FIX: Disable button on click and pass it to the handler
        btn.onclick = (e) => { 
          e.stopPropagation(); 
          btn.disabled = true;
          btn.textContent = "Processing...";
          // Pass the button element so it can be re-enabled on failure
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
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ photo_id: photoId, method })
    });

    const data = await res.json();
    if (res.ok && data.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      alert(data.message || 'Purchase failed');
      // ✅ FIX: Re-enable the button if the API call fails
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.textContent = `Buy ₱${price}`;
      }
    }
  } catch (err) {
    console.error('Purchase error:', err);
    // ✅ FIX: Re-enable the button if the fetch fails
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.textContent = `Buy ₱${price}`;
    }
  }
}

async function purchaseSelectedPhotos() {
  const purchaseBtn = document.getElementById('purchase-btn');
  // Prevent double-clicks
  if (purchaseBtn.disabled) return; 

  if (!selectedPhotos.size) return alert('Select at least one photo.');

  // ✅ FIX: Disable button on click
  purchaseBtn.disabled = true;
  purchaseBtn.textContent = "Processing...";

  const method = getSelectedPaymentMethod();
  const packageDownloadCount = 10; 

  try {
    const res = await fetch('/api/photo-purchases/purchase-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
      // ✅ FIX: Re-enable button on failure
      purchaseBtn.disabled = false;
      purchaseBtn.textContent = "Purchase Photos";
    }
  } catch (err) {
    console.error('Bulk purchase error:', err);
    alert('Error processing bulk purchase');
    // ✅ FIX: Re-enable button on failure
    purchaseBtn.disabled = false;
    purchaseBtn.textContent = "Purchase Photos";
  }
}

async function downloadPhoto(photoId) {
  if (remainingDownloads <= 0) return alert('No remaining downloads left!');
  try {
    const res = await fetch(`/api/photos/download/${photoId}`, {
      credentials: 'include'
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
    remainingDownloads--;
    document.getElementById('remaining-downloads').textContent = remainingDownloads;
  } catch (err) {
    console.error('Download error:', err);
    alert('Error downloading photo.');
  }
}

// ===================================
// NEW BOOKING & REVIEW FUNCTIONS
// ===================================

// --- Tab Switching Logic ---
function showGalleryTab() {
  if (galleryContent) galleryContent.style.display = 'block';
  if (bookingsContent) bookingsContent.style.display = 'none';
  // ✅ ADDED: Hide Transactions
  if (transactionsContent) transactionsContent.style.display = 'none';
  if (tabGallery) tabGallery.classList.add('active');
  if (tabBookings) tabBookings.classList.remove('active');
  // ✅ ADDED: Deactivate Transactions
  if (tabTransactions) tabTransactions.classList.remove('active');
}

function showBookingsTab() {
  if (galleryContent) galleryContent.style.display = 'none';
  if (bookingsContent) bookingsContent.style.display = 'block';
  // ✅ ADDED: Hide Transactions
  if (transactionsContent) transactionsContent.style.display = 'none';
  if (tabGallery) tabGallery.classList.remove('active');
  if (tabBookings) tabBookings.classList.add('active');
  // ✅ ADDED: Deactivate Transactions
  if (tabTransactions) tabTransactions.classList.remove('active');
  loadMyBookings();
}

// ✅ NEW: Function to show the transactions tab
function showTransactionsTab() {
  if (galleryContent) galleryContent.style.display = 'none';
  if (bookingsContent) bookingsContent.style.display = 'none';
  if (transactionsContent) transactionsContent.style.display = 'block';
  if (tabGallery) tabGallery.classList.remove('active');
  if (tabBookings) tabBookings.classList.remove('active');
  if (tabTransactions) tabTransactions.classList.add('active');
  loadMyTransactions();
}

// --- Load User's Bookings ---
async function loadMyBookings() {
  const tableBody = document.getElementById('bookings-table-body');
  const loadingText = document.getElementById('bookings-loading');

  if (loadingText) loadingText.style.display = 'block';

  try {
    const res = await fetch('/api/bookings', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load bookings');

    const bookings = await res.json();
    tableBody.innerHTML = '';

    if (!bookings.length) {
      if (loadingText) loadingText.textContent = 'No bookings found.';
      return;
    }

    bookings.forEach(booking => {
      const row = document.createElement('tr');
      let actionButton = '';
      if (booking.status === 'confirmed' || booking.status === 'paid') {
        actionButton = `<button onclick="openReviewModal(${booking.id})" class="purchase-btn" style="background-color:#007bff;">Leave Review</button>`;
      } else {
        actionButton = '<span>-</span>';
      }
      row.innerHTML = `
        <td>${booking.package_name || 'N/A'}</td>
        <td>${new Date(booking.date).toLocaleDateString()}</td>
        <td>${booking.status}</td>
        <td>${actionButton}</td>
      `;
      tableBody.appendChild(row);
    });

    if (loadingText) loadingText.style.display = 'none';

  } catch (err) {
    console.error('Load bookings error:', err);
    if (loadingText) loadingText.textContent = 'Error loading bookings.';
  }
}

// ✅ NEW: Function to load user's transactions
async function loadMyTransactions() {
  const tableBody = document.getElementById('transactions-table-body');
  const loadingText = document.getElementById('transactions-loading');
  loadingText.style.display = 'block';

  try {
    // This route returns { bookings: [], transactions: [] }
    const res = await fetch('/api/bookings/history/all', { credentials: 'include' });
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

// --- Review Modal Functions ---
function openReviewModal(bookingId) {
  currentReviewBookingId = bookingId;
  if (reviewModal) {
    reviewModal.style.display = 'flex';
  } else {
    console.error('reviewModal is null');
  }
}

function closeReviewModal() {
  if (reviewModal) {
    reviewModal.style.display = 'none';
  }
  currentReviewBookingId = null;
  document.getElementById('review-rating').value = '5';
  document.getElementById('review-comment').value = '';
}

async function submitReview() {
  const rating = document.getElementById('review-rating').value;
  const comment = document.getElementById('review-comment').value;

  if (!comment) {
    alert('Please write a comment for your review.');
    return;
  }
  if (!currentReviewBookingId) return;

  try {
    const res = await fetch(`/api/bookings/${currentReviewBookingId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
// EVENT LISTENERS (UPDATED)
// ===================================
document.addEventListener('DOMContentLoaded', () => {

  // ✅ FIX: Assign all elements *after* the DOM is loaded
  galleryContent = document.getElementById('gallery-grid')?.closest('.content');
  bookingsContent = document.getElementById('bookings-content');
  tabGallery = document.getElementById('tab-gallery');
  tabBookings = document.getElementById('tab-bookings');
  // ✅ ADDED: Assign Transactions Tab
  transactionsContent = document.getElementById('transactions-content');
  tabTransactions = document.getElementById('tab-transactions');

  reviewModal = document.getElementById('review-modal');
  closeReviewModalBtn = document.getElementById('close-review-modal');
  submitReviewBtn = document.getElementById('submit-review-btn');
  previewModal = document.getElementById('preview-modal');
  modalCloseBtn = document.getElementById('modal-close-btn');

  // Initial page load
  initGallery();

  // --- Main gallery buttons ---
  document.getElementById('purchase-btn')?.addEventListener('click', purchaseSelectedPhotos);

  // --- Image preview modal ---
  modalCloseBtn?.addEventListener('click', closePreviewModal);
  previewModal?.addEventListener('click', (e) => {
    if (e.target.id === 'preview-modal') {
      closePreviewModal();
    }
  });

  // --- NEW Tab switching ---
  tabGallery?.addEventListener('click', (e) => {
    e.preventDefault();
    showGalleryTab();
  });
  tabBookings?.addEventListener('click', (e) => {
    e.preventDefault();
    showBookingsTab();
  });

  // ✅ ADDED: Event listener for Transactions Tab
  tabTransactions?.addEventListener('click', (e) => {
    e.preventDefault();
    showTransactionsTab();
  });

  // --- NEW Review modal buttons ---
  submitReviewBtn?.addEventListener('click', submitReview);
  closeReviewModalBtn?.addEventListener('click', closeReviewModal);
  reviewModal?.addEventListener('click', (e) => {
    if (e.target.id === 'review-modal') {
      closeReviewModal();
    }
  });

  // ✅ NEW: Character counter logic
  const reviewComment = document.getElementById('review-comment');
  const charCounter = document.getElementById('char-counter');
  if (reviewComment && charCounter) {
    reviewComment.addEventListener('input', () => {
      const count = reviewComment.value.length;
      charCounter.textContent = `${count} / 500`;
    });
  }
});