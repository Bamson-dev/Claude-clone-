(function markdownModule() {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeUrl(url) {
    const trimmed = String(url || "").trim();
    if (/^(https?:|mailto:)/i.test(trimmed)) {
      return trimmed;
    }
    return "#";
  }

  function parseTableBlock(lines) {
    if (lines.length < 2) {
      return null;
    }
    const divider = lines[1];
    if (!/^\|?[\s:-]+\|[\s|:-]+\|?$/.test(divider.replace(/\s/g, ""))) {
      return null;
    }
    const parseRow = (line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());
    const headers = parseRow(lines[0]);
    const rows = lines.slice(2).map(parseRow);
    const thead = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
    return `<div class="table-wrap"><table class="md-table">${thead}${tbody}</table></div>`;
  }

  function parseInline(text) {
    let out = text;
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      return `<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    out = out.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\*(.*?)\*/g, "<em>$1</em>");
    out = out.replace(/~~(.*?)~~/g, "<del>$1</del>");
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    return out;
  }

  function parseMarkdown(markdown, options = {}) {
    const streaming = Boolean(options.streaming);
    const raw = String(markdown || "");
    if (streaming) {
      return `<p class="streaming-text">${escapeHtml(raw).replace(/\n/g, "<br>")}<span class="stream-cursor" aria-hidden="true"></span></p>`;
    }

    const codeBlocks = [];
    let text = raw.replace(/```([\s\S]*?)```/g, (_, code) => {
      const token = `__CODE_BLOCK_${codeBlocks.length}__`;
      const langMatch = code.match(/^([a-zA-Z0-9+#.-]+)\n/);
      const lang = langMatch ? langMatch[1] : "";
      const body = langMatch ? code.slice(langMatch[0].length) : code;
      codeBlocks.push(
        `<div class="code-wrap"><div class="code-header"><span class="code-lang">${escapeHtml(lang || "code")}</span><button class="copy-code-btn tap-target" type="button" aria-label="Copy code">Copy</button></div><pre><code>${escapeHtml(body.trim())}</code></pre></div>`
      );
      return token;
    });

    text = escapeHtml(text);
    const blocks = text.split(/\n\n+/);
    const htmlParts = blocks.map((block) => {
      const trimmed = block.trim();
      if (!trimmed) {
        return "";
      }
      if (/^__CODE_BLOCK_\d+__$/.test(trimmed)) {
        return trimmed;
      }
      if (/^>\s/m.test(trimmed)) {
        const quote = trimmed
          .split("\n")
          .map((line) => line.replace(/^>\s?/, ""))
          .join("\n");
        return `<blockquote>${parseInline(quote.replace(/\n/g, "<br>"))}</blockquote>`;
      }
      if (/^\|.+\|/.test(trimmed) && trimmed.includes("\n")) {
        const table = parseTableBlock(trimmed.split("\n"));
        if (table) {
          return table;
        }
      }
      if (/^###\s+/.test(trimmed)) {
        return `<h3>${parseInline(trimmed.replace(/^###\s+/, ""))}</h3>`;
      }
      if (/^##\s+/.test(trimmed)) {
        return `<h2>${parseInline(trimmed.replace(/^##\s+/, ""))}</h2>`;
      }
      if (/^#\s+/.test(trimmed)) {
        return `<h1>${parseInline(trimmed.replace(/^#\s+/, ""))}</h1>`;
      }
      if (/^-\s/m.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => `<li>${parseInline(line.replace(/^-+\s*/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      if (/^\d+\.\s/m.test(trimmed)) {
        const items = trimmed
          .split("\n")
          .filter((line) => /^\d+\.\s/.test(line.trim()))
          .map((line) => `<li>${parseInline(line.replace(/^\d+\.\s*/, ""))}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }
      if (/^!\[([^\]]*)\]\(([^)]+)\)/.test(trimmed)) {
        const match = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
        if (match) {
          return `<figure class="md-image"><img src="${sanitizeUrl(match[2])}" alt="${escapeHtml(match[1])}" loading="lazy"><figcaption>${escapeHtml(match[1])}</figcaption></figure>`;
        }
      }
      return `<p>${parseInline(trimmed.replace(/\n/g, "<br>"))}</p>`;
    });

    let html = htmlParts.filter(Boolean).join("");
    codeBlocks.forEach((block, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, block);
    });
    return html;
  }

  window.ClaudeMarkdown = { parseMarkdown, escapeHtml };
})();
