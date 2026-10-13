// 1. Find the elements on the page
const searchInput = document.getElementById("tool-search");
const cards = document.querySelectorAll(".tools-grid .card");
const chips = document.querySelectorAll(".chip");
const countBox = document.getElementById("tool-count");
const emptyBox = document.getElementById("no-results");

// 2. The category the user picked ("all" means show everything)
let activeCategory = "all";

// 3. Show only the cards that match the search and the category
function updateTools() {
  const words = searchInput.value.trim().toLowerCase().split(/\s+/).filter(function (word) {
    return word !== "";
  });
  let visible = 0;

  cards.forEach(function (card) {
    const text = (card.textContent + " " + card.dataset.keywords).toLowerCase();

    // every word the user typed must appear somewhere in the card
    const matchesText = words.every(function (word) {
      return text.includes(word);
    });

    const matchesCategory =
      activeCategory === "all" || card.dataset.category === activeCategory;

    const show = matchesText && matchesCategory;
    card.hidden = !show;
    if (show) {
      visible++;
    }
  });

  countBox.textContent = visible === 1 ? "1 tool" : visible + " tools";
  emptyBox.hidden = visible !== 0;
}

// 4. Update while the user types
searchInput.addEventListener("input", updateTools);

// 5. Category buttons
chips.forEach(function (chip) {
  chip.addEventListener("click", function () {
    activeCategory = chip.dataset.filter;

    chips.forEach(function (other) {
      const isActive = other === chip;
      other.classList.toggle("active", isActive);
      other.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    updateTools();
  });
});

// 6. Press "/" anywhere to jump to the search box
document.addEventListener("keydown", function (event) {
  const tag = document.activeElement ? document.activeElement.tagName : "";
  const isTyping = tag === "INPUT" || tag === "TEXTAREA";

  if (event.key === "/" && !isTyping) {
    event.preventDefault();
    searchInput.focus();
  }
});

// 7. Show the correct count when the page opens
updateTools();
