// 1. Find the elements on the page
const tokenInput = document.getElementById("jwt-input");
const resultBox = document.getElementById("result");
const expiryBox = document.getElementById("expiry");
const headerBox = document.getElementById("jwt-header");
const payloadBox = document.getElementById("jwt-payload");
const signatureBox = document.getElementById("jwt-signature");
const claimsBox = document.getElementById("claims");

// 2. Names of the standard claims
const CLAIM_NAMES = {
  iss: "Issuer (iss)",
  sub: "Subject (sub)",
  aud: "Audience (aud)",
  exp: "Expires (exp)",
  nbf: "Not before (nbf)",
  iat: "Issued at (iat)",
  jti: "JWT ID (jti)"
};

// 3. Base64URL text to normal text
function base64UrlDecode(text) {
  let base64 = text.replace(/-/g, "+").replace(/_/g, "/");

  if (!/^[A-Za-z0-9+/]*$/.test(base64) || base64.length % 4 === 1) {
    throw new Error("Invalid Base64URL");
  }

  while (base64.length % 4 !== 0) {
    base64 += "=";
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

// 4. Decode one part and read it as JSON
function decodePart(text, name) {
  let data;
  try {
    data = JSON.parse(base64UrlDecode(text));
  } catch (error) {
    throw new Error("The " + name + " is not valid Base64URL JSON.");
  }

  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The " + name + " must be a JSON object.");
  }
  return data;
}

// 5. Show a time claim as a readable date
function describeTime(seconds) {
  if (typeof seconds !== "number" || !isFinite(seconds)) {
    return null;
  }
  const date = new Date(seconds * 1000);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString() + "  (" + relativeTime(date.getTime()) + ")";
}

// 6. Add one row to the claims list (textContent keeps it safe)
function addClaimRow(label, value) {
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
  claimsBox.appendChild(row);
}

// 7. Show the badge that tells if the token is expired
function showExpiry(payload) {
  const exp = payload.exp;
  const nbf = payload.nbf;
  let text = "No expiry (exp) claim";
  let type = "neutral";

  if (typeof exp === "number" && isFinite(exp)) {
    if (exp * 1000 < Date.now()) {
      text = "Expired " + relativeTime(exp * 1000);
      type = "error";
    } else {
      text = "Not expired. Expires " + relativeTime(exp * 1000);
      type = "success";
    }
  }

  if (typeof nbf === "number" && isFinite(nbf) && nbf * 1000 > Date.now()) {
    text = "Not valid yet. Becomes valid " + relativeTime(nbf * 1000);
    type = "error";
  }

  expiryBox.textContent = "";
  const badge = document.createElement("span");
  badge.className = "badge " + type;
  badge.textContent = text;
  expiryBox.appendChild(badge);
}

// 8. Hide the results
function hideResults() {
  resultBox.hidden = true;
  claimsBox.textContent = "";
  expiryBox.textContent = "";
  headerBox.textContent = "";
  payloadBox.textContent = "";
  signatureBox.textContent = "";
}

// 9. The main action
function decodeToken() {
  const token = tokenInput.value.trim().replace(/^Bearer\s+/i, "").replace(/\s+/g, "");

  if (token === "") {
    hideResults();
    hideStatus();
    return;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    hideResults();
    showStatus("A JWT has 3 parts separated by dots: header.payload.signature", "error");
    return;
  }

  let header;
  let payload;
  try {
    header = decodePart(parts[0], "header");
    payload = decodePart(parts[1], "payload");
  } catch (error) {
    hideResults();
    showStatus("Invalid JWT. " + error.message, "error");
    return;
  }

  hideStatus();
  headerBox.textContent = JSON.stringify(header, null, 2);
  payloadBox.textContent = JSON.stringify(payload, null, 2);
  signatureBox.textContent = parts[2] === "" ? "(empty, this token is unsigned)" : parts[2];

  claimsBox.textContent = "";
  addClaimRow("Algorithm (alg)", String(header.alg));
  for (const key in CLAIM_NAMES) {
    if (key in payload) {
      let value = typeof payload[key] === "object" ? JSON.stringify(payload[key]) : String(payload[key]);
      if (key === "exp" || key === "nbf" || key === "iat") {
        const readable = describeTime(payload[key]);
        if (readable !== null) {
          value = payload[key] + "  =  " + readable;
        }
      }
      addClaimRow(CLAIM_NAMES[key], value);
    }
  }

  showExpiry(payload);
  resultBox.hidden = false;
}

// 10. Example and clear
function loadExample() {
  tokenInput.value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFobWVkIERldiIsInJvbGUiOiJhZG1pbiIsImlzcyI6ImRldmVsb3Blci10b29sYm94IiwiaWF0IjoxNzYwMDAwMDAwLCJleHAiOjQxMDI0NDQ4MDB9.c2FtcGxlLXNpZ25hdHVyZS1ub3QtcmVhbA";
  decodeToken();
}

function clearAll() {
  tokenInput.value = "";
  decodeToken();
}

// 11. Connect everything
tokenInput.addEventListener("input", decodeToken);
document.getElementById("btn-example").addEventListener("click", loadExample);
document.getElementById("btn-clear").addEventListener("click", clearAll);
enableCopyButtons();
