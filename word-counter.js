// 1. Find the elements on the page
const textInput = document.getElementById("text-input");
const wordsBox = document.getElementById("stat-words");
const charsBox = document.getElementById("stat-chars");
const charsNoSpacesBox = document.getElementById("stat-chars-no-spaces");
const linesBox = document.getElementById("stat-lines");
const paragraphsBox = document.getElementById("stat-paragraphs");
const readingBox = document.getElementById("stat-reading");

// 2. Count everything and show the numbers
function updateStats() {
  const text = textInput.value;
  const trimmed = text.trim();

  const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  const chars = Array.from(text).length;
  const charsNoSpaces = Array.from(text.replace(/\s/g, "")).length;
  const lines = text === "" ? 0 : text.split(/\r\n|\r|\n/).length;
  const paragraphs = text.split(/\n\s*\n/).filter(function (part) {
    return part.trim() !== "";
  }).length;

  // average reading speed: about 200 words per minute
  const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));

  wordsBox.textContent = words;
  charsBox.textContent = chars;
  charsNoSpacesBox.textContent = charsNoSpaces;
  linesBox.textContent = lines;
  paragraphsBox.textContent = paragraphs;
  readingBox.textContent = minutes + " min";
}

// 3. Update while the user types
textInput.addEventListener("input", updateStats);

// 4. Clear button
document.getElementById("btn-clear").addEventListener("click", function () {
  textInput.value = "";
  updateStats();
  textInput.focus();
});

// 5. Show zeros when the page opens
updateStats();
