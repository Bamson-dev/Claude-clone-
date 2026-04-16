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

  const historyData = {
    Today: [],
    Yesterday: [
      { id: "seed-1", title: "How to pitch a monthly retainer", static: true },
      { id: "seed-2", title: "JavaScript debounce explained", static: true },
      { id: "seed-3", title: "Website copy for local clinic", static: true },
      { id: "seed-4", title: "Cold email teardown and rewrite", static: true },
      { id: "seed-5", title: "How to productize my service", static: true }
    ]
  };

  const conversationMap = new Map();
  let activeItem = null;
  let onConversationSelect = null;

  function truncateTitle(title) {
    if (title.length <= 40) return title;
    return `${title.slice(0, 40).trimEnd()}...`;
  }

  function setActiveItem(item) {
    document.querySelectorAll(".history-item.active").forEach((entry) => {
      entry.classList.remove("active");
    });
    item.classList.add("active");
    activeItem = item;
  }

  function createHistoryItemFromObject(conversation, shouldActivate) {
    const item = document.createElement("button");
    item.className = "history-item tap-target";
    item.type = "button";
    item.dataset.conversationId = conversation.id;
    item.innerHTML = `<span aria-hidden="true">💬</span><span class="history-title">${truncateTitle(conversation.title)}</span><span class="dots" aria-hidden="true">⋯</span>`;
    item.addEventListener("click", () => {
      setActiveItem(item);
      if (window.ClaudeSidebar) window.ClaudeSidebar.close();
      if (!conversation.static && typeof onConversationSelect === "function") {
        onConversationSelect(conversation.id);
      }
    });
    if (shouldActivate) {
      item.classList.add("active");
      activeItem = item;
    }
    return item;
  }

  function renderHistory() {
    const list = document.getElementById("conversationList");
    if (!list) return;
    list.innerHTML = "";
    Object.entries(historyData).forEach(([label, items]) => {
      const section = document.createElement("div");
      const sectionLabel = document.createElement("p");
      sectionLabel.className = "history-label";
      sectionLabel.textContent = label;
      section.appendChild(sectionLabel);
      items.forEach((entry, index) => {
        section.appendChild(createHistoryItemFromObject(entry, label === "Today" && index === 0));
      });
      list.appendChild(section);
    });
  }

  function addConversation(conversation) {
    conversationMap.set(conversation.id, conversation);
    const existingIdx = historyData.Today.findIndex((entry) => entry.id === conversation.id);
    if (existingIdx >= 0) {
      historyData.Today[existingIdx] = conversation;
    } else {
      historyData.Today.unshift(conversation);
    }

    const list = document.getElementById("conversationList");
    const todayLabel = Array.from(list.querySelectorAll(".history-label")).find(
      (label) => label.textContent === "Today"
    );
    if (!todayLabel) {
      renderHistory();
      return;
    }
    const todaySection = todayLabel.parentElement;
    const existingItem = todaySection.querySelector(`[data-conversation-id="${conversation.id}"]`);
    const previousActive = activeItem;
    const newItem = createHistoryItemFromObject(conversation, true);
    if (existingItem) {
      existingItem.replaceWith(newItem);
    } else {
      todaySection.insertBefore(newItem, todayLabel.nextSibling);
    }
    if (previousActive && previousActive !== newItem) {
      previousActive.classList.remove("active");
    }
  }

  function setActiveById(id) {
    const list = document.getElementById("conversationList");
    const item = list.querySelector(`[data-conversation-id="${id}"]`);
    if (item) setActiveItem(item);
  }

  function getConversationById(id) {
    return conversationMap.get(id) || null;
  }

  function registerConversationSelect(handler) {
    onConversationSelect = handler;
  }

  function bindSidebarToggles() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    const hamburger = document.getElementById("hamburgerBtn");
    const closeBtn = document.getElementById("sidebarClose");

    if (!sidebar || !backdrop || !hamburger || !closeBtn) return;

    let sidebarOpen = false;

    const open = () => {
      if (sidebarOpen) return;
      sidebarOpen = true;
      sidebar.classList.add("open");
      backdrop.classList.add("visible");
      document.body.style.overflow = "hidden";
    };

    const close = () => {
      if (!sidebarOpen) return;
      sidebarOpen = false;
      sidebar.classList.remove("open");
      backdrop.classList.remove("visible");
      document.body.style.overflow = "";
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
      registerConversationSelect
    };
  }

  window.addEventListener("DOMContentLoaded", () => {
    renderHistory();
    bindSidebarToggles();
  });
})();
