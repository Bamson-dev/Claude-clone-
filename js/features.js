(function featuresModule() {
  const PROMPTS_KEY = "claude_prompts";
  const ANALYTICS_KEY = "claude_analytics";
  const NAIJA_PREFS_KEY = "claude_naija_prefs";

  const defaultPrompts = [
    { id: "p1", title: "Cold email", text: "Write a cold email to a potential client for my {{service}} business." },
    { id: "p2", title: "Landing page headline", text: "Help me write a high-converting landing page headline for {{product}}." },
    { id: "p3", title: "Explain simply", text: "Explain {{topic}} like I'm a smart beginner." }
  ];

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function showToast(message) {
    let toast = document.getElementById("appToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "appToast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function getAnalytics() {
    return loadJson(ANALYTICS_KEY, {
      messagesSent: 0,
      assistantReplies: 0,
      estimatedTokens: 0,
      sessions: 0,
      lastSession: null
    });
  }

  function trackEvent(type, payload = {}) {
    const stats = getAnalytics();
    if (type === "message_sent") {
      stats.messagesSent += 1;
      stats.estimatedTokens += Math.ceil((payload.chars || 0) / 4);
    }
    if (type === "assistant_reply") {
      stats.assistantReplies += 1;
      stats.estimatedTokens += Math.ceil((payload.chars || 0) / 4);
    }
    if (type === "session_start") {
      const today = new Date().toDateString();
      if (stats.lastSession !== today) {
        stats.sessions += 1;
        stats.lastSession = today;
      }
    }
    saveJson(ANALYTICS_KEY, stats);
    renderAnalytics();
  }

  function renderAnalytics() {
    const stats = getAnalytics();
    const map = {
      statMessages: stats.messagesSent,
      statReplies: stats.assistantReplies,
      statTokens: stats.estimatedTokens.toLocaleString(),
      statSessions: stats.sessions
    };
    Object.entries(map).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value;
      }
    });
  }

  function getPrompts() {
    const saved = loadJson(PROMPTS_KEY, null);
    return saved && saved.length ? saved : defaultPrompts;
  }

  function savePrompts(prompts) {
    saveJson(PROMPTS_KEY, prompts);
  }

  function applyPromptVariables(text) {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = window.prompt(`Value for ${key}:`, "");
      return val || key;
    });
  }

  function renderPromptList() {
    const list = document.getElementById("promptList");
    if (!list) {
      return;
    }
    list.innerHTML = "";
    getPrompts().forEach((prompt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "prompt-item tap-target";
      btn.innerHTML = `<div class="prompt-item-title">${prompt.title}</div><div class="prompt-item-preview">${prompt.text}</div>`;
      btn.addEventListener("click", () => {
        const filled = applyPromptVariables(prompt.text);
        closePanel("promptPanel");
        if (window.ClaudeInputAPI) {
          window.ClaudeInputAPI.insertText(filled);
        }
      });
      list.appendChild(btn);
    });
  }

  function openPanel(id) {
    const panel = document.getElementById(id);
    const backdrop = document.getElementById("utilityPanelBackdrop");
    if (!panel || !backdrop) {
      return;
    }
    panel.classList.remove("hidden");
    backdrop.classList.remove("hidden");
    if (window.__claudeScrollLock) {
      window.__claudeScrollLock.acquire();
    }
  }

  function closePanel(id) {
    const panel = document.getElementById(id);
    const backdrop = document.getElementById("utilityPanelBackdrop");
    if (panel) {
      panel.classList.add("hidden");
    }
    const anyOpen = ["settingsPanel", "promptPanel", "shortcutsPanel"].some(
      (panelId) => !document.getElementById(panelId)?.classList.contains("hidden")
    );
    if (!anyOpen && backdrop) {
      backdrop.classList.add("hidden");
      if (window.__claudeScrollLock) {
        window.__claudeScrollLock.release();
      }
    }
  }

  function closeAllPanels() {
    ["settingsPanel", "promptPanel", "shortcutsPanel"].forEach((id) => closePanel(id));
  }

  function exportConversation(format) {
    const active = window.ClaudeChat?.getActiveConversation?.();
    if (!active || !active.messages?.length) {
      showToast("No conversation to export");
      return;
    }
    const lines = active.messages.map((msg) => {
      const role = msg.role === "user" ? "You" : "Claude";
      return `## ${role}\n\n${msg.content}\n`;
    });
    const markdown = `# ${active.title || "Conversation"}\n\n${lines.join("\n")}`;
    if (format === "md") {
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(active.title || "chat").slice(0, 30).replace(/\s+/g, "-")}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Markdown exported");
      return;
    }
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Allow popups to export PDF");
      return;
    }
    printWindow.document.write(`<!doctype html><html><head><title>${active.title || "Chat"}</title><style>body{font-family:system-ui;padding:24px;line-height:1.6}h1{font-size:20px}h2{font-size:14px;color:#666;margin-top:24px}</style></head><body><h1>${active.title || "Conversation"}</h1>${active.messages.map((m) => `<h2>${m.role === "user" ? "You" : "Claude"}</h2><p>${m.content.replace(/\n/g, "<br>")}</p>`).join("")}</body></html>`);
    printWindow.document.close();
    printWindow.print();
    showToast("PDF export opened");
  }

  function bindSettings() {
    const settingsBtn = document.getElementById("settingsBtn");
    const promptLibraryBtn = document.getElementById("promptLibraryBtn");
    const settingsClose = document.getElementById("settingsClose");
    const promptClose = document.getElementById("promptClose");
    const promptOpenBtn = promptLibraryBtn;
    const shortcutsClose = document.getElementById("shortcutsClose");
    const savePromptBtn = document.getElementById("savePromptBtn");
    const exportMdBtn = document.getElementById("exportMdBtn");
    const exportPdfBtn = document.getElementById("exportPdfBtn");
    const backdrop = document.getElementById("utilityPanelBackdrop");
    const naijaBusiness = document.getElementById("naijaBusinessContext");
    const naijaCity = document.getElementById("naijaDefaultCity");
    const naijaPrefs = loadJson(NAIJA_PREFS_KEY, { business: "", city: "Lagos" });

    if (naijaBusiness) {
      naijaBusiness.value = naijaPrefs.business || "";
    }
    if (naijaCity) {
      naijaCity.value = naijaPrefs.city || "Lagos";
    }

    const persistNaijaPrefs = () => {
      saveJson(NAIJA_PREFS_KEY, {
        business: naijaBusiness?.value.trim() || "",
        city: naijaCity?.value.trim() || "Lagos"
      });
      if (window.ClaudeChat?.setNaijaContext) {
        window.ClaudeChat.setNaijaContext(loadJson(NAIJA_PREFS_KEY, {}));
      }
    };

    naijaBusiness?.addEventListener("change", persistNaijaPrefs);
    naijaCity?.addEventListener("change", persistNaijaPrefs);

    settingsBtn?.addEventListener("click", () => {
      if (window.innerWidth < 1024 && window.ClaudeSidebar) {
        window.ClaudeSidebar.open();
      }
      renderAnalytics();
      openPanel("settingsPanel");
    });
    promptOpenBtn?.addEventListener("click", () => {
      if (window.innerWidth < 1024 && window.ClaudeSidebar) {
        window.ClaudeSidebar.close();
      }
      renderPromptList();
      openPanel("promptPanel");
    });
    settingsClose?.addEventListener("click", () => closePanel("settingsPanel"));
    promptClose?.addEventListener("click", () => closePanel("promptPanel"));
    shortcutsClose?.addEventListener("click", () => closePanel("shortcutsPanel"));
    backdrop?.addEventListener("click", closeAllPanels);

    savePromptBtn?.addEventListener("click", () => {
      const title = document.getElementById("newPromptTitle")?.value.trim();
      const text = document.getElementById("newPromptText")?.value.trim();
      if (!title || !text) {
        showToast("Add title and prompt text");
        return;
      }
      const prompts = getPrompts();
      prompts.unshift({ id: `p-${Date.now()}`, title, text });
      savePrompts(prompts);
      document.getElementById("newPromptTitle").value = "";
      document.getElementById("newPromptText").value = "";
      renderPromptList();
      showToast("Prompt saved");
    });

    exportMdBtn?.addEventListener("click", () => exportConversation("md"));
    exportPdfBtn?.addEventListener("click", () => exportConversation("pdf"));
  }

  function bindKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
      const mod = event.metaKey || event.ctrlKey;
      const target = event.target;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("conversationSearch")?.focus();
        if (window.ClaudeSidebar && window.innerWidth < 1024) {
          window.ClaudeSidebar.open();
        }
        return;
      }

      if (mod && event.key.toLowerCase() === "n") {
        event.preventDefault();
        document.getElementById("newChatBtn")?.click();
        return;
      }

      if (mod && event.key === "/") {
        event.preventDefault();
        openPanel("shortcutsPanel");
        return;
      }

      if (mod && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        renderPromptList();
        openPanel("promptPanel");
        return;
      }

      if (event.key === "Escape" && !typing) {
        closeAllPanels();
        window.ClaudeSidebar?.close();
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    trackEvent("session_start");
    renderAnalytics();
    bindSettings();
    bindKeyboardShortcuts();
    window.ClaudeFeatures = { trackEvent, showToast, getNaijaPrefs: () => loadJson(NAIJA_PREFS_KEY, {}) };
  });
})();
