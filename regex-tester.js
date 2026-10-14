// 1. Find the elements on the page
const patternInput = document.getElementById("pattern");
const testInput = document.getElementById("test-input");
const replacementInput = document.getElementById("replacement");
const flagsDisplay = document.getElementById("flags-display");
const summaryBox = document.getElementById("match-summary");
const highlightBox = document.getElementById("highlight");
const matchesBox = document.getElementById("matches");
const replaceSection = document.getElementById("replace-section");
const replaceBox = document.getElementById("replace-output");

const FLAGS = ["g", "i", "m", "s", "u"];
const MAX_MATCHES = 1000;
const MAX_ROWS = 200;

// 2. Read the checked flags, like "gi"
function getFlags() {
  let flags = "";
  for (const flag of FLAGS) {
    if (document.getElementById("flag-" + flag).checked) {
      flags += flag;
    }
  }
  return flags;
}

// 3. Find the matches
function findMatches(regex, text) {
  const found = [];

  if (regex.global) {
    for (const match of text.matchAll(regex)) {
      found.push(match);
      if (found.length >= MAX_MATCHES) {
        break;
      }
    }
  } else {
    const match = regex.exec(text);
    if (match !== null) {
      found.push(match);
    }
  }

  return found;
}

// 4. Show the summary badge
function showSummary(text, type) {
  summaryBox.textContent = "";
  const badge = document.createElement("span");
  badge.className = "badge " + type;
  badge.textContent = text;
  summaryBox.appendChild(badge);
}

// 5. Show the test text with the matches highlighted
function renderHighlight(text, matches) {
  highlightBox.textContent = "";
  let position = 0;

  for (const match of matches) {
    if (match[0].length === 0 || match.index < position) {
      continue;
    }
    if (match.index > position) {
      highlightBox.appendChild(document.createTextNode(text.slice(position, match.index)));
    }
    const mark = document.createElement("mark");
    mark.className = "match";
    mark.textContent = match[0];
    highlightBox.appendChild(mark);
    position = match.index + match[0].length;
  }

  if (position < text.length) {
    highlightBox.appendChild(document.createTextNode(text.slice(position)));
  }
}

// 6. Add one row to the matches list
function addRow(label, value) {
  const row = document.createElement("div");
  row.className = "result-row";

  const labelEl = document.createElement("div");
  labelEl.className = "result-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("div");
  valueEl.className = "result-value";
  valueEl.textContent = value;

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  matchesBox.appendChild(row);
}

function renderMatches(matches) {
  matchesBox.textContent = "";
  let rows = 0;

  for (let i = 0; i < matches.length; i++) {
    if (rows >= MAX_ROWS) {
      addRow("...", "More matches are not shown here.");
      return;
    }

    const match = matches[i];
    addRow("Match " + (i + 1) + " (index " + match.index + ")",
      match[0] === "" ? "(empty match)" : match[0]);
    rows++;

    for (let g = 1; g < match.length; g++) {
      addRow("   Group " + g, match[g] === undefined ? "(did not take part)" : match[g]);
      rows++;
    }

    if (match.groups) {
      for (const name in match.groups) {
        const value = match.groups[name];
        addRow("   Named: " + name, value === undefined ? "(did not take part)" : value);
        rows++;
      }
    }
  }
}

// 7. Clear everything shown
function clearOutputs() {
  summaryBox.textContent = "";
  highlightBox.textContent = "";
  matchesBox.textContent = "";
  replaceBox.textContent = "";
  replaceSection.hidden = true;
}

// 8. The main action
function update() {
  const pattern = patternInput.value;
  const flags = getFlags();
  flagsDisplay.textContent = flags;
  clearOutputs();

  if (pattern === "") {
    hideStatus();
    showSummary("Enter a pattern to start", "neutral");
    return;
  }

  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (error) {
    showStatus("Invalid pattern: " + error.message, "error");
    showSummary("Pattern has an error", "error");
    return;
  }

  hideStatus();
  const text = testInput.value;
  const matches = findMatches(regex, text);

  if (matches.length === 0) {
    showSummary("No matches", "neutral");
  } else if (matches.length >= MAX_MATCHES && regex.global) {
    showSummary(MAX_MATCHES + "+ matches (showing the first " + MAX_MATCHES + ")", "success");
  } else {
    showSummary(matches.length === 1 ? "1 match" : matches.length + " matches", "success");
  }

  renderHighlight(text, matches);
  renderMatches(matches);

  if (replacementInput.value !== "") {
    replaceBox.textContent = text.replace(regex, replacementInput.value);
    replaceSection.hidden = false;
  }
}

// 9. Example and clear
function loadExample() {
  patternInput.value = "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})";
  testInput.value = "Released on 2026-10-13 and updated on 2026-11-01.";
  replacementInput.value = "$<day>/$<month>/$<year>";
  for (const flag of FLAGS) {
    document.getElementById("flag-" + flag).checked = flag === "g";
  }
  update();
}

function clearAll() {
  patternInput.value = "";
  testInput.value = "";
  replacementInput.value = "";
  update();
}

// 10. Connect everything
patternInput.addEventListener("input", update);
testInput.addEventListener("input", update);
replacementInput.addEventListener("input", update);
for (const flag of FLAGS) {
  document.getElementById("flag-" + flag).addEventListener("change", update);
}
document.getElementById("btn-example").addEventListener("click", loadExample);
document.getElementById("btn-clear").addEventListener("click", clearAll);

update();
