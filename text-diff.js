// 1. Find the elements on the page
const originalInput = document.getElementById("diff-original");
const changedInput = document.getElementById("diff-changed");
const optIgnoreCase = document.getElementById("opt-ignore-case");
const optIgnoreSpace = document.getElementById("opt-ignore-space");
const optOnlyChanges = document.getElementById("opt-only-changes");
const summaryBox = document.getElementById("diff-summary");
const outputBox = document.getElementById("diff-output");

const CONTEXT = 2;
const MAX_CELLS = 4000000;

// 2. Split text into lines (a final empty line is ignored)
function splitLines(text) {
  if (text === "") {
    return [];
  }
  const lines = text.split(/\r\n|\r|\n/);
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

// 3. Prepare a line for comparing (the options decide how)
function normalize(line) {
  let result = line;
  if (optIgnoreSpace.checked) {
    result = result.trim().replace(/\s+/g, " ");
  }
  if (optIgnoreCase.checked) {
    result = result.toLowerCase();
  }
  return result;
}

// 4. Find the differences between two lists of lines
function computeDiff(oldLines, newLines) {
  const a = oldLines.map(normalize);
  const b = newLines.map(normalize);

  // skip the lines that are equal at the start and at the end
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    start++;
  }
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const n = endA - start;
  const m = endB - start;
  if (n * m > MAX_CELLS) {
    return null;
  }

  // table of the longest common parts
  const width = m + 1;
  const table = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (a[start + i] === b[start + j]) {
        table[i * width + j] = table[(i + 1) * width + j + 1] + 1;
      } else {
        table[i * width + j] = Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
      }
    }
  }

  const ops = [];

  for (let k = 0; k < start; k++) {
    ops.push({ type: "same", a: k, b: k });
  }

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[start + i] === b[start + j]) {
      ops.push({ type: "same", a: start + i, b: start + j });
      i++;
      j++;
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
      ops.push({ type: "del", a: start + i });
      i++;
    } else {
      ops.push({ type: "add", b: start + j });
      j++;
    }
  }
  while (i < n) {
    ops.push({ type: "del", a: start + i });
    i++;
  }
  while (j < m) {
    ops.push({ type: "add", b: start + j });
    j++;
  }

  for (let k = 0; k < a.length - endA; k++) {
    ops.push({ type: "same", a: endA + k, b: endB + k });
  }

  return ops;
}

// 5. Show the summary badge
function showSummary(text, type) {
  summaryBox.textContent = "";
  const badge = document.createElement("span");
  badge.className = "badge " + type;
  badge.textContent = text;
  summaryBox.appendChild(badge);
}

// 6. Build one line of the result
function addLine(kind, oldNumber, newNumber, sign, text) {
  const line = document.createElement("div");
  line.className = "diff-line " + kind;

  const oldEl = document.createElement("span");
  oldEl.className = "diff-num";
  oldEl.textContent = oldNumber;

  const newEl = document.createElement("span");
  newEl.className = "diff-num";
  newEl.textContent = newNumber;

  const signEl = document.createElement("span");
  signEl.className = "diff-sign";
  signEl.textContent = sign;

  const textEl = document.createElement("span");
  textEl.className = "diff-text";
  textEl.setAttribute("dir", "auto");
  textEl.textContent = text;

  line.appendChild(oldEl);
  line.appendChild(newEl);
  line.appendChild(signEl);
  line.appendChild(textEl);
  outputBox.appendChild(line);
}

function addGap() {
  const gap = document.createElement("div");
  gap.className = "diff-gap";
  gap.textContent = "...";
  outputBox.appendChild(gap);
}

// 7. The main action
function compare() {
  outputBox.textContent = "";
  summaryBox.textContent = "";

  if (originalInput.value === "" && changedInput.value === "") {
    showStatus("Paste some text in the boxes first.", "error");
    return;
  }

  const oldLines = splitLines(originalInput.value);
  const newLines = splitLines(changedInput.value);
  const ops = computeDiff(oldLines, newLines);

  if (ops === null) {
    showStatus("These texts are too large to compare in the browser (about 2000 lines each is the limit).", "error");
    return;
  }

  hideStatus();

  let added = 0;
  let removed = 0;
  let same = 0;
  for (const op of ops) {
    if (op.type === "add") {
      added++;
    } else if (op.type === "del") {
      removed++;
    } else {
      same++;
    }
  }

  if (added === 0 && removed === 0) {
    showSummary("The texts are identical", "success");
  } else {
    showSummary("+" + added + " added, -" + removed + " removed, " + same + " unchanged", "neutral");
  }

  // decide which lines to show
  const show = new Array(ops.length).fill(!optOnlyChanges.checked);
  if (optOnlyChanges.checked) {
    for (let i = 0; i < ops.length; i++) {
      if (ops[i].type !== "same") {
        for (let k = Math.max(0, i - CONTEXT); k <= Math.min(ops.length - 1, i + CONTEXT); k++) {
          show[k] = true;
        }
      }
    }
  }

  let skipped = false;
  for (let i = 0; i < ops.length; i++) {
    if (!show[i]) {
      skipped = true;
      continue;
    }
    if (skipped) {
      addGap();
      skipped = false;
    }

    const op = ops[i];
    if (op.type === "same") {
      addLine("diff-same", op.a + 1, op.b + 1, " ", newLines[op.b]);
    } else if (op.type === "del") {
      addLine("diff-del", op.a + 1, "", "-", oldLines[op.a]);
    } else {
      addLine("diff-add", "", op.b + 1, "+", newLines[op.b]);
    }
  }
  if (skipped) {
    addGap();
  }
}

// 8. Other buttons
function swapTexts() {
  const temp = originalInput.value;
  originalInput.value = changedInput.value;
  changedInput.value = temp;
  compare();
}

function loadExample() {
  originalInput.value = "function greet(name) {\n  console.log(\"Hello \" + name);\n  return true;\n}\n\ngreet(\"world\");";
  changedInput.value = "function greet(name, punctuation) {\n  console.log(\"Hello \" + name + punctuation);\n  return true;\n}\n\ngreet(\"world\", \"!\");\ngreet(\"developer\", \"!\");";
  compare();
}

function clearAll() {
  originalInput.value = "";
  changedInput.value = "";
  outputBox.textContent = "";
  summaryBox.textContent = "";
  hideStatus();
}

// 9. Connect the buttons
document.getElementById("btn-compare").addEventListener("click", compare);
document.getElementById("btn-swap").addEventListener("click", swapTexts);
document.getElementById("btn-example").addEventListener("click", loadExample);
document.getElementById("btn-clear").addEventListener("click", clearAll);

function recompare() {
  if (originalInput.value !== "" || changedInput.value !== "") {
    compare();
  }
}

optIgnoreCase.addEventListener("change", recompare);
optIgnoreSpace.addEventListener("change", recompare);
optOnlyChanges.addEventListener("change", recompare);
