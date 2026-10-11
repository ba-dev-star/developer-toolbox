// 1. Find the elements on the page
const input = document.getElementById("b64-input");
const output = document.getElementById("b64-output");
const statusBox = document.getElementById("status");

// 2. Show a message (type is "success" or "error")
function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = "status " + type;
}

// 3. Text to Base64 (works with Arabic and emoji too)
function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

// 4. Base64 to text
function decodeBase64(text) {
  let clean = text.replace(/\s/g, "");

  // accept the URL-safe version too
  clean = clean.replace(/-/g, "+").replace(/_/g, "/");

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 === 1) {
    throw new Error("This is not valid Base64.");
  }

  // add missing "=" at the end if needed
  while (clean.length % 4 !== 0) {
    clean += "=";
  }

  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    throw new Error("The result is not readable text (it may be a file or image).");
  }
}

// 5. The buttons
function encode() {
  if (input.value === "") {
    showStatus("Type or paste some text first.", "error");
    return;
  }
  output.value = encodeBase64(input.value);
  showStatus("Encoded successfully.", "success");
}

function decode() {
  if (input.value.trim() === "") {
    showStatus("Type or paste some Base64 first.", "error");
    return;
  }
  try {
    output.value = decodeBase64(input.value);
    showStatus("Decoded successfully.", "success");
  } catch (error) {
    output.value = "";
    showStatus(error.message, "error");
  }
}

function swapValues() {
  const temp = input.value;
  input.value = output.value;
  output.value = temp;
  showStatus("Swapped. The result is now the input.", "success");
}

async function copyOutput() {
  if (output.value === "") {
    showStatus("Nothing to copy yet.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(output.value);
    showStatus("Copied to clipboard.", "success");
  } catch (error) {
    output.select();
    document.execCommand("copy");
    showStatus("Copied to clipboard.", "success");
  }
}

function clearAll() {
  input.value = "";
  output.value = "";
  statusBox.textContent = "";
  statusBox.className = "status";
}

// 6. Connect the buttons
document.getElementById("btn-encode").addEventListener("click", encode);
document.getElementById("btn-decode").addEventListener("click", decode);
document.getElementById("btn-swap").addEventListener("click", swapValues);
document.getElementById("btn-copy").addEventListener("click", copyOutput);
document.getElementById("btn-clear").addEventListener("click", clearAll);
