(function appModule() {
  function setGreeting() {
    const greeting = document.getElementById("greetingText");
    if (!greeting) {
      return;
    }
    const hour = new Date().getHours();
    const timeLabel = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    greeting.textContent = `Good ${timeLabel}, Bamidele`;
  }

  function applySavedTheme() {
    const saved = localStorage.getItem("claude_theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("claude_theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("claude_theme", "dark");
    }
  }

  function setupInput() {
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");
    const newChatBtn = document.getElementById("newChatBtn");
    const mobileNewChatBtn = document.getElementById("mobileNewChatBtn");
    const inputShell = document.getElementById("inputShell");
    const naijaModeBtn = document.getElementById("naijaModeBtn");
    const contentModeBtn = document.getElementById("contentModeBtn");
    const naijaBanner = document.getElementById("naijaBanner");
    const naijaBannerClose = document.getElementById("naijaBannerClose");
    const contentPanel = document.getElementById("contentPanel");
    const contentClose = document.getElementById("contentClose");
    const contentGenerateBtn = document.getElementById("contentGenerateBtn");
    const contentResultWrap = document.getElementById("contentResultWrap");
    const contentResultBody = document.getElementById("contentResultBody");
    const cgScrollHint = document.getElementById("cgScrollHint");
    const contentCopyAllBtn = document.getElementById("contentCopyAllBtn");
    const contentResetBtn = document.getElementById("contentResetBtn");
    const cgSell = document.getElementById("cgSell");
    const cgIdealCustomer = document.getElementById("cgIdealCustomer");
    const cgPrice = document.getElementById("cgPrice");
    const cgExtra = document.getElementById("cgExtra");
    const agePills = document.getElementById("agePills");
    const goalPills = document.getElementById("goalPills");
    const platformPills = document.getElementById("platformPills");
    const tonePills = document.getElementById("tonePills");
    const cgTemplateSelect = document.getElementById("cgTemplateSelect");
    const cgSaveTemplateBtn = document.getElementById("cgSaveTemplateBtn");
    const cgHistoryList = document.getElementById("cgHistoryList");
    const cgPreviewTabs = document.getElementById("cgPreviewTabs");
    const cgPreviewStage = document.getElementById("cgPreviewStage");
    const waModeBtn = document.getElementById("waModeBtn");
    const whatsappPanel = document.getElementById("whatsappPanel");
    const whatsappClose = document.getElementById("whatsappClose");
    const waGenerateBtn = document.getElementById("waGenerateBtn");
    const waResultWrap = document.getElementById("waResultWrap");
    const waResultBody = document.getElementById("waResultBody");
    const waCopyBtn = document.getElementById("waCopyBtn");
    const waPreview = document.getElementById("waPreview");
    const waPreviewBubble = document.getElementById("waPreviewBubble");
    const waCustomerMessage = document.getElementById("waCustomerMessage");
    const waBusinessType = document.getElementById("waBusinessType");
    const waTone = document.getElementById("waTone");
    const waIncludePrice = document.getElementById("waIncludePrice");
    const waIncludeCta = document.getElementById("waIncludeCta");
    const waIncludePayment = document.getElementById("waIncludePayment");
    const waIncludeDelivery = document.getElementById("waIncludeDelivery");
    const attachBtn = document.getElementById("attachBtn");
    const attachMenu = document.getElementById("attachMenu");
    const uploadImageBtn = document.getElementById("uploadImageBtn");
    const uploadFileBtn = document.getElementById("uploadFileBtn");
    const takePhotoBtn = document.getElementById("takePhotoBtn");
    const fileUploadInput = document.getElementById("file-upload");
    const fileChipWrap = document.getElementById("fileChipWrap");
    const generatorPanelBackdrop = document.getElementById("generatorPanelBackdrop");
    const waSendBtn = document.getElementById("waSendBtn");
    let selectedWaOption = 0;
    let waReplyOptions = [];
    let naijaMode = false;
    let pendingAttachment = null;

    if (!input || !sendBtn) {
      return;
    }

    generatorPanelBackdrop?.addEventListener("click", () => {
      if (contentPanelOpen) {
        contentClose.click();
      }
      if (whatsappPanelOpen) {
        whatsappClose.click();
      }
    });

    const syncGeneratorBackdrop = () => {
      if (!generatorPanelBackdrop) {
        return;
      }
      const anyOpen = !contentPanel.classList.contains("hidden") || !whatsappPanel.classList.contains("hidden");
      generatorPanelBackdrop.classList.toggle("hidden", !anyOpen);
      generatorPanelBackdrop.setAttribute("aria-hidden", anyOpen ? "false" : "true");
    };

    const scrollLock = window.__claudeScrollLock;
    let contentPanelOpen = false;
    let whatsappPanelOpen = false;
    let panelScrollLockDepth = 0;

    const acquirePanelScrollLock = () => {
      if (!scrollLock) {
        return;
      }
      panelScrollLockDepth += 1;
      if (panelScrollLockDepth === 1) {
        scrollLock.acquire();
      }
    };

    const releasePanelScrollLock = () => {
      if (!scrollLock || panelScrollLockDepth === 0) {
        return;
      }
      panelScrollLockDepth -= 1;
      if (panelScrollLockDepth === 0) {
        scrollLock.release();
      }
    };

    const escapeHtml = (value) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const formatPlainMultiline = (value) => escapeHtml(value).replace(/\n/g, "<br>");

    const CG_TEMPLATES_KEY = "claude_cg_templates";
    const CG_HISTORY_KEY = "claude_cg_history";

    const builtInTemplates = {
      "product-launch": {
        sell: "New product collection",
        idealCustomer: "Young professionals who want quality without overspending",
        price: "Starts from N12,000",
        ageRanges: ["25-34"],
        goal: "Buy now",
        platforms: ["Instagram", "WhatsApp Status", "Facebook"],
        tone: "Hype and Energetic",
        extra: "Limited launch stock. Free delivery in Lagos."
      },
      "weekend-promo": {
        sell: "Fashion items on weekend sale",
        idealCustomer: "Style-conscious shoppers in Lagos and Abuja",
        price: "From N3,500 (was N7,000)",
        ageRanges: ["18-24", "25-34"],
        goal: "Buy now",
        platforms: ["WhatsApp Status", "Instagram", "Twitter/X"],
        tone: "Urgent and Scarce",
        extra: "Promo ends Sunday 11:59pm."
      },
      "service-business": {
        sell: "Professional home cleaning service",
        idealCustomer: "Busy working mums and young professionals",
        price: "From N15,000 per session",
        ageRanges: ["25-34", "35-44"],
        goal: "Send me a DM",
        platforms: ["Facebook", "Instagram", "LinkedIn"],
        tone: "Professional",
        extra: "Trusted team, same-day booking available."
      },
      "personal-brand": {
        sell: "Personal branding and content coaching",
        idealCustomer: "Creators and entrepreneurs building online presence",
        price: "N25,000/month mentorship",
        ageRanges: ["25-34"],
        goal: "Register or sign up",
        platforms: ["LinkedIn", "Instagram", "Twitter/X"],
        tone: "Akin Alabi Style",
        extra: "Includes weekly content review and growth strategy."
      }
    };

    const loadJson = (key, fallback) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) {
        return fallback;
      }
    };

    const saveJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));

    const activatePills = (group, values, single) => {
      if (!group) {
        return;
      }
      group.querySelectorAll(".pill-btn").forEach((btn) => btn.classList.remove("active"));
      const list = Array.isArray(values) ? values : [values];
      list.forEach((value) => {
        const match = Array.from(group.querySelectorAll(".pill-btn")).find((btn) => btn.textContent.trim() === value);
        if (match) {
          match.classList.add("active");
        }
      });
    };

    const selectedText = (group) =>
      Array.from(group.querySelectorAll(".pill-btn.active")).map((btn) => btn.textContent.trim());

    const readContentPayload = () => ({
      sell: cgSell.value.trim(),
      idealCustomer: cgIdealCustomer.value.trim(),
      price: cgPrice.value.trim(),
      ageRanges: selectedText(agePills),
      goal: selectedText(goalPills)[0] || "",
      platforms: selectedText(platformPills),
      tone: selectedText(tonePills)[0] || "",
      extra: cgExtra.value.trim()
    });

    const applyContentPayload = (payload) => {
      cgSell.value = payload.sell || "";
      cgIdealCustomer.value = payload.idealCustomer || "";
      cgPrice.value = payload.price || "";
      cgExtra.value = payload.extra || "";
      activatePills(agePills, payload.ageRanges || [], false);
      activatePills(goalPills, payload.goal || "", true);
      activatePills(platformPills, payload.platforms || [], false);
      activatePills(tonePills, payload.tone || "", true);
    };

    const renderContentHistory = () => {
      if (!cgHistoryList) {
        return;
      }
      const history = loadJson(CG_HISTORY_KEY, []);
      cgHistoryList.innerHTML = "";
      if (!history.length) {
        cgHistoryList.innerHTML = `<p class="cg-history-item-meta">No saved campaigns yet.</p>`;
        return;
      }
      history.slice(0, 8).forEach((entry) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cg-history-item tap-target";
        btn.innerHTML = `<div class="cg-history-item-title">${escapeHtml(entry.title)}</div><div class="cg-history-item-meta">${new Date(entry.createdAt).toLocaleString()}</div>`;
        btn.addEventListener("click", () => {
          applyContentPayload(entry.payload);
          renderContentGeneratorOutput(entry.output);
          contentResultWrap.classList.remove("hidden");
        });
        cgHistoryList.appendChild(btn);
      });
    };

    const saveContentHistory = (payload, output) => {
      const history = loadJson(CG_HISTORY_KEY, []);
      history.unshift({
        id: `cg-${Date.now()}`,
        title: payload.sell || "Campaign",
        payload,
        output,
        createdAt: Date.now()
      });
      saveJson(CG_HISTORY_KEY, history.slice(0, 20));
      renderContentHistory();
    };

    const parsePlatformSections = (rawText) => {
      const text = String(rawText || "").trim();
      const dividerPattern = /^===([^=\n][^=\n]*?)===$/gim;
      const matches = [...text.matchAll(dividerPattern)];
      if (!matches.length) {
        return [{ title: "Generated content", body: text }];
      }
      return matches.map((match, index) => {
        const title = match[1].trim();
        const start = match.index + match[0].length;
        const end = index + 1 < matches.length ? matches[index + 1].index : text.length;
        return { title, body: text.slice(start, end).replace(/^\s*\n+/, "").trim() };
      });
    };

    const previewClassForPlatform = (title) => {
      const t = title.toLowerCase();
      if (t.includes("whatsapp")) {
        return "whatsapp";
      }
      if (t.includes("instagram")) {
        return "instagram";
      }
      return "";
    };

    const renderPlatformPreview = (sections) => {
      if (!cgPreviewTabs || !cgPreviewStage || !sections.length) {
        return;
      }
      cgPreviewTabs.classList.remove("hidden");
      cgPreviewStage.classList.remove("hidden");
      cgPreviewTabs.innerHTML = "";
      cgPreviewStage.innerHTML = "";

      const showSection = (section, index) => {
        cgPreviewTabs.querySelectorAll(".cg-preview-tab").forEach((tab, i) => {
          tab.classList.toggle("active", i === index);
        });
        const previewClass = previewClassForPlatform(section.title);
        const bodyPreview = previewClass === "whatsapp"
          ? `<div class="bubble">${formatPlainMultiline(section.body.slice(0, 420))}</div>`
          : formatPlainMultiline(section.body.slice(0, 600));
        cgPreviewStage.innerHTML = `
          <div class="cg-preview-label">${escapeHtml(section.title)} preview</div>
          <div class="cg-preview-phone">
            <div class="cg-preview-screen ${previewClass}">${bodyPreview}</div>
          </div>`;
      };

      sections.forEach((section, index) => {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = `cg-preview-tab tap-target${index === 0 ? " active" : ""}`;
        tab.textContent = section.title.length > 18 ? `${section.title.slice(0, 16)}…` : section.title;
        tab.addEventListener("click", () => showSection(section, index));
        cgPreviewTabs.appendChild(tab);
      });
      showSection(sections[0], 0);
    };

    const renderContentGeneratorOutput = (rawText) => {
      if (!contentResultBody) {
        return;
      }
      const text = String(rawText || "").trim();
      const sections = parsePlatformSections(text);
      contentResultBody.innerHTML = "";
      renderPlatformPreview(sections);

      const appendSection = (title, body) => {
        const wrap = document.createElement("div");
        wrap.className = "cg-platform-section";
        const heading = document.createElement("div");
        heading.className = "cg-platform-title";
        heading.textContent = title;
        const bodyEl = document.createElement("div");
        bodyEl.className = "cg-platform-body";
        bodyEl.innerHTML = formatPlainMultiline(body.trim());
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "cg-platform-copy tap-target";
        copyBtn.textContent = `Copy ${title}`;
        copyBtn.addEventListener("click", async () => {
          await navigator.clipboard.writeText(body.trim());
          copyBtn.textContent = "Copied";
          setTimeout(() => {
            copyBtn.textContent = `Copy ${title}`;
          }, 1200);
        });
        wrap.appendChild(heading);
        wrap.appendChild(bodyEl);
        wrap.appendChild(copyBtn);
        contentResultBody.appendChild(wrap);
      };

      if (sections.length === 1 && sections[0].title === "Generated content" && !text.includes("===")) {
        appendSection(sections[0].title, sections[0].body || "No content returned.");
      } else {
        sections.forEach((section, index) => {
          appendSection(section.title, section.body);
          if (index < sections.length - 1) {
            const divider = document.createElement("div");
            divider.className = "cg-platform-divider";
            divider.setAttribute("role", "separator");
            contentResultBody.appendChild(divider);
          }
        });
      }

      requestAnimationFrame(() => {
        contentResultBody.scrollTo({ top: 0, behavior: "smooth" });
        if (!cgScrollHint) {
          return;
        }
        cgScrollHint.classList.remove("hidden", "cg-scroll-hint-fade");
        const overflowY = contentResultBody.scrollHeight - contentResultBody.clientHeight > 4;
        if (!overflowY) {
          cgScrollHint.classList.add("hidden");
          return;
        }
        clearTimeout(renderContentGeneratorOutput.__hintTimer);
        renderContentGeneratorOutput.__hintTimer = setTimeout(() => {
          cgScrollHint.classList.add("cg-scroll-hint-fade");
        }, 4000);
      });
    };

    const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

    const resizeInput = () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 168)}px`;
    };

    const syncSendState = () => {
      sendBtn.disabled = input.value.trim().length === 0 && !pendingAttachment;
    };

    const truncateName = (name) => (name.length <= 30 ? name : `${name.slice(0, 30)}...`);

    const clearAttachment = () => {
      pendingAttachment = null;
      fileUploadInput.value = "";
      fileUploadInput.removeAttribute("capture");
      fileChipWrap.innerHTML = "";
      fileChipWrap.classList.add("hidden");
      syncSendState();
    };

    const renderAttachmentChip = () => {
      if (!pendingAttachment) {
        clearAttachment();
        return;
      }
      const iconOrThumb = pendingAttachment.previewUrl
        ? `<img class="file-thumb" src="${pendingAttachment.previewUrl}" alt="file preview">`
        : `<span aria-hidden="true">📄</span>`;
      fileChipWrap.innerHTML = `<div class="file-chip">${iconOrThumb}<span class="file-chip-name">${truncateName(pendingAttachment.file.name)}</span><button class="file-chip-remove tap-target" id="fileChipRemove" aria-label="Remove attachment">✕</button></div>`;
      fileChipWrap.classList.remove("hidden");
      const removeBtn = document.getElementById("fileChipRemove");
      if (removeBtn) {
        removeBtn.addEventListener("click", clearAttachment);
      }
      syncSendState();
    };

    const readAsDataUrl = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const resetChat = () => {
      const empty = document.getElementById("chatEmptyState");
      const messages = document.getElementById("chatMessages");
      messages.innerHTML = "";
      messages.classList.add("hidden");
      empty.classList.remove("hidden");
      if (window.ClaudeChat) {
        window.ClaudeChat.resetConversation();
      }
      setGreeting();
      input.value = "";
      clearAttachment();
      resizeInput();
      syncSendState();
      if (window.ClaudeSidebar && !isDesktop()) {
        window.ClaudeSidebar.close();
      }
    };

    const send = (overrideText) => {
      const rawMessage = (overrideText || input.value).trim();
      if ((!rawMessage && !pendingAttachment) || !window.ClaudeChat) {
        return;
      }
      const attachmentTag = pendingAttachment ? `[Attached: ${pendingAttachment.file.name}]` : "";
      const finalText = [attachmentTag, rawMessage].filter(Boolean).join(" ").trim() || "What is in this image?";
      const apiAttachment = pendingAttachment && pendingAttachment.isImage
        ? { type: pendingAttachment.file.type, base64Data: pendingAttachment.base64Data }
        : null;
      window.ClaudeChat.sendMessage(finalText, apiAttachment);
      if (!overrideText) {
        input.value = "";
      }
      clearAttachment();
      resizeInput();
      syncSendState();
      if (window.ClaudeSidebar && !isDesktop()) {
        window.ClaudeSidebar.close();
      }
    };

    input.addEventListener("input", () => {
      resizeInput();
      syncSendState();
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }
      if (isDesktop()) {
        event.preventDefault();
        send();
      }
    });

    sendBtn.addEventListener("click", () => send());
    newChatBtn.addEventListener("click", resetChat);
    mobileNewChatBtn.addEventListener("click", resetChat);
    naijaModeBtn.addEventListener("click", () => {
      naijaMode = !naijaMode;
      naijaModeBtn.classList.toggle("active", naijaMode);
      const text = naijaModeBtn.querySelector(".mode-text");
      if (text) {
        text.textContent = naijaMode ? "Naija Mode ON" : "Naija Mode";
      }
      naijaBanner.classList.toggle("hidden", !naijaMode);
      if (window.ClaudeChat) {
        window.ClaudeChat.setNaijaMode(naijaMode);
      }
    });
    naijaBannerClose.addEventListener("click", () => {
      naijaBanner.classList.add("hidden");
    });
    contentModeBtn.addEventListener("click", () => {
      const willOpen = contentPanel.classList.contains("hidden");
      contentPanel.classList.toggle("hidden");
      whatsappPanel.classList.add("hidden");
      attachMenu.classList.add("hidden");
      waModeBtn.classList.remove("active");
      contentModeBtn.classList.toggle("active", !contentPanel.classList.contains("hidden"));

      if (willOpen) {
        if (whatsappPanelOpen) {
          whatsappPanelOpen = false;
          releasePanelScrollLock();
        }
        if (!contentPanelOpen) {
          acquirePanelScrollLock();
          contentPanelOpen = true;
        }
      } else if (contentPanelOpen) {
        contentPanelOpen = false;
        releasePanelScrollLock();
      }
      syncGeneratorBackdrop();
    });
    contentClose.addEventListener("click", () => {
      if (contentPanelOpen) {
        contentPanelOpen = false;
        releasePanelScrollLock();
      }
      contentPanel.classList.add("hidden");
      contentModeBtn.classList.remove("active");
      syncGeneratorBackdrop();
    });
    waModeBtn.addEventListener("click", () => {
      const willOpen = whatsappPanel.classList.contains("hidden");
      whatsappPanel.classList.toggle("hidden");
      contentPanel.classList.add("hidden");
      attachMenu.classList.add("hidden");
      contentModeBtn.classList.remove("active");
      waModeBtn.classList.toggle("active", !whatsappPanel.classList.contains("hidden"));

      if (willOpen) {
        if (contentPanelOpen) {
          contentPanelOpen = false;
          releasePanelScrollLock();
        }
        if (!whatsappPanelOpen) {
          acquirePanelScrollLock();
          whatsappPanelOpen = true;
        }
      } else if (whatsappPanelOpen) {
        whatsappPanelOpen = false;
        releasePanelScrollLock();
      }
      syncGeneratorBackdrop();
    });
    whatsappClose.addEventListener("click", () => {
      if (whatsappPanelOpen) {
        whatsappPanelOpen = false;
        releasePanelScrollLock();
      }
      whatsappPanel.classList.add("hidden");
      waModeBtn.classList.remove("active");
      syncGeneratorBackdrop();
    });
    const bindPills = (group) => {
      const single = group.dataset.single === "true";
      group.querySelectorAll(".pill-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (single) {
            group.querySelectorAll(".pill-btn.active").forEach((item) => item.classList.remove("active"));
            btn.classList.add("active");
          } else {
            btn.classList.toggle("active");
          }
        });
      });
    };
    [agePills, goalPills, platformPills, tonePills].forEach(bindPills);

    cgTemplateSelect?.addEventListener("change", () => {
      const key = cgTemplateSelect.value;
      if (!key) {
        return;
      }
      const custom = loadJson(CG_TEMPLATES_KEY, {});
      const payload = custom[key] || builtInTemplates[key];
      if (payload) {
        applyContentPayload(payload);
      }
    });

    cgSaveTemplateBtn?.addEventListener("click", () => {
      const payload = readContentPayload();
      if (!payload.sell) {
        window.ClaudeFeatures?.showToast?.("Add what you sell before saving");
        return;
      }
      const name = window.prompt("Template name:", payload.sell);
      if (!name) {
        return;
      }
      const custom = loadJson(CG_TEMPLATES_KEY, {});
      const slug = `custom-${Date.now()}`;
      custom[slug] = payload;
      saveJson(CG_TEMPLATES_KEY, custom);
      const option = document.createElement("option");
      option.value = slug;
      option.textContent = name;
      cgTemplateSelect.appendChild(option);
      cgTemplateSelect.value = slug;
      window.ClaudeFeatures?.showToast?.("Template saved");
    });

    const loadCustomTemplates = () => {
      if (!cgTemplateSelect) {
        return;
      }
      const custom = loadJson(CG_TEMPLATES_KEY, {});
      Object.entries(custom).forEach(([key, payload]) => {
        if (cgTemplateSelect.querySelector(`option[value="${key}"]`)) {
          return;
        }
        const option = document.createElement("option");
        option.value = key;
        option.textContent = payload.sell || key;
        cgTemplateSelect.appendChild(option);
      });
    };

    renderContentHistory();
    loadCustomTemplates();

    const clearContentFieldErrors = () => {
      contentPanel.querySelectorAll(".field-error").forEach((node) => node.remove());
      contentPanel.querySelectorAll(".field-invalid").forEach((node) => node.classList.remove("field-invalid"));
    };

    const showFieldError = (target, message) => {
      if (!target) {
        return;
      }
      const existing = target.nextElementSibling;
      if (existing && existing.classList.contains("field-error")) {
        existing.remove();
      }
      target.classList.add("field-invalid");
      const error = document.createElement("div");
      error.className = "field-error";
      error.textContent = message;
      target.insertAdjacentElement("afterend", error);
    };

    const resetContentForm = () => {
      clearContentFieldErrors();
      [cgSell, cgIdealCustomer, cgPrice, cgExtra].forEach((el) => {
        el.value = "";
      });
      [agePills, goalPills, platformPills, tonePills].forEach((group) => {
        group.querySelectorAll(".pill-btn.active").forEach((item) => item.classList.remove("active"));
      });
      contentResultWrap.classList.add("hidden");
      if (contentResultBody) {
        contentResultBody.innerHTML = "";
      }
      if (cgPreviewTabs) {
        cgPreviewTabs.classList.add("hidden");
        cgPreviewTabs.innerHTML = "";
      }
      if (cgPreviewStage) {
        cgPreviewStage.classList.add("hidden");
        cgPreviewStage.innerHTML = "";
      }
      if (cgScrollHint) {
        cgScrollHint.classList.add("hidden");
        cgScrollHint.classList.remove("cg-scroll-hint-fade");
      }
    };

    [cgSell, cgIdealCustomer, cgPrice].forEach((el) => {
      el.addEventListener("input", () => {
        el.classList.remove("field-invalid");
        const next = el.nextElementSibling;
        if (next && next.classList.contains("field-error")) {
          next.remove();
        }
      });
    });
    [agePills, goalPills, platformPills, tonePills].forEach((group) => {
      group.addEventListener("click", () => {
        group.classList.remove("field-invalid");
        const next = group.nextElementSibling;
        if (next && next.classList.contains("field-error")) {
          next.remove();
        }
      });
    });

    contentGenerateBtn.addEventListener("click", async () => {
      clearContentFieldErrors();
      const payload = readContentPayload();

      const checks = [
        { ok: Boolean(payload.sell), target: cgSell },
        { ok: Boolean(payload.idealCustomer), target: cgIdealCustomer },
        { ok: Boolean(payload.price), target: cgPrice },
        { ok: payload.ageRanges.length > 0, target: agePills },
        { ok: Boolean(payload.goal), target: goalPills },
        { ok: payload.platforms.length > 0, target: platformPills },
        { ok: Boolean(payload.tone), target: tonePills }
      ];

      const firstInvalid = checks.find((item) => !item.ok);
      if (firstInvalid || !window.ClaudeChat) {
        checks.forEach((item) => {
          if (!item.ok) {
            showFieldError(item.target, "This field is required");
          }
        });
        if (firstInvalid?.target?.scrollIntoView) {
          firstInvalid.target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      contentGenerateBtn.disabled = true;
      contentGenerateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Generating your content...`;
      contentResultWrap.classList.remove("hidden");
      if (contentResultBody) {
        contentResultBody.innerHTML = `<div class="cg-loading"><span class="typing-indicator"><span></span><span></span><span></span></span></div>`;
      }
      try {
        const output = await window.ClaudeChat.generateContentResponse(payload);
        renderContentGeneratorOutput(output);
        saveContentHistory(payload, output);
      } catch (error) {
        if (contentResultBody) {
          contentResultBody.textContent = "Something went wrong. Please try again.";
        }
      } finally {
        contentGenerateBtn.disabled = false;
        contentGenerateBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Generate Content`;
      }
    });
    contentCopyAllBtn.addEventListener("click", async () => {
      await navigator.clipboard.writeText(contentResultBody.innerText || contentResultBody.textContent || "");
      contentCopyAllBtn.textContent = "Copied";
      setTimeout(() => {
        contentCopyAllBtn.textContent = "Copy All";
      }, 1200);
    });
    contentResetBtn.addEventListener("click", resetContentForm);
    const renderWaOptions = (options) => {
      waReplyOptions = options;
      selectedWaOption = 0;
      if (!waResultBody) {
        return;
      }
      waResultBody.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "wa-options";
      options.forEach((opt, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = `wa-option-card tap-target${index === 0 ? " selected" : ""}`;
        card.innerHTML = `<div class="wa-option-label">${opt.label || `Option ${index + 1}`}</div><div>${escapeHtml(opt.text)}</div>${opt.score ? `<div class="wa-option-score">${escapeHtml(opt.score)}</div>` : ""}`;
        card.addEventListener("click", () => {
          selectedWaOption = index;
          wrap.querySelectorAll(".wa-option-card").forEach((c) => c.classList.remove("selected"));
          card.classList.add("selected");
          updateWaPreview(options[index].text);
        });
        wrap.appendChild(card);
      });
      waResultBody.appendChild(wrap);
      updateWaPreview(options[0]?.text || "");
    };

    const updateWaPreview = (text) => {
      if (!waPreview || !waPreviewBubble) {
        return;
      }
      if (!text) {
        waPreview.classList.add("hidden");
        return;
      }
      waPreview.classList.remove("hidden");
      waPreviewBubble.textContent = text;
    };

    waGenerateBtn.addEventListener("click", async () => {
      const customerMessage = waCustomerMessage.value.trim();
      const businessType = waBusinessType.value.trim();
      if (!customerMessage || !businessType || !window.ClaudeChat) {
        return;
      }
      const selectedIncludes = [
        waIncludePrice.checked ? "Price/offer details" : null,
        waIncludeCta.checked ? "Call to action" : null,
        waIncludePayment.checked ? "Payment details (Opay, Palmpay, Bank transfer)" : null,
        waIncludeDelivery.checked ? "Delivery information" : null
      ].filter(Boolean);

      waGenerateBtn.disabled = true;
      waGenerateBtn.textContent = "Generating...";
      waResultWrap.classList.remove("hidden");
      if (waPreview) {
        waPreview.classList.add("hidden");
      }
      if (waResultBody) {
        waResultBody.innerHTML = `<div class="wa-loading"><span class="typing-indicator"><span></span><span></span><span></span></span></div>`;
      }
      try {
        const output = await window.ClaudeChat.generateWhatsAppReply({
          customerMessage,
          businessType,
          tone: waTone.value,
          includes: selectedIncludes
        });
        renderWaOptions(Array.isArray(output) ? output : [{ text: output, score: "", label: "Option 1" }]);
      } catch (error) {
        if (waResultBody) {
          waResultBody.textContent = "Something went wrong. Please try again.";
        }
      } finally {
        waGenerateBtn.disabled = false;
        waGenerateBtn.textContent = "Generate Reply";
      }
    });
    waCopyBtn.addEventListener("click", async () => {
      const selected = waReplyOptions[selectedWaOption];
      const txt = selected?.text || waResultBody?.textContent || "";
      await navigator.clipboard.writeText(txt);
      waCopyBtn.textContent = "Copied";
      setTimeout(() => {
        waCopyBtn.textContent = "Copy";
      }, 1500);
    });
    waSendBtn.addEventListener("click", () => {
      const selected = waReplyOptions[selectedWaOption];
      const txt = selected?.text || "";
      if (!txt) {
        return;
      }
      window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
    });
    attachBtn.addEventListener("click", () => {
      attachMenu.classList.toggle("hidden");
    });
    uploadImageBtn.addEventListener("click", () => {
      fileUploadInput.setAttribute("accept", "image/*");
      fileUploadInput.removeAttribute("capture");
      attachMenu.classList.add("hidden");
      fileUploadInput.click();
    });
    uploadFileBtn.addEventListener("click", () => {
      fileUploadInput.setAttribute("accept", ".pdf,.doc,.docx,.txt");
      fileUploadInput.removeAttribute("capture");
      attachMenu.classList.add("hidden");
      fileUploadInput.click();
    });
    takePhotoBtn.addEventListener("click", () => {
      fileUploadInput.setAttribute("accept", "image/*");
      fileUploadInput.setAttribute("capture", "camera");
      attachMenu.classList.add("hidden");
      fileUploadInput.click();
    });
    fileUploadInput.addEventListener("change", async () => {
      const file = fileUploadInput.files && fileUploadInput.files[0];
      if (!file) {
        return;
      }
      const isImage = file.type.startsWith("image/");
      let base64Data = "";
      let previewUrl = "";
      if (isImage) {
        const dataUrl = await readAsDataUrl(file);
        previewUrl = dataUrl;
        base64Data = dataUrl.split(",")[1] || "";
      }
      pendingAttachment = { file, isImage, base64Data, previewUrl };
      renderAttachmentChip();
    });
    document.addEventListener("click", (event) => {
      if (!attachMenu.contains(event.target) && !attachBtn.contains(event.target)) {
        attachMenu.classList.add("hidden");
      }
    });

    window.ClaudeInputAPI = {
      sendFromOutside: (text) => {
        input.value = text;
        resizeInput();
        syncSendState();
        send(text);
      },
      insertText: (text) => {
        input.value = text;
        resizeInput();
        syncSendState();
        input.focus();
      }
    };

    if (window.visualViewport && inputShell) {
      const adjustInputForKeyboard = () => {
        const viewport = window.visualViewport;
        const keyboardHeight = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
        inputShell.style.bottom = `${keyboardHeight}px`;
      };
      window.visualViewport.addEventListener("resize", adjustInputForKeyboard);
      window.visualViewport.addEventListener("scroll", adjustInputForKeyboard);
      adjustInputForKeyboard();
    }

    resizeInput();
    syncSendState();
    if (window.ClaudeChat) {
      window.ClaudeChat.setNaijaMode(false);
      if (window.ClaudeFeatures?.getNaijaPrefs) {
        window.ClaudeChat.setNaijaContext(window.ClaudeFeatures.getNaijaPrefs());
      }
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    applySavedTheme();
    setGreeting();
    setupInput();
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  });
})();
