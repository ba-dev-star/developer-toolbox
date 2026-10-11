// 1. Find the elements on the page
const output = document.getElementById("uuid-output");
const statusBox = document.getElementById("status");
const countInput = document.getElementById("count");
const optUpper = document.getElementById("opt-upper");
const optNoHyphens = document.getElementById("opt-no-hyphens");

// 2. Show a message (type is "success" or "error")
function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = "status " + type;
}

// 3. Create one UUID version 4
function createUuid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // these two lines mark the id as "version 4"
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // turn the bytes into text like "3f"
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }

  return (
    hex.slice(0, 8) + "-" +
    hex.slice(8, 12) + "-" +
    hex.slice(12, 16) + "-" +
    hex.slice(16, 20) + "-" +
    hex.slice(20)
  );
}

// 4. Create the list the user asked for
function generateUuids() {
  const count = Number(countInput.value);

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    showStatus("Enter a whole number between 1 and 100.", "error");
    return;
  }

  const list = [];
  for (let i = 0; i < count; i++) {
    let id = createUuid();
    if (optNoHyphens.checked) {
      id = id.replace(/-/g, "");
    }
    if (optUpper.checked) {
      id = id.toUpperCase();
    }
    list.push(id);
  }

  output.value = list.join("\n");
  showStatus(count === 1 ? "1 UUID generated." : count + " UUIDs generated.", "success");
}

// 5. Copy the result
async function copyUuids() {
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

// 6. Connect the buttons
document.getElementById("btn-generate").addEventListener("click", generateUuids);
document.getElementById("btn-copy").addEventListener("click", copyUuids);

// 7. Make one UUID as soon as the page opens
generateUuids();
