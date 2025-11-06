document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("publicGallery");

  try {
    // ✅ Adjust to match your actual route
    const res = await fetch("/api/photos/gallery");
    const data = await res.json();

    if (!data.success || !data.photos?.length) {
      container.innerHTML = "<p>No public photos available at the moment.</p>";
      return;
    }

    // ✅ Render gallery
    container.innerHTML = data.photos
      .map(
        (p) => `
        <div class="photo-card" data-category="${p.category || 'uncategorized'}">
          <img src="${p.file_path}" alt="${p.file_name}" loading="lazy" />
          <p>${p.file_name}</p>
          <small>₱${p.price || "N/A"}</small>
        </div>
      `
      )
      .join("");

    // ✅ Filter functionality
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = btn.getAttribute("data-category");
        const allPhotos = document.querySelectorAll(".photo-card");

        document.querySelectorAll(".filter-btn").forEach((b) =>
          b.classList.remove("bg-blue-500", "text-white")
        );
        btn.classList.add("bg-blue-500", "text-white");

        allPhotos.forEach((photo) => {
          const matches =
            category === "all" ||
            (photo.dataset.category &&
              photo.dataset.category.toLowerCase() === category.toLowerCase());
          photo.style.display = matches ? "block" : "none";
        });
      });
    });
  } catch (err) {
    console.error("❌ Error loading public gallery:", err);
    container.innerHTML = "<p>Failed to load gallery.</p>";
  }
});
