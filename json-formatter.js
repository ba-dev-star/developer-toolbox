// 1. Find the elements on the page
const input = document.getElementById("json-input");
const output = document.getElementById("json-output");
const statusBox = document.getElementById("status");
const indentSelect = document.getElementById("indent");

// 2. Show a message (type is "success" or "error")
function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = "status " + type;
}

// 3. Read the input and check if it is valid JSON
function readJson() {
  const text = input.value.trim();

  if (text === "") {
    showStatus("Paste some JSON first.", "error");
    return { ok: false };
  }

  try {
    return { ok: true, data: JSON.parse(text) };
  } catch (error) {
    showStatus("Invalid JSON: " + error.message, "error");
    return { ok: false };
  }
}

// 4. Get the indent the user selected
function getIndent() {
  const value = indentSelect.value;
  if (value === "tab") {
    return "\t";
  }
  return Number(value);
}

// 5. The tool actions
function formatJson() {
  const result = readJson();
  if (!result.ok) {
    output.value = "";
    return;
  }
  output.value = JSON.stringify(result.data, null, getIndent());
  showStatus("Valid JSON. Formatted successfully.", "success");
}

function minifyJson() {
  const result = readJson();
  if (!result.ok) {
    output.value = "";
    return;
  }
  output.value = JSON.stringify(result.data);
  showStatus("Valid JSON. Minified successfully.", "success");
}

function validateJson() {
  const result = readJson();
  if (result.ok) {
    showStatus("Valid JSON. No errors found.", "success");
  }
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

function loadExample() {
  input.value = '{"name":"Developer Toolbox","free":true,"tools":["JSON","Base64","UUID"],"version":1.5}';
  output.value = "";
  showStatus("Example loaded. Now press Format.", "success");
}

function clearAll() {
  input.value = "";
  output.value = "";
  statusBox.textContent = "";
  statusBox.className = "status";
}

// 6. Connect each button to its action
document.getElementById("btn-format").addEventListener("click", formatJson);
document.getElementById("btn-minify").addEventListener("click", minifyJson);
document.getElementById("btn-validate").addEventListener("click", validateJson);
document.getElementById("btn-copy").addEventListener("click", copyOutput);
document.getElementById("btn-example").addEventListener("click", loadExample);
document.getElementById("btn-clear").addEventListener("click", clearAll);
