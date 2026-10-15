// 1. Find the elements on the page
const stage = document.getElementById("shadow-stage");
const box = document.getElementById("shadow-box");
const tabsBox = document.getElementById("layer-tabs");
const outputBox = document.getElementById("shadow-output");
const colorInput = document.getElementById("sh-color");
const insetInput = document.getElementById("sh-inset");
const stageColorInput = document.getElementById("pv-bg");
const boxColorInput = document.getElementById("pv-box");
const radiusInput = document.getElementById("pv-radius");
const radiusValue = document.getElementById("pv-radius-value");

const MAX_LAYERS = 5;

// the sliders: the name inside a layer, the id on the page, the unit shown
const SLIDERS = [
  { key: "x", id: "sh-x", unit: "px" },
  { key: "y", id: "sh-y", unit: "px" },
  { key: "blur", id: "sh-blur", unit: "px" },
  { key: "spread", id: "sh-spread", unit: "px" },
  { key: "opacity", id: "sh-opacity", unit: "%" }
];

// 2. Ready-made shadows. A shadow can have several layers.
const PRESETS = {
  subtle: {
    layers: [{ x: 0, y: 1, blur: 3, spread: 0, color: "#000000", opacity: 12, inset: false }]
  },
  soft: {
    layers: [
      { x: 0, y: 10, blur: 15, spread: -3, color: "#000000", opacity: 10, inset: false },
      { x: 0, y: 4, blur: 6, spread: -4, color: "#000000", opacity: 10, inset: false }
    ]
  },
  large: {
    layers: [{ x: 0, y: 25, blur: 50, spread: -12, color: "#000000", opacity: 25, inset: false }]
  },
  inset: {
    layers: [{ x: 0, y: 2, blur: 6, spread: 0, color: "#000000", opacity: 25, inset: true }]
  },
  neumorphic: {
    stage: "#e0e5ec",
    box: "#e0e5ec",
    layers: [
      { x: 9, y: 9, blur: 16, spread: 0, color: "#a3b1c6", opacity: 60, inset: false },
      { x: -9, y: -9, blur: 16, spread: 0, color: "#ffffff", opacity: 80, inset: false }
    ]
  }
};

// 3. Everything the user chose is kept here
let layers = [{ x: 0, y: 10, blur: 25, spread: -5, color: "#000000", opacity: 25, inset: false }];
let active = 0;

// 4. Build the CSS text
function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

function px(number) {
  return number === 0 ? "0" : number + "px";
}

function layerToCss(layer) {
  const rgb = hexToRgb(layer.color);
  const alpha = layer.opacity / 100;
  return (layer.inset ? "inset " : "") +
    px(layer.x) + " " + px(layer.y) + " " + px(layer.blur) + " " + px(layer.spread) +
    " rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + alpha + ")";
}

function buildShadow(list) {
  return list.map(layerToCss).join(",\n    ");
}

// 5. Show the result
function updateOutput() {
  const css = buildShadow(layers);
  box.style.boxShadow = css.replace(/\n\s*/g, " ");
  stage.style.background = stageColorInput.value;
  box.style.background = boxColorInput.value;
  box.style.borderRadius = radiusInput.value + "px";
  outputBox.textContent = "box-shadow: " + css + ";";
}

// 6. Put the values of the active layer into the controls
function syncControls() {
  const layer = layers[active];

  for (const slider of SLIDERS) {
    document.getElementById(slider.id).value = layer[slider.key];
    document.getElementById(slider.id + "-value").textContent = layer[slider.key] + slider.unit;
  }

  colorInput.value = layer.color;
  insetInput.checked = layer.inset;
}

// 7. The layer buttons
function renderTabs() {
  tabsBox.textContent = "";

  layers.forEach(function (layer, index) {
    const button = document.createElement("button");
    button.className = index === active ? "chip active" : "chip";
    button.textContent = "Layer " + (index + 1);
    button.addEventListener("click", function () {
      active = index;
      syncControls();
      renderTabs();
    });
    tabsBox.appendChild(button);
  });
}

function addLayer() {
  if (layers.length >= MAX_LAYERS) {
    showStatus("You can use up to " + MAX_LAYERS + " layers.", "error");
    return;
  }
  hideStatus();
  layers.push({ x: 0, y: 4, blur: 10, spread: 0, color: "#000000", opacity: 15, inset: false });
  active = layers.length - 1;
  syncControls();
  renderTabs();
  updateOutput();
}

function removeLayer() {
  if (layers.length <= 1) {
    showStatus("A shadow needs at least one layer.", "error");
    return;
  }
  hideStatus();
  layers.splice(active, 1);
  active = Math.min(active, layers.length - 1);
  syncControls();
  renderTabs();
  updateOutput();
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (preset === undefined) {
    return;
  }
  hideStatus();
  layers = preset.layers.map(function (layer) {
    return Object.assign({}, layer);
  });
  active = 0;
  stageColorInput.value = preset.stage || "#f1f5f9";
  boxColorInput.value = preset.box || "#ffffff";
  syncControls();
  renderTabs();
  updateOutput();
}

// 8. Connect everything
for (const slider of SLIDERS) {
  document.getElementById(slider.id).addEventListener("input", function () {
    const value = Number(document.getElementById(slider.id).value);
    layers[active][slider.key] = value;
    document.getElementById(slider.id + "-value").textContent = value + slider.unit;
    updateOutput();
  });
}

colorInput.addEventListener("input", function () {
  layers[active].color = colorInput.value;
  updateOutput();
});

insetInput.addEventListener("change", function () {
  layers[active].inset = insetInput.checked;
  updateOutput();
});

stageColorInput.addEventListener("input", updateOutput);
boxColorInput.addEventListener("input", updateOutput);
radiusInput.addEventListener("input", function () {
  radiusValue.textContent = radiusInput.value + "px";
  updateOutput();
});

document.getElementById("btn-add-layer").addEventListener("click", addLayer);
document.getElementById("btn-remove-layer").addEventListener("click", removeLayer);

document.querySelectorAll("[data-preset]").forEach(function (button) {
  button.addEventListener("click", function () {
    applyPreset(button.dataset.preset);
  });
});

enableCopyButtons();
syncControls();
renderTabs();
updateOutput();
