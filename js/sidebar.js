(function sidebarModule() {
  if (!window.__claudeScrollLock) {
    let scrollLockCount = 0;
    window.__claudeScrollLock = {
      acquire() {
        scrollLockCount += 1;
        if (scrollLockCount === 1) {
          document.body.style.overflow = "hidden";
        }
      },
      release() {
        scrollLockCount = Math.max(0, scrollLockCount - 1);
        if (scrollLockCount === 0) {
          document.body.style.overflow = "";
        }
      }
    };
  }

  const STORAGE_KEY = "claude_conversations_v2";
  const conversationMap = new Map();
  let activeItem = null;
  let onConversationSelect = null;
  let activeFilter = "all";

  const seedConversations = [
    { id: "seed-1", title: "How to pitch a monthly retainer", messages: [], static: true, updatedAt: Date.now() - 86400000 },
    { id: "seed-2", title: "JavaScript debounce explained", messages: [], static: true, updatedAt: Date.now() - 86400000 },
    { id: "seed-3", title: "Website copy for local clinic", messages: [], static: true, updatedAt: Date.now() - 86400000 },
    { id: "seed-4", title: "Cold email teardown and rewrite", messages: [], static: true, updatedAt: Date.now() - 86400000 },
    { id: "seed-5", title: "How to productize my service", messages: [], static: true, updatedAt: Date.now() - 86400000 }
  ];

  function normalizeConversation(raw) {
    return {
      id: raw.id,
      title: raw.title || "New chat",
      messages: Array.isArray(raw.messages) ? raw.messages : [],
      pinnedMessage: raw.pinnedMessage || "",
      static: Boolean(raw.static),
      updatedAt: raw.updatedAt || Date.now(),
      meta: {
        pinned: Boolean(raw.meta?.pinned),
        favorite: Boolean(raw.meta?.favorite),
        tags: Array.isArray(raw.meta?.tags) ? raw.meta.tags : []
      }
    };
  }

  function loadStoredConversations() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        seedConversations.forEach((c) => conversationMap.set(c.id, normalizeConversation(c)));
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        seedConversations.forEach((c) => conversationMap.set(c.id, normalizeConversation(c)));
        return;
      }
      parsed.forEach((item) => {
        conversationMap.set(item.id, normalizeConversation(item));
      });
    } catch (_) {
      seedConversations.forEach((c) => conversationMap.set(c.id, normalizeConversation(c)));
    }
  }

  function persistConversations() {
    const data = Array.from(conversationMap.values())
      .filter((c) => !c.static || c.messages.length > 0)
      .map((c) => ({
        id: c.id,
        title: c.title,
        messages: c.messages,
        pinnedMessage: c.pinnedMessage,
        updatedAt: c.updatedAt,
        meta: c.meta
      }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function truncateTitle(title) {
    if (title.length <= 40) {
      return title;
    }
    return `${title.slice(0, 40).trimEnd()}...`;
  }

  function isToday(ts) {
    return new Date(ts).toDateString() === new Date().toDateString();
  }

  function isYesterday(ts) {
    const d = new Date(ts);
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  }

  function groupConversations() {
    const all = Array.from(conversationMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    const pinned = [];
    const favorites = [];
    const today = [];
    const yesterday = [];
    const older = [];

    all.forEach((conv) => {
      if (conv.meta.pinned) {
        pinned.push(conv);
      } else if (conv.meta.favorite) {
        favorites.push(conv);
      } else if (isToday(conv.updatedAt)) {
        today.push(conv);
      } else if (isYesterday(conv.updatedAt)) {
        yesterday.push(conv);
      } else {
        older.push(conv);
      }
    });

    return { pinned, favorites, today, yesterday, older };
  }

  function setActiveItem(item) {
    document.querySelectorAll(".history-item.active").forEach((entry) => entry.classList.remove("active"));
    if (item) {
      item.classList.add("active");
      activeItem = item;
    }
  }

  function getSearchInput() {
    return document.getElementById("conversationSearch");
  }

  function matchesFilter(conversation) {
    if (activeFilter === "favorites") {
      return conversation.meta.favorite;
    }
    if (activeFilter === "pinned") {
      return conversation.meta.pinned;
    }
    return true;
  }

  function matchesSearch(conversation, query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return true;
    }
    const haystack = [conversation.title, ...(conversation.meta.tags || [])].join(" ").toLowerCase();
    return haystack.includes(normalized);
  }

  function filterHistory(query) {
    document.querySelectorAll(".history-item").forEach((item) => {
      const title = (item.dataset.conversationTitle || "").toLowerCase();
      const tags = (item.dataset.conversationTags || "").toLowerCase();
      const normalized = query.trim().toLowerCase();
      const filterOk = item.dataset.filterMatch !== "false";
      item.hidden = normalized ? !(title.includes(normalized) || tags.includes(normalized)) || !filterOk : !filterOk;
    });
    document.querySelectorAll(".conversation-groups > div").forEach((section) => {
      const visibleItems = section.querySelectorAll(".history-item:not([hidden])");
      const label = section.querySelector(".history-label");
      const hideSection = visibleItems.length === 0;
      if (label) {
        label.hidden = hideSection;
      }
      section.hidden = hideSection;
    });
  }

  function setSearchQuery(title, shouldFilter = false) {
    const searchInput = getSearchInput();
    if (!searchInput) {
      return;
    }
    searchInput.value = title;
    if (shouldFilter) {
      filterHistory(title);
    } else {
      filterHistory("");
    }
  }

  function toggleMeta(id, key) {
    const conv = conversationMap.get(id);
    if (!conv) {
      return;
    }
    conv.meta[key] = !conv.meta[key];
    conv.updatedAt = Date.now();
    conversationMap.set(id, conv);
    persistConversations();
    renderHistory();
    setActiveById(id);
  }

  function addTag(id, tag) {
    const conv = conversationMap.get(id);
    if (!conv || !tag) {
      return;
    }
    if (!conv.meta.tags.includes(tag)) {
      conv.meta.tags.push(tag);
      conv.updatedAt = Date.now();
      conversationMap.set(id, conv);
      persistConversations();
      renderHistory();
      setActiveById(id);
    }
  }

  function createHistoryItemFromObject(conversation, shouldActivate) {
    const item = document.createElement("div");
    item.className = "history-item tap-target";
    item.dataset.conversationId = conversation.id;
    item.dataset.conversationTitle = conversation.title;
    item.dataset.conversationTags = (conversation.meta.tags || []).join(" ");
    item.dataset.filterMatch = matchesFilter(conversation) ? "true" : "false";

    const mainBtn = document.createElement("button");
    mainBtn.type = "button";
    mainBtn.className = "history-main-btn";
    mainBtn.innerHTML = `<span class="history-icon" aria-hidden="true">${conversation.meta.pinned ? '<i class="fa-solid fa-thumbtack"></i>' : conversation.meta.favorite ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-message"></i>'}</span><span class="history-title">${truncateTitle(conversation.title)}</span>`;
    mainBtn.addEventListener("click", () => {
      setActiveItem(item);
      setSearchQuery(conversation.title, false);
      if (!conversation.static && typeof onConversationSelect === "function") {
        onConversationSelect(conversation.id);
      }
      if (window.innerWidth < 1024) {
        close();
      }
    });

    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.innerHTML = `
      <button type="button" class="item-action-btn pin-chat ${conversation.meta.pinned ? "active" : ""}" aria-label="Pin chat"><i class="fa-${conversation.meta.pinned ? "solid" : "regular"} fa-thumbtack"></i></button>
      <button type="button" class="item-action-btn fav-chat ${conversation.meta.favorite ? "active" : ""}" aria-label="Favorite chat"><i class="fa-${conversation.meta.favorite ? "solid" : "regular"} fa-star"></i></button>
      <button type="button" class="item-action-btn tag-chat" aria-label="Add tag"><i class="fa-solid fa-tag"></i></button>
    `;

    actions.querySelector(".pin-chat").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMeta(conversation.id, "pinned");
    });
    actions.querySelector(".fav-chat").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMeta(conversation.id, "favorite");
    });
    actions.querySelector(".tag-chat").addEventListener("click", (e) => {
      e.stopPropagation();
      const tag = window.prompt("Add tag:", "");
      if (tag) {
        addTag(conversation.id, tag.trim());
      }
    });

    item.appendChild(mainBtn);
    item.appendChild(actions);

    if (shouldActivate) {
      item.classList.add("active");
      activeItem = item;
    }
    return item;
  }

  function renderSection(label, items, list, activateFirst) {
    if (!items.length) {
      return;
    }
    const section = document.createElement("div");
    const sectionLabel = document.createElement("p");
    sectionLabel.className = "history-label";
    sectionLabel.textContent = label;
    section.appendChild(sectionLabel);
    items.forEach((entry, index) => {
      if (!matchesFilter(entry)) {
        return;
      }
      section.appendChild(createHistoryItemFromObject(entry, activateFirst && index === 0));
    });
    if (section.querySelector(".history-item")) {
      list.appendChild(section);
    }
  }

  function renderHistory() {
    const list = document.getElementById("conversationList");
    if (!list) {
      return;
    }
    const groups = groupConversations();
    const searchVal = getSearchInput()?.value || "";
    list.innerHTML = "";
    renderSection("Pinned", groups.pinned, list, false);
    renderSection("Favorites", groups.favorites, list, false);
    renderSection("Today", groups.today, list, true);
    renderSection("Yesterday", groups.yesterday, list, false);
    renderSection("Older", groups.older, list, false);
    filterHistory(searchVal);
  }

  function addConversation(conversation) {
    const normalized = normalizeConversation({
      ...conversationMap.get(conversation.id),
      ...conversation,
      updatedAt: Date.now()
    });
    conversationMap.set(normalized.id, normalized);
    persistConversations();
    renderHistory();
    setActiveById(normalized.id);
    return normalized;
  }

  function setActiveById(id) {
    const list = document.getElementById("conversationList");
    const item = list?.querySelector(`[data-conversation-id="${id}"]`);
    if (item) {
      setActiveItem(item);
    }
  }

  function getConversationById(id) {
    return conversationMap.get(id) || null;
  }

  function registerConversationSelect(handler) {
    onConversationSelect = handler;
  }

  function bindFilters() {
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        activeFilter = chip.dataset.filter || "all";
        renderHistory();
      });
    });
  }

  function bindSearchInput() {
    const searchInput = getSearchInput();
    if (!searchInput) {
      return;
    }
    let debounceTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => filterHistory(searchInput.value), 120);
    });
  }

  let close = () => {};

  function bindSidebarToggles() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const hamburger = document.getElementById("hamburgerBtn");
    const closeBtn = document.getElementById("sidebarClose");

    if (!sidebar || !backdrop || !hamburger || !closeBtn) {
      return;
    }

    let sidebarOpen = false;
    const open = () => {
      if (sidebarOpen) {
        return;
      }
      sidebarOpen = true;
      sidebar.classList.add("open");
      backdrop.classList.add("visible");
      window.__claudeScrollLock.acquire();
    };
    close = () => {
      if (!sidebarOpen) {
        return;
      }
      sidebarOpen = false;
      sidebar.classList.remove("open");
      backdrop.classList.remove("visible");
      window.__claudeScrollLock.release();
    };

    hamburger.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", close);

    window.ClaudeSidebar = {
      open,
      close,
      addConversation,
      setActiveById,
      getConversationById,
      registerConversationSelect,
      persistConversations,
      getAllConversations: () => Array.from(conversationMap.values())
    };
  }

  window.addEventListener("DOMContentLoaded", () => {
    loadStoredConversations();
    renderHistory();
    bindFilters();
    bindSearchInput();
    bindSidebarToggles();
  });
})();
