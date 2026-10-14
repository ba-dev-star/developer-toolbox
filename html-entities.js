// 1. Find the elements on the page
const input = document.getElementById("entity-input");
const output = document.getElementById("entity-output");
const modeSelect = document.getElementById("mode");

// 2. The most common named entities (name: character number)
const ENTITY_NAMES = {
  quot: 34, amp: 38, apos: 39, lt: 60, gt: 62,
  OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, fnof: 402, circ: 710, tilde: 732,
  thinsp: 8201, ensp: 8194, emsp: 8195, zwnj: 8204, zwj: 8205, lrm: 8206, rlm: 8207,
  ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221,
  bdquo: 8222, dagger: 8224, Dagger: 8225, bull: 8226, hellip: 8230, permil: 8240,
  prime: 8242, Prime: 8243, lsaquo: 8249, rsaquo: 8250, euro: 8364, trade: 8482,
  larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596,
  minus: 8722, infin: 8734, ne: 8800, le: 8804, ge: 8805,
  spades: 9824, clubs: 9827, hearts: 9829, diams: 9830
};

// the characters 160 to 255 have names too, in this exact order
const LATIN1_NAMES = (
  "nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn " +
  "sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest " +
  "Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml " +
  "ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig " +
  "agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml " +
  "eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml"
).split(" ");

LATIN1_NAMES.forEach(function (name, index) {
  ENTITY_NAMES[name] = 160 + index;
});

// Greek letters
const GREEK_UPPER = "Alpha Beta Gamma Delta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omicron Pi Rho".split(" ");
const GREEK_UPPER_2 = "Sigma Tau Upsilon Phi Chi Psi Omega".split(" ");
GREEK_UPPER.forEach(function (name, index) {
  ENTITY_NAMES[name] = 913 + index;
  ENTITY_NAMES[name.toLowerCase()] = 945 + index;
});
GREEK_UPPER_2.forEach(function (name, index) {
  ENTITY_NAMES[name] = 931 + index;
  ENTITY_NAMES[name.toLowerCase()] = 963 + index;
});
ENTITY_NAMES.sigmaf = 962;

// the reverse table: character number to name
const NAME_BY_CODE = {};
for (const name in ENTITY_NAMES) {
  if (NAME_BY_CODE[ENTITY_NAMES[name]] === undefined) {
    NAME_BY_CODE[ENTITY_NAMES[name]] = name;
  }
}

// 3. Encode: characters to entities
function encodeEntities(text, mode) {
  let result = "";

  for (const character of text) {
    const code = character.codePointAt(0);

    if (character === "&") {
      result += "&amp;";
    } else if (character === "<") {
      result += "&lt;";
    } else if (character === ">") {
      result += "&gt;";
    } else if (character === '"') {
      result += "&quot;";
    } else if (character === "'") {
      result += "&#39;";
    } else if (mode !== "basic" && code > 127) {
      if (mode === "names" && NAME_BY_CODE[code] !== undefined) {
        result += "&" + NAME_BY_CODE[code] + ";";
      } else {
        result += "&#" + code + ";";
      }
    } else {
      result += character;
    }
  }

  return result;
}

// 4. Decode: entities to characters
function decodeEntities(text) {
  return text.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([A-Za-z][A-Za-z0-9]*));/g, function (match, decimal, hex, name) {
    if (decimal !== undefined || hex !== undefined) {
      const code = decimal !== undefined ? parseInt(decimal, 10) : parseInt(hex, 16);
      const isSurrogate = code >= 0xd800 && code <= 0xdfff;
      if (code === 0 || code > 0x10ffff || isSurrogate) {
        return "\uFFFD";
      }
      return String.fromCodePoint(code);
    }

    if (ENTITY_NAMES[name] !== undefined) {
      return String.fromCodePoint(ENTITY_NAMES[name]);
    }
    return match;
  });
}

// 5. The buttons
function encode() {
  if (input.value === "") {
    showStatus("Type or paste some text first.", "error");
    return;
  }
  output.value = encodeEntities(input.value, modeSelect.value);
  showStatus("Encoded successfully.", "success");
}

function decode() {
  if (input.value === "") {
    showStatus("Type or paste some text first.", "error");
    return;
  }
  output.value = decodeEntities(input.value);
  showStatus("Decoded successfully.", "success");
}

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

// 6. Connect the buttons
document.getElementById("btn-encode").addEventListener("click", encode);
document.getElementById("btn-decode").addEventListener("click", decode);
document.getElementById("btn-swap").addEventListener("click", swapValues);
document.getElementById("btn-copy").addEventListener("click", function () {
  copyText(output.value);
});
document.getElementById("btn-clear").addEventListener("click", clearAll);
