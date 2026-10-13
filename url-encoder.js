// 1. Find the elements on the page
const input = document.getElementById("url-input");
const output = document.getElementById("url-output");
const modeSelect = document.getElementById("mode");
const plusAsSpace = document.getElementById("plus-space");

// 2. Encode
function encode() {
  if (input.value === "") {
    showStatus("Type or paste some text first.", "error");
    return;
  }

  try {
    if (modeSelect.value === "full") {
      output.value = encodeURI(input.value);
    } else {
      output.value = encodeURIComponent(input.value);
    }
    showStatus("Encoded successfully.", "success");
  } catch (error) {
    output.value = "";
    showStatus("This text contains an invalid character and cannot be encoded.", "error");
  }
}

// 3. Decode
function decode() {
  if (input.value.trim() === "") {
    showStatus("Type or paste some encoded text first.", "error");
    return;
  }

  let text = input.value;
  if (plusAsSpace.checked) {
    text = text.replace(/\+/g, " ");
  }

  try {
    if (modeSelect.value === "full") {
      output.value = decodeURI(text);
    } else {
      output.value = decodeURIComponent(text);
    }
    showStatus("Decoded successfully.", "success");
  } catch (error) {
    output.value = "";
    showStatus("Invalid encoding. Look for a % sign that is not followed by two hex digits.", "error");
  }
}

// 4. Swap, clear
function swapValues() {
  const temp = input.value;
  input.value = output.value;
  output.value = temp;
  showStatus("Swapped. The result is now the input.", "success");
}

function clearAll() {
  input.value = "";
  output.value = "";
  hideStatus();
}

// 5. Connect the buttons
document.getElementById("btn-encode").addEventListener("click", encode);
document.getElementById("btn-decode").addEventListener("click", decode);
document.getElementById("btn-swap").addEventListener("click", swapValues);
document.getElementById("btn-copy").addEventListener("click", function () {
  copyText(output.value);
});
document.getElementById("btn-clear").addEventListener("click", clearAll);
