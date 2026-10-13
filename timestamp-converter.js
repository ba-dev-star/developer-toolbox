// 1. Find the elements on the page
const nowSeconds = document.getElementById("now-seconds");
const nowMs = document.getElementById("now-ms");

const tsInput = document.getElementById("ts-input");
const tsUnit = document.getElementById("ts-unit");
const tsDetected = document.getElementById("ts-detected");
const tsIso = document.getElementById("ts-iso");
const tsUtc = document.getElementById("ts-utc");
const tsLocal = document.getElementById("ts-local");
const tsRelative = document.getElementById("ts-relative");

const dtInput = document.getElementById("dt-input");
const dtZone = document.getElementById("dt-zone");
const dtSeconds = document.getElementById("dt-seconds");
const dtMs = document.getElementById("dt-ms");
const dtIso = document.getElementById("dt-iso");

// 2. Small helpers
function pad(number) {
  return String(number).padStart(2, "0");
}

function clearResults(boxes) {
  for (const box of boxes) {
    box.textContent = "";
  }
}

// Date to text like "2026-10-13 14:30:00" (local time or UTC)
function formatForInput(date, useUtc) {
  const year = useUtc ? date.getUTCFullYear() : date.getFullYear();
  const month = useUtc ? date.getUTCMonth() : date.getMonth();
  const day = useUtc ? date.getUTCDate() : date.getDate();
  const hours = useUtc ? date.getUTCHours() : date.getHours();
  const minutes = useUtc ? date.getUTCMinutes() : date.getMinutes();
  const seconds = useUtc ? date.getUTCSeconds() : date.getSeconds();

  return String(year).padStart(4, "0") + "-" + pad(month + 1) + "-" + pad(day) + " " +
    pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}

// 3. The live clock at the top
function updateClock() {
  const now = Date.now();
  nowSeconds.textContent = Math.floor(now / 1000);
  nowMs.textContent = now;
}

// 4. Timestamp to date
function convertTimestamp() {
  const resultBoxes = [tsDetected, tsIso, tsUtc, tsLocal, tsRelative];
  const text = tsInput.value.trim();

  if (text === "") {
    clearResults(resultBoxes);
    showStatus("Enter a Unix timestamp first.", "error");
    return;
  }

  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    clearResults(resultBoxes);
    showStatus("A timestamp contains digits only, like 1760000000.", "error");
    return;
  }

  const value = Number(text);

  // decide if the number is in seconds or milliseconds
  let unit = tsUnit.value;
  if (unit === "auto") {
    unit = Math.abs(value) >= 100000000000 ? "milliseconds" : "seconds";
  }

  const milliseconds = unit === "seconds" ? value * 1000 : value;
  const date = new Date(milliseconds);

  if (isNaN(date.getTime())) {
    clearResults(resultBoxes);
    showStatus("This number is too large to be a valid date.", "error");
    return;
  }

  hideStatus();
  tsDetected.textContent = unit;
  tsIso.textContent = date.toISOString();
  tsUtc.textContent = date.toUTCString();
  tsLocal.textContent = date.toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "long"
  });
  tsRelative.textContent = relativeTime(date.getTime());
}

// 5. Date to timestamp
function parseDateText(text, useUtc) {
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4] || 0);
  const minutes = Number(match[5] || 0);
  const seconds = Number(match[6] || 0);

  const date = new Date(0);
  if (useUtc) {
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(hours, minutes, seconds, 0);
  } else {
    date.setFullYear(year, month - 1, day);
    date.setHours(hours, minutes, seconds, 0);
  }

  // reject dates like February 31 that JavaScript would silently change
  const check = formatForInput(date, useUtc);
  const expected = match[1] + "-" + match[2] + "-" + match[3] + " " +
    pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
  if (check !== expected) {
    return null;
  }

  return date;
}

function convertDate() {
  const resultBoxes = [dtSeconds, dtMs, dtIso];
  const text = dtInput.value.trim();

  if (text === "") {
    clearResults(resultBoxes);
    showStatus("Enter a date first, like 2026-10-13 14:30:00.", "error");
    return;
  }

  const date = parseDateText(text, dtZone.value === "utc");
  if (date === null) {
    clearResults(resultBoxes);
    showStatus("Invalid date. Use the format 2026-10-13 14:30:00.", "error");
    return;
  }

  hideStatus();
  dtSeconds.textContent = Math.floor(date.getTime() / 1000);
  dtMs.textContent = date.getTime();
  dtIso.textContent = date.toISOString();
}

// 6. Fill the boxes with the current time
function useNowForTimestamp() {
  tsInput.value = Math.floor(Date.now() / 1000);
  tsUnit.value = "auto";
  convertTimestamp();
}

function useNowForDate() {
  dtInput.value = formatForInput(new Date(), dtZone.value === "utc");
  convertDate();
}

// 7. Connect the buttons
document.getElementById("btn-ts-convert").addEventListener("click", convertTimestamp);
document.getElementById("btn-ts-now").addEventListener("click", useNowForTimestamp);
document.getElementById("btn-dt-convert").addEventListener("click", convertDate);
document.getElementById("btn-dt-now").addEventListener("click", useNowForDate);

tsInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    convertTimestamp();
  }
});

dtInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    convertDate();
  }
});

enableCopyButtons();

// 8. Start: show the clock and fill both tools with the current time
updateClock();
setInterval(updateClock, 1000);
useNowForTimestamp();
useNowForDate();
