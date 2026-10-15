// 1. Find the elements on the page
const preview = document.getElementById("grad-preview");
const typeSelect = document.getElementById("grad-type");
const angleInput = document.getElementById("grad-angle");
const angleValue = document.getElementById("grad-angle-value");
const shapeSelect = document.getElementById("grad-shape");
const positionSelect = document.getElementById("grad-position");
const angleControl = document.getElementById("angle-control");
const shapeControl = document.getElementById("shape-control");
const positionControl = document.getElementById("position-control");
const stopsBox = document.getElementById("stops");
const outputBox = document.getElementById("grad-output");

const MIN_STOPS = 2;
const MAX_STOPS = 8;

// 2. Ready-made gradients
const PRESETS = {
  sunset: { type: "linear", angle: 135, stops: [["#f97316", 0], ["#ec4899", 55], ["#7c3aed", 100]] },
  ocean: { type: "linear", angle: 180, stops: [["#06b6d4", 0], ["#3b82f6", 100]] },
  forest: { type: "linear", angle: 160, stops: [["#134e5e", 0], ["#71b280", 100]] },
  candy: { type: "linear", angle: 90, stops: [["#f472b6", 0], ["#fbbf24", 100]] },
  midnight: { type: "radial", angle: 0, stops: [["#312e81", 0], ["#0f172a", 100]] },
  rainbow: { type: "conic", angle: 0, stops: [["#ef4444", 0], ["#eab308", 25], ["#22c55e", 50], ["#3b82f6", 75], ["#ef4444", 100]] }
};

// 3. Everything the user chose is kept here
const state = {
  type: "linear",
  angle: 135,
  shape: "circle",
  position: "center",
  stops: [
    { color: "#4f46e5", position: 0 },
    { color: "#ec4899", position: 100 }
  ]
};

// 4. Build the CSS text for the gradient
function buildGradient(current) {
  // CSS wants the stops from the smallest position to the biggest
  const sorted = current.stops
    .map(function (stop, index) {
      return { stop: stop, index: index };
    })
    .sort(function (a, b) {
      return a.stop.position - b.stop.position || a.index - b.index;
    })
    .map(function (item) {
      return item.stop;
    });

  const parts = sorted.map(function (stop) {
    return stop.color.toUpperCase() + " " + stop.position + "%";
  });

  let first;
  if (current.type === "linear") {
    first = current.angle + "deg";
  } else if (current.type === "radial") {
    first = current.shape + " at " + current.position;
  } else {
    first = "from " + current.angle + "deg at " + current.position;
  }

  return current.type + "-gradient(" + first + ", " + parts.join(", ") + ")";
}

// 5. Show the result
function updateOutput() {
  const css = buildGradient(state);
  preview.style.backgroundImage = css;
  outputBox.textContent = "background: " + css + ";";
}

// 6. Show only the controls that matter for the chosen type
function syncControls() {
  typeSelect.value = state.type;
  angleInput.value = state.angle;
  angleValue.textContent = state.angle + "\u00b0";
  shapeSelect.value = state.shape;
  positionSelect.value = state.position;

  angleControl.hidden = state.type === "radial";
  shapeControl.hidden = state.type !== "radial";
  positionControl.hidden = state.type === "linear";
}

// 7. The list of color stops
function renderStops() {
  stopsBox.textContent = "";

  state.stops.forEach(function (stop, index) {
    const row = document.createElement("div");
    row.className = "stop-row";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = stop.color;
    colorInput.setAttribute("aria-label", "Color " + (index + 1));
    colorInput.addEventListener("input", function () {
      stop.color = colorInput.value;
      updateOutput();
    });

    const positionInput = document.createElement("input");
    positionInput.type = "number";
    positionInput.min = "0";
    positionInput.max = "100";
    positionInput.value = stop.position;
    positionInput.setAttribute("aria-label", "Position of color " + (index + 1) + " in percent");
    positionInput.addEventListener("input", function () {
      const number = Number(positionInput.value);
      if (positionInput.value.trim() !== "" && isFinite(number)) {
        stop.position = Math.min(100, Math.max(0, Math.round(number)));
        updateOutput();
      }
    });

    const percent = document.createElement("span");
    percent.className = "stop-percent";
    percent.textContent = "%";

    const removeButton = document.createElement("button");
    removeButton.className = "btn btn-secondary btn-small";
    removeButton.textContent = "Remove";
    removeButton.disabled = state.stops.length <= MIN_STOPS;
    removeButton.addEventListener("click", function () {
      if (state.stops.length <= MIN_STOPS) {
        return;
      }
      state.stops.splice(index, 1);
      renderStops();
      updateOutput();
    });

    row.appendChild(colorInput);
    row.appendChild(positionInput);
    row.appendChild(percent);
    row.appendChild(removeButton);
    stopsBox.appendChild(row);
  });
}

// 8. Buttons
function addStop() {
  if (state.stops.length >= MAX_STOPS) {
    showStatus("You can use up to " + MAX_STOPS + " colors.", "error");
    return;
  }
  hideStatus();
  state.stops.push({ color: "#ffffff", position: 50 });
  renderStops();
  updateOutput();
}

function reverseStops() {
  state.stops = state.stops.map(function (stop) {
    return { color: stop.color, position: 100 - stop.position };
  }).reverse();
  renderStops();
  updateOutput();
}

function randomColor() {
  let hex = "#";
  for (let i = 0; i < 6; i++) {
    hex += "0123456789abcdef"[Math.floor(Math.random() * 16)];
  }
  return hex;
}

function randomGradient() {
  hideStatus();
  state.angle = Math.floor(Math.random() * 360);
  const count = 2 + Math.floor(Math.random() * 2);
  state.stops = [];
  for (let i = 0; i < count; i++) {
    state.stops.push({ color: randomColor(), position: Math.round((i / (count - 1)) * 100) });
  }
  syncControls();
  renderStops();
  updateOutput();
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (preset === undefined) {
    return;
  }
  hideStatus();
  state.type = preset.type;
  state.angle = preset.angle;
  state.shape = "circle";
  state.position = "center";
  state.stops = preset.stops.map(function (stop) {
    return { color: stop[0], position: stop[1] };
  });
  syncControls();
  renderStops();
  updateOutput();
}

// 9. Connect everything
typeSelect.addEventListener("change", function () {
  state.type = typeSelect.value;
  syncControls();
  updateOutput();
});

angleInput.addEventListener("input", function () {
  state.angle = Number(angleInput.value);
  angleValue.textContent = state.angle + "\u00b0";
  updateOutput();
});

shapeSelect.addEventListener("change", function () {
  state.shape = shapeSelect.value;
  updateOutput();
});

positionSelect.addEventListener("change", function () {
  state.position = positionSelect.value;
  updateOutput();
});

document.getElementById("btn-add-stop").addEventListener("click", addStop);
document.getElementById("btn-reverse").addEventListener("click", reverseStops);
document.getElementById("btn-random").addEventListener("click", randomGradient);

document.querySelectorAll("[data-preset]").forEach(function (button) {
  button.addEventListener("click", function () {
    applyPreset(button.dataset.preset);
  });
});

enableCopyButtons();
syncControls();
renderStops();
updateOutput();
