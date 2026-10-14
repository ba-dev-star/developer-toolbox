// 1. Find the elements on the page
const input = document.getElementById("hash-input");
const optUpper = document.getElementById("opt-upper");
const compareInput = document.getElementById("compare-input");
const compareResult = document.getElementById("compare-result");

const ALGORITHMS = [
  { id: "md5", name: "MD5" },
  { id: "sha1", name: "SHA-1", subtle: "SHA-1" },
  { id: "sha256", name: "SHA-256", subtle: "SHA-256" },
  { id: "sha384", name: "SHA-384", subtle: "SHA-384" },
  { id: "sha512", name: "SHA-512", subtle: "SHA-512" }
];

// the hashes we calculated, in small letters (kept to compare and to change the letter case)
let hashes = {};
let runNumber = 0;

const hasSubtle = typeof crypto !== "undefined" && crypto.subtle !== undefined;

// 2. MD5, written by hand because browsers do not include it
const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
];

const MD5_CONSTANTS = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
  MD5_CONSTANTS[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
}

function rotateLeft(value, amount) {
  return ((value << amount) | (value >>> (32 - amount))) >>> 0;
}

function md5(bytes) {
  const length = bytes.length;
  const total = (((length + 8) >>> 6) + 1) << 6;

  // add the padding that MD5 needs
  const padded = new Uint8Array(total);
  padded.set(bytes);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(total - 8, (length * 8) % 4294967296, true);
  view.setUint32(total - 4, Math.floor((length * 8) / 4294967296), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < total; offset += 64) {
    const words = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      words[i] = view.getUint32(offset + i * 4, true);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f;
      let g;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      f = (f + a + MD5_CONSTANTS[i] + words[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + rotateLeft(f, MD5_SHIFTS[i])) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  // write the 4 numbers as text (small letters, little-endian)
  const output = new DataView(new ArrayBuffer(16));
  output.setUint32(0, a0, true);
  output.setUint32(4, b0, true);
  output.setUint32(8, c0, true);
  output.setUint32(12, d0, true);
  return bytesToHex(new Uint8Array(output.buffer));
}

// 3. Bytes to hex text
function bytesToHex(bytes) {
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

// 4. Show the hashes (capital or small letters)
function render() {
  for (const algorithm of ALGORITHMS) {
    const value = hashes[algorithm.id] || "";
    document.getElementById("out-" + algorithm.id).textContent =
      optUpper.checked ? value.toUpperCase() : value;
  }
}

// 5. Compare with a hash the user pasted
function updateCompare() {
  compareResult.textContent = "";
  const wanted = compareInput.value.replace(/\s+/g, "").toLowerCase();

  if (wanted === "") {
    return;
  }

  let text = "";
  let type = "";
  const lengths = { 32: "MD5", 40: "SHA-1", 64: "SHA-256", 96: "SHA-384", 128: "SHA-512" };

  if (Object.keys(hashes).length === 0) {
    text = "Type some text above first";
    type = "neutral";
  } else {
    const matches = ALGORITHMS.filter(function (algorithm) {
      return hashes[algorithm.id] === wanted;
    });

    if (matches.length > 0) {
      text = "Match: " + matches[0].name;
      type = "success";
    } else if (lengths[wanted.length]) {
      text = "No match. It has the length of " + lengths[wanted.length] + " but a different value";
      type = "error";
    } else {
      text = "No match. This is not the length of a known hash";
      type = "error";
    }
  }

  const badge = document.createElement("span");
  badge.className = "badge " + type;
  badge.textContent = text;
  compareResult.appendChild(badge);
}

// 6. Calculate all the hashes
async function updateHashes() {
  runNumber++;
  const thisRun = runNumber;
  const text = input.value;

  if (text === "") {
    hashes = {};
    render();
    hideStatus();
    updateCompare();
    return;
  }

  const bytes = new TextEncoder().encode(text);
  const results = { md5: md5(bytes) };

  if (hasSubtle) {
    const subtleAlgorithms = ALGORITHMS.filter(function (algorithm) {
      return algorithm.subtle;
    });

    const buffers = await Promise.all(subtleAlgorithms.map(function (algorithm) {
      return crypto.subtle.digest(algorithm.subtle, bytes);
    }));

    subtleAlgorithms.forEach(function (algorithm, index) {
      results[algorithm.id] = bytesToHex(new Uint8Array(buffers[index]));
    });
    hideStatus();
  } else {
    showStatus("SHA hashes need a secure page (https). Open the live website to see them. MD5 works everywhere.", "error");
  }

  // ignore this result if the user typed something newer in the meantime
  if (thisRun !== runNumber) {
    return;
  }

  hashes = results;
  render();
  updateCompare();
}

// 7. Connect everything
input.addEventListener("input", updateHashes);
optUpper.addEventListener("change", render);
compareInput.addEventListener("input", updateCompare);

document.getElementById("btn-clear").addEventListener("click", function () {
  input.value = "";
  compareInput.value = "";
  updateHashes();
  input.focus();
});

enableCopyButtons();
updateHashes();
