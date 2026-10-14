// 1. Find the elements on the page
const input = document.getElementById("case-input");

const outputs = {
  upper: document.getElementById("out-upper"),
  lower: document.getElementById("out-lower"),
  title: document.getElementById("out-title"),
  sentence: document.getElementById("out-sentence"),
  camel: document.getElementById("out-camel"),
  pascal: document.getElementById("out-pascal"),
  snake: document.getElementById("out-snake"),
  constant: document.getElementById("out-constant"),
  kebab: document.getElementById("out-kebab"),
  dot: document.getElementById("out-dot")
};

// 2. Split a line into words: "XMLHttpRequest" -> XML, Http, Request
const WORD_PATTERN = /\p{Lu}+(?=\p{Lu}\p{Ll})|\p{Lu}?[\p{Ll}\p{N}]+|\p{Lu}+\p{N}*|[\p{Lo}\p{Lm}\p{M}]+\p{N}*/gu;

function getWords(line) {
  return line.match(WORD_PATTERN) || [];
}

// 3. Make the first letter big and the rest small
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// 4. The conversions. Each one works on a single line.
const converters = {
  upper: function (line) {
    return line.toUpperCase();
  },
  lower: function (line) {
    return line.toLowerCase();
  },
  title: function (line) {
    return line.toLowerCase().replace(/(^|[\s"(\[-])(\p{L})/gu, function (match, before, letter) {
      return before + letter.toUpperCase();
    });
  },
  sentence: function (line) {
    return line.toLowerCase().replace(/(^|[.!?\u061F]\s+)(\p{L})/gu, function (match, before, letter) {
      return before + letter.toUpperCase();
    });
  },
  camel: function (line) {
    return getWords(line).map(function (word, index) {
      return index === 0 ? word.toLowerCase() : capitalize(word);
    }).join("");
  },
  pascal: function (line) {
    return getWords(line).map(capitalize).join("");
  },
  snake: function (line) {
    return getWords(line).join("_").toLowerCase();
  },
  constant: function (line) {
    return getWords(line).join("_").toUpperCase();
  },
  kebab: function (line) {
    return getWords(line).join("-").toLowerCase();
  },
  dot: function (line) {
    return getWords(line).join(".").toLowerCase();
  }
};

// 5. Apply a conversion to every line of the text
function convertText(text, converter) {
  return text.split(/\r\n|\r|\n/).map(converter).join("\n");
}

// 6. Update all results while the user types
function updateAll() {
  const text = input.value;
  for (const name in converters) {
    outputs[name].textContent = convertText(text, converters[name]);
  }
}

// 7. Connect everything
input.addEventListener("input", updateAll);

document.getElementById("btn-example").addEventListener("click", function () {
  input.value = "getHTTPResponseCode for user ID";
  updateAll();
});

document.getElementById("btn-clear").addEventListener("click", function () {
  input.value = "";
  updateAll();
  hideStatus();
  input.focus();
});

enableCopyButtons();
updateAll();
