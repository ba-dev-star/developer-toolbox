// 1. Find the elements on the page
const input = document.getElementById("number-input");
const baseSelect = document.getElementById("from-base");
const outBinary = document.getElementById("out-binary");
const outGrouped = document.getElementById("out-grouped");
const outOctal = document.getElementById("out-octal");
const outDecimal = document.getElementById("out-decimal");
const outHex = document.getElementById("out-hex");
const outBase36 = document.getElementById("out-base36");
const outBits = document.getElementById("out-bits");

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
const MAX_LENGTH = 5000;

// 2. Turn the text into a big number (BigInt can be any size)
function parseNumber(text, base) {
  let clean = text.trim().replace(/[\s_,]/g, "");

  let negative = false;
  if (clean.startsWith("-")) {
    negative = true;
    clean = clean.slice(1);
  } else if (clean.startsWith("+")) {
    clean = clean.slice(1);
  }

  // prefixes like 0x, 0b and 0o
  const prefix = clean.slice(0, 2).toLowerCase();
  const prefixBases = { "0x": 16, "0b": 2, "0o": 8 };
  if (base === "auto") {
    if (prefixBases[prefix]) {
      base = prefixBases[prefix];
      clean = clean.slice(2);
    } else {
      base = 10;
    }
  } else {
    base = Number(base);
    if (prefixBases[prefix] === base) {
      clean = clean.slice(2);
    }
  }

  if (clean === "") {
    throw new Error("Enter a number first.");
  }
  if (clean.length > MAX_LENGTH) {
    throw new Error("This number is too long (the limit is " + MAX_LENGTH + " digits).");
  }

  let value = 0n;
  const bigBase = BigInt(base);
  for (const character of clean.toLowerCase()) {
    const digit = DIGITS.indexOf(character);
    if (digit === -1 || digit >= base) {
      throw new Error("The character '" + character + "' is not a valid digit in base " + base + ".");
    }
    value = value * bigBase + BigInt(digit);
  }

  return negative ? -value : value;
}

// 3. Binary text in groups of 4 digits: 1111 0000
function groupBinary(binary) {
  const sign = binary.startsWith("-") ? "-" : "";
  let digits = sign ? binary.slice(1) : binary;
  while (digits.length % 4 !== 0) {
    digits = "0" + digits;
  }
  return sign + digits.match(/.{4}/g).join(" ");
}

// 4. Clear all results
function clearResults() {
  for (const box of [outBinary, outGrouped, outOctal, outDecimal, outHex, outBase36, outBits]) {
    box.textContent = "";
  }
}

// 5. Convert and show
function convert() {
  if (input.value.trim() === "") {
    clearResults();
    hideStatus();
    return;
  }

  let value;
  try {
    value = parseNumber(input.value, baseSelect.value);
  } catch (error) {
    clearResults();
    showStatus(error.message, "error");
    return;
  }

  hideStatus();
  const absolute = value < 0n ? -value : value;
  const binary = value.toString(2);

  outBinary.textContent = binary;
  outGrouped.textContent = groupBinary(binary);
  outOctal.textContent = value.toString(8);
  outDecimal.textContent = value.toString(10);
  outHex.textContent = value.toString(16);
  outBase36.textContent = value.toString(36);
  outBits.textContent = absolute === 0n ? "1" : String(absolute.toString(2).length);
}

// 6. Connect everything
input.addEventListener("input", convert);
baseSelect.addEventListener("change", convert);

document.getElementById("btn-example").addEventListener("click", function () {
  baseSelect.value = "auto";
  input.value = "0xFF";
  convert();
});

document.getElementById("btn-clear").addEventListener("click", function () {
  input.value = "";
  convert();
  input.focus();
});

enableCopyButtons();
convert();
