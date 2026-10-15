// 1. Find the elements on the page
const input = document.getElementById("md-input");
const preview = document.getElementById("md-preview");
const htmlBox = document.getElementById("md-html");
const htmlSection = document.getElementById("html-section");
const optShowHtml = document.getElementById("opt-show-html");

const MAX_LENGTH = 200000;
const MAX_DEPTH = 8;

// 2. Make text safe: special characters become harmless entities
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 3. Is this link address safe? (it must never run code)
function isSafeUrl(url, onlyWeb) {
  if (/[\u0000-\u001f\u007f-\u009f]/.test(url)) {
    return false;
  }

  const scheme = url.match(/^([a-zA-Z][a-zA-Z0-9+.\-]*):/);
  if (scheme === null) {
    return !onlyWeb;
  }

  const name = scheme[1].toLowerCase();
  if (onlyWeb) {
    return name === "http" || name === "https";
  }
  return name === "http" || name === "https" || name === "mailto";
}

// 4. Inline parts: bold, italic, code, links, images
function renderInline(text) {
  const held = [];

  // keep finished pieces aside, so the next steps do not touch them
  function hold(html) {
    held.push(html);
    return "\u0000" + (held.length - 1) + "\u0000";
  }

  // code between backticks
  let working = text.replace(/(`+)(?!`)([\s\S]*?[^`])\1(?!`)/g, function (match, ticks, code) {
    return hold("<code>" + escapeHtml(code.trim()) + "</code>");
  });

  working = escapeHtml(working);

  // a backslash before a symbol shows the symbol as it is
  working = working.replace(/\\([\\`*_{}\[\]()#+\-.!~|])/g, function (match, character) {
    return hold(character);
  });

  // images: ![text](address "title")
  working = working.replace(/!\[([^\]]{0,300})\]\(([^)\s]{1,1000})(?:\s+&quot;(.{0,300}?)&quot;)?\)/g, function (match, alt, url, title) {
    if (!isSafeUrl(url, true)) {
      return alt;
    }
    return hold('<img src="' + url + '" alt="' + alt + '"' + (title ? ' title="' + title + '"' : "") + ">");
  });

  // links: [text](address "title")
  working = working.replace(/\[([^\]]{1,300})\]\(([^)\s]{1,1000})(?:\s+&quot;(.{0,300}?)&quot;)?\)/g, function (match, label, url, title) {
    if (!isSafeUrl(url, false)) {
      return label;
    }
    return hold('<a href="' + url + '" target="_blank" rel="noopener noreferrer"' +
      (title ? ' title="' + title + '"' : "") + ">") + label + hold("</a>");
  });

  // bold, italic and strikethrough
  working = working
    .replace(/\*\*\*([^*\s](?:[^*]*[^*\s])?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*\s](?:[^*]*[^*\s])?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\s](?:[^*]*[^*\s])?)\*/g, "<em>$1</em>")
    .replace(/(^|[^\w])__([^_\s](?:[^_]*[^_\s])?)__(?!\w)/g, "$1<strong>$2</strong>")
    .replace(/(^|[^\w])_([^_\s](?:[^_]*[^_\s])?)_(?!\w)/g, "$1<em>$2</em>")
    .replace(/~~([^~\s](?:[^~]*[^~\s])?)~~/g, "<del>$1</del>");

  return working.replace(/\u0000(\d+)\u0000/g, function (match, number) {
    return held[Number(number)];
  });
}

// 5. Helpers to recognise the kind of each line
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}>/;
const ITEM = /^(\s*)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/;

function matchFence(line) {
  const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if (match === null || (match[1][0] === "`" && match[2].includes("`"))) {
    return null;
  }
  return match;
}

function splitRow(line) {
  let row = line.trim();
  if (row.startsWith("|")) {
    row = row.slice(1);
  }
  if (row.endsWith("|") && !row.endsWith("\\|")) {
    row = row.slice(0, -1);
  }

  const cells = [];
  let current = "";
  for (let i = 0; i < row.length; i++) {
    if (row[i] === "\\" && row[i + 1] === "|") {
      current += "|";
      i++;
    } else if (row[i] === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += row[i];
    }
  }
  cells.push(current.trim());
  return cells;
}

function isTableStart(lines, index) {
  if (index + 1 >= lines.length || !lines[index].includes("|") || !lines[index + 1].includes("-")) {
    return false;
  }
  const header = splitRow(lines[index]);
  const separator = splitRow(lines[index + 1]);
  return header.length === separator.length && separator.every(function (cell) {
    return /^:?-+:?$/.test(cell);
  });
}

function startsBlock(lines, index) {
  const line = lines[index];
  if (matchFence(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line)) {
    return true;
  }
  const item = line.match(ITEM);
  if (item && (!/\d/.test(item[2]) || parseInt(item[2], 10) === 1)) {
    return true;
  }
  return isTableStart(lines, index);
}

function indentWidth(spaces) {
  return spaces.replace(/\t/g, "    ").length;
}

// 6. Build a list (with lists inside lists)
function renderList(items) {
  const stack = [];
  let html = "";

  function closeTop() {
    const list = stack.pop();
    let inner = "";
    for (const item of list.items) {
      inner += "<li" + (item.task ? ' class="task-item"' : "") + ">" + item.html + item.nested + "</li>";
    }
    const tag = list.ordered ? "ol" : "ul";
    const start = list.ordered && list.start !== 1 ? ' start="' + list.start + '"' : "";
    const result = "<" + tag + start + ">" + inner + "</" + tag + ">";

    if (stack.length > 0) {
      const parent = stack[stack.length - 1];
      parent.items[parent.items.length - 1].nested += result;
    } else {
      html += result;
    }
  }

  for (const item of items) {
    while (stack.length > 0 && item.indent < stack[stack.length - 1].indent) {
      closeTop();
    }
    if (stack.length > 0 && item.indent === stack[stack.length - 1].indent &&
      item.ordered !== stack[stack.length - 1].ordered) {
      closeTop();
    }
    if (stack.length === 0 || item.indent > stack[stack.length - 1].indent) {
      stack.push({
        indent: item.indent,
        ordered: item.ordered,
        start: parseInt(item.marker, 10) || 1,
        items: []
      });
    }

    const task = item.text.match(/^\[([ xX])\][ \t]+(.*)$/);
    if (task) {
      stack[stack.length - 1].items.push({
        task: true,
        html: '<input type="checkbox" disabled' + (task[1] === " " ? "" : " checked") + "> " + renderInline(task[2]),
        nested: ""
      });
    } else {
      stack[stack.length - 1].items.push({ task: false, html: renderInline(item.text), nested: "" });
    }
  }

  while (stack.length > 0) {
    closeTop();
  }
  return html;
}

// 7. Build a table
function renderTable(headerLine, separatorLine, bodyLines) {
  const header = splitRow(headerLine);
  const alignments = splitRow(separatorLine).map(function (cell) {
    if (cell.startsWith(":") && cell.endsWith(":")) {
      return ' style="text-align:center"';
    }
    if (cell.endsWith(":")) {
      return ' style="text-align:right"';
    }
    if (cell.startsWith(":")) {
      return ' style="text-align:left"';
    }
    return "";
  });

  let html = '<div class="table-wrap"><table><thead><tr>';
  header.forEach(function (cell, index) {
    html += "<th" + alignments[index] + ">" + renderInline(cell) + "</th>";
  });
  html += "</tr></thead>";

  if (bodyLines.length > 0) {
    html += "<tbody>";
    for (const bodyLine of bodyLines) {
      const cells = splitRow(bodyLine);
      html += "<tr>";
      for (let index = 0; index < header.length; index++) {
        html += "<td" + alignments[index] + ">" + renderInline(cells[index] || "") + "</td>";
      }
      html += "</tr>";
    }
    html += "</tbody>";
  }

  return html + "</table></div>";
}

// 8. The whole conversion, block by block
function markdownToHtml(source, depth) {
  depth = depth || 0;
  const lines = source.replace(/\r\n?/g, "\n").replace(/\u0000/g, "").split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // code block between ``` lines
    const fence = matchFence(line);
    if (fence) {
      const marker = fence[1];
      const language = fence[2].trim().split(/\s+/)[0].replace(/[^\w+#.\-]/g, "");
      const code = [];
      i++;
      while (i < lines.length) {
        const trimmed = lines[i].trim();
        if (trimmed.length >= marker.length && trimmed === marker[0].repeat(trimmed.length)) {
          break;
        }
        code.push(lines[i]);
        i++;
      }
      i++;
      out.push("<pre><code" + (language ? ' class="language-' + language + '"' : "") + ">" +
        escapeHtml(code.join("\n")) + "</code></pre>");
      continue;
    }

    // headings
    const heading = line.match(HEADING);
    if (heading) {
      const level = heading[1].length;
      out.push("<h" + level + ">" + renderInline(heading[2] || "") + "</h" + level + ">");
      i++;
      continue;
    }

    // horizontal line
    if (RULE.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }

    // quotes
    if (QUOTE.test(line)) {
      const quoted = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        quoted.push(lines[i].replace(/^ {0,3}> ?/, ""));
        i++;
      }
      if (depth >= MAX_DEPTH) {
        out.push("<p>" + renderInline(quoted.join("\n")) + "</p>");
      } else {
        out.push("<blockquote>" + markdownToHtml(quoted.join("\n"), depth + 1) + "</blockquote>");
      }
      continue;
    }

    // tables
    if (isTableStart(lines, i)) {
      const body = [];
      const headerLine = lines[i];
      const separatorLine = lines[i + 1];
      i += 2;
      while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
        body.push(lines[i]);
        i++;
      }
      out.push(renderTable(headerLine, separatorLine, body));
      continue;
    }

    // lists
    if (ITEM.test(line)) {
      const items = [];
      while (i < lines.length) {
        const current = lines[i];
        const match = current.match(ITEM);

        if (match && !RULE.test(current)) {
          items.push({
            indent: indentWidth(match[1]),
            ordered: /\d/.test(match[2]),
            marker: match[2],
            text: match[3]
          });
          i++;
        } else if (current.trim() === "") {
          let next = i;
          while (next < lines.length && lines[next].trim() === "") {
            next++;
          }
          if (next < lines.length && ITEM.test(lines[next]) && !RULE.test(lines[next])) {
            i = next;
          } else {
            break;
          }
        } else if (/^\s+\S/.test(current) && items.length > 0) {
          items[items.length - 1].text += " " + current.trim();
          i++;
        } else {
          break;
        }
      }

      if (items.length > 0) {
        out.push(renderList(items));
        continue;
      }
    }

    // normal paragraph
    const paragraph = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !startsBlock(lines, i)) {
      paragraph.push(lines[i]);
      i++;
    }
    const text = paragraph.map(function (part) {
      return part.replace(/^\s+/, "");
    }).join("\n");
    out.push("<p>" + renderInline(text).replace(/ {2,}\n/g, "<br>\n").replace(/\\\n/g, "<br>\n") + "</p>");
  }

  return out.join("\n");
}

// 9. Show the result while the user types
function update() {
  if (input.value.length > MAX_LENGTH) {
    showStatus("This text is too long for the previewer (the limit is " + MAX_LENGTH + " characters).", "error");
    return;
  }

  hideStatus();
  const html = markdownToHtml(input.value);
  preview.innerHTML = html;
  htmlBox.textContent = html;
}

function toggleHtml() {
  htmlSection.hidden = !optShowHtml.checked;
}

// 10. Example and clear
const EXAMPLE = [
  "# Markdown Previewer",
  "",
  "Write **bold**, *italic*, ~~strikethrough~~ and `inline code`.",
  "",
  "## A list",
  "",
  "- First item",
  "- Second item",
  "  - A nested item",
  "- [x] A finished task",
  "- [ ] A task to do",
  "",
  "1. One",
  "2. Two",
  "",
  "> A quote from someone wise.",
  "",
  "```js",
  "const greeting = \"Hello, world\";",
  "console.log(greeting);",
  "```",
  "",
  "| Tool | Free |",
  "| :--- | :---: |",
  "| Markdown | Yes |",
  "| JSON | Yes |",
  "",
  "A [link](https://example.com) and a line:",
  "",
  "---"
].join("\n");

input.addEventListener("input", update);
optShowHtml.addEventListener("change", toggleHtml);

document.getElementById("btn-example").addEventListener("click", function () {
  input.value = EXAMPLE;
  update();
});

document.getElementById("btn-clear").addEventListener("click", function () {
  input.value = "";
  update();
  input.focus();
});

enableCopyButtons();
toggleHtml();
update();
