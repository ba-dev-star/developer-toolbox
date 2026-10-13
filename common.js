// Helpers shared by many tools

// Show a message above the tool (type is "success" or "error")
function showStatus(message, type) {
  const box = document.getElementById("status");
  box.textContent = message;
  box.className = "status " + type;
}

// Hide the message
function hideStatus() {
  const box = document.getElementById("status");
  box.textContent = "";
  box.className = "status";
}

// Copy text to the clipboard
async function copyText(text, message) {
  if (text === "") {
    showStatus("Nothing to copy yet.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showStatus(message || "Copied to clipboard.", "success");
  } catch (error) {
    // older method, used if the modern one is blocked
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    const worked = document.execCommand("copy");
    document.body.removeChild(temp);

    if (worked) {
      showStatus(message || "Copied to clipboard.", "success");
    } else {
      showStatus("Copy failed. Select the text and press Command + C.", "error");
    }
  }
}

// Any button with data-copy="some-id" copies the text of that element
function enableCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      const target = document.getElementById(button.dataset.copy);
      const text = "value" in target ? target.value : target.textContent;
      copyText(text);
    });
  });
}

// Turn a time in milliseconds into words, like "3 hours ago" or "in 2 days"
function relativeTime(timeMs) {
  const diff = timeMs - Date.now();
  const abs = Math.abs(diff);

  const units = [
    ["year", 31557600000],
    ["month", 2629800000],
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
    ["second", 1000]
  ];

  for (const [name, size] of units) {
    if (abs >= size) {
      const amount = Math.floor(abs / size);
      const text = amount + " " + name + (amount === 1 ? "" : "s");
      return diff < 0 ? text + " ago" : "in " + text;
    }
  }
  return "just now";
}
