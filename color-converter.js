// 1. Find the elements on the page
const hexInput = document.getElementById("hex");
const rInput = document.getElementById("r");
const gInput = document.getElementById("g");
const bInput = document.getElementById("b");
const picker = document.getElementById("picker");
const swatch = document.getElementById("swatch");
const statusBox = document.getElementById("status");

// 2. Show a message (type is "success" or "error")
function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = "status " + type;
}

function hideStatus() {
  statusBox.textContent = "";
  statusBox.className = "status";
}

// 3. Read a HEX text like "#4F46E5" or "4AF" and return the numbers
function parseHex(text) {
  let hex = text.trim().replace(/^#/, "");

  // short form: "4AF" becomes "44AAFF"
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return null;
  }

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

// 4. Turn three numbers into a HEX text
function toHex(r, g, b) {
  let hex = "#";
  for (const n of [r, g, b]) {
    hex += n.toString(16).padStart(2, "0");
  }
  return hex.toUpperCase();
}

// 5. Read the three RGB boxes (returns null if something is wrong)
function readRgb() {
  const values = [rInput.value, gInput.value, bInput.value];
  const numbers = [];

  for (const value of values) {
    const n = Number(value);
    if (value.trim() === "" || !Number.isInteger(n) || n < 0 || n > 255) {
      return null;
    }
    numbers.push(n);
  }

  return { r: numbers[0], g: numbers[1], b: numbers[2] };
}

// 6. Update the preview box and the color picker
function updateSwatch(hex) {
  swatch.style.background = hex;
  picker.value = hex.toLowerCase();
}

// 7. When the user types a HEX color
hexInput.addEventListener("input", function () {
  const color = parseHex(hexInput.value);
  if (color === null) {
    showStatus("Enter a valid HEX color, like #4F46E5 or #4AF.", "error");
    return;
  }
  hideStatus();
  rInput.value = color.r;
  gInput.value = color.g;
  bInput.value = color.b;
  updateSwatch(toHex(color.r, color.g, color.b));
});

// 8. When the user types RGB numbers
function onRgbInput() {
  const color = readRgb();
  if (color === null) {
    showStatus("RGB values must be whole numbers from 0 to 255.", "error");
    return;
  }
  hideStatus();
  const hex = toHex(color.r, color.g, color.b);
  hexInput.value = hex;
  updateSwatch(hex);
}

rInput.addEventListener("input", onRgbInput);
gInput.addEventListener("input", onRgbInput);
bInput.addEventListener("input", onRgbInput);

// 9. When the user picks a color from the color picker
picker.addEventListener("input", function () {
  const color = parseHex(picker.value);
  if (color === null) {
    return;
  }
  hideStatus();
  const hex = toHex(color.r, color.g, color.b);
  hexInput.value = hex;
  rInput.value = color.r;
  gInput.value = color.g;
  bInput.value = color.b;
  swatch.style.background = hex;
});

// 10. Copy helpers
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showStatus("Copied: " + text, "success");
  } catch (error) {
    showStatus("Copy failed. Select the text and press Command + C.", "error");
  }
}

document.getElementById("btn-copy-hex").addEventListener("click", function () {
  const color = readRgb();
  if (color === null) {
    showStatus("Fix the color first, then copy.", "error");
    return;
  }
  copyText(toHex(color.r, color.g, color.b));
});

document.getElementById("btn-copy-rgb").addEventListener("click", function () {
  const color = readRgb();
  if (color === null) {
    showStatus("Fix the color first, then copy.", "error");
    return;
  }
  copyText("rgb(" + color.r + ", " + color.g + ", " + color.b + ")");
});
