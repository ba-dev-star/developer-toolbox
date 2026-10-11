// 1. Find the elements on the page
const passwordBox = document.getElementById("password");
const strengthBox = document.getElementById("strength");
const statusBox = document.getElementById("status");
const lengthInput = document.getElementById("length");
const lengthValue = document.getElementById("length-value");
const optUpper = document.getElementById("opt-upper");
const optLower = document.getElementById("opt-lower");
const optNumbers = document.getElementById("opt-numbers");
const optSymbols = document.getElementById("opt-symbols");

// 2. The characters we can use
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

// 3. Show a message (type is "success" or "error")
function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = "status " + type;
}

function hideStatus() {
  statusBox.textContent = "";
  statusBox.className = "status";
}

// 4. Secure random number from 0 to max - 1
function randomInt(max) {
  const limit = Math.floor(4294967296 / max) * max;
  const array = new Uint32Array(1);
  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);
  return array[0] % max;
}

// 5. Pick one random character from a text
function pickChar(text) {
  return text.charAt(randomInt(text.length));
}

// 6. Show how strong the password is
function showStrength(length, poolSize) {
  const bits = Math.round(length * Math.log2(poolSize));
  let label = "Weak";
  if (bits >= 80) {
    label = "Very strong";
  } else if (bits >= 60) {
    label = "Strong";
  } else if (bits >= 40) {
    label = "Medium";
  }
  strengthBox.textContent = "Strength: " + label + " (about " + bits + " bits)";
}

// 7. Generate the password
function generatePassword() {
  const sets = [];
  if (optUpper.checked) sets.push(UPPER);
  if (optLower.checked) sets.push(LOWER);
  if (optNumbers.checked) sets.push(NUMBERS);
  if (optSymbols.checked) sets.push(SYMBOLS);

  if (sets.length === 0) {
    passwordBox.value = "";
    strengthBox.textContent = "";
    showStatus("Select at least one character type.", "error");
    return;
  }

  hideStatus();

  const length = Number(lengthInput.value);
  const allChars = sets.join("");
  const chars = [];

  // one character from each selected type, so every type appears
  for (const set of sets) {
    chars.push(pickChar(set));
  }

  // fill the rest with random characters
  while (chars.length < length) {
    chars.push(pickChar(allChars));
  }

  // shuffle so the first characters are not predictable
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }

  passwordBox.value = chars.join("");
  showStrength(length, allChars.length);
}

// 8. Copy the password
async function copyPassword() {
  if (passwordBox.value === "") {
    showStatus("Nothing to copy yet.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(passwordBox.value);
    showStatus("Copied to clipboard.", "success");
  } catch (error) {
    passwordBox.select();
    document.execCommand("copy");
    showStatus("Copied to clipboard.", "success");
  }
}

// 9. Connect everything
lengthInput.addEventListener("input", function () {
  lengthValue.textContent = lengthInput.value;
  generatePassword();
});

optUpper.addEventListener("change", generatePassword);
optLower.addEventListener("change", generatePassword);
optNumbers.addEventListener("change", generatePassword);
optSymbols.addEventListener("change", generatePassword);

document.getElementById("btn-generate").addEventListener("click", generatePassword);
document.getElementById("btn-copy").addEventListener("click", copyPassword);

// 10. Make a password as soon as the page opens
generatePassword();
