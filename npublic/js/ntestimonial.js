const tTrack = document.querySelector('.ntestimonial-track');
const tBoxes = document.querySelectorAll('.ntestimonial-box');
const tPrev = document.querySelector('.ntestimonial-arrow.left');
const tNext = document.querySelector('.ntestimonial-arrow.right');
const tDots = document.querySelectorAll('.ntestimonial-dots .ndot');

let tIndex = 0;

function updateTestimonial() {
  tBoxes.forEach((box, i) => {
    box.classList.toggle('active', i === tIndex);
  });
  
  tDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === tIndex);
  });

  tTrack.style.transform = `translateX(-${tIndex * 100}%)`;
}

tNext.addEventListener('click', () => {
  tIndex = (tIndex + 1) % tBoxes.length;
  updateTestimonial();
});

tPrev.addEventListener('click', () => {
  tIndex = (tIndex - 1 + tBoxes.length) % tBoxes.length;
  updateTestimonial();
});

tDots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    tIndex = i;
    updateTestimonial();
  });
});

// init
updateTestimonial();

setInterval(() => {
  tIndex = (tIndex + 1) % tBoxes.length;
  updateTestimonial();
}, 5000);

const accordions = document.querySelectorAll(".accordion-item");

accordions.forEach(item => {
  const header = item.querySelector(".accordion-header");
  const body = item.querySelector(".accordion-body");
  const symbol = header.querySelector(".accordion-symbol");

  header.addEventListener("click", () => {
    if (item.classList.contains("active")) {
      // Collapse
      body.style.maxHeight = "0";
      item.classList.remove("active");
      header.classList.remove("active");
      symbol.textContent = "+"; // change back to plus
    } else {
      // Expand
      body.style.maxHeight = body.scrollHeight + "px";
      item.classList.add("active");
      header.classList.add("active");
      symbol.textContent = "−"; // change to minus
    }
  });
});
