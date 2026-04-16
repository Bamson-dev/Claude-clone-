(function chatModule() {
  const WORKER_URL = "https://claude-proxy.bamzonline01.workers.dev/";
  const conversationHistory = [];
  const naijaSystemPrompt = `You are Claude operating in Naija Mode.

LANGUAGE RULE - CRITICAL:
Respond in clear, confident English by default.
Do not use Pidgin unless the user writes to you in Pidgin or explicitly asks for a Pidgin response.
Naija Mode means Nigerian context and perspective, not Pidgin language.

In Naija Mode you:
- Use naira instead of dollars for all pricing examples
- Reference Nigerian cities: Lagos, Abuja, Port Harcourt, Kano
- Use Nigerian brands, businesses, and services as examples
- Reference Nigerian cultural situations: hustle culture, family obligations, power cuts, traffic, social events
- Understand Nigerian business context and market dynamics
- Apply Akin Alabi framework when writing any marketing or sales content: Story Method, Fear technique, Awoof positioning, Giant Promise
- Reference Nigerian social media behaviour and platforms
- Understand your user is likely a Nigerian entrepreneur, marketer, or professional who wants smart practical help

You do NOT:
- Automatically write in Pidgin
- Use slang unless the conversation calls for it
- Assume the user wants informal communication
- Add unnecessary Nigerian expressions to every sentence

Respond the way a sharp, educated Nigerian professional communicates with a peer: clear, direct, intelligent, with full Nigerian context where relevant.`;

  const whatsappSystemPrompt = `You are a WhatsApp business communication expert for Nigerian small and medium businesses. Generate professional, warm, and conversion-focused WhatsApp reply messages. Understand that Nigerian customers respond better to personalized, friendly messages that feel human, not robotic. Always end with a clear next step. Use the tone requested. If Friendly Pidgin is selected, use Nigerian Pidgin naturally. Include relevant emojis where appropriate for WhatsApp context since emojis are normal and expected in Nigerian WhatsApp business communication.`;

  const contentGenSystemPrompt = `You are the highest-level Nigerian marketing copywriter alive. You have mastered Akin Alabi's 'How to Sell to Nigerians', Alex Hormozi's $100M Offers framework, Gary Halbert's copywriting principles, and David Ogilvy's advertising wisdom. You apply all of these through a deeply Nigerian cultural lens.

You understand Nigerian buyers at a psychological level:
- They buy based on emotion first, logic second
- They need to see themselves in the story before they trust
- They are skeptical of hype but respond to specific proof
- They respect confidence and directness
- They want to feel smart for buying, not pressured
- Social status, family respect, financial freedom, and avoiding shame are the deepest motivators
- They share content that makes them look smart or relatable
- Naira amounts make it real. Dollar amounts feel foreign.
- Lagos, Abuja, PH references make it local and trusted

LANGUAGE RULE - NON NEGOTIABLE:
Write in clear, confident, professional English.
No Pidgin unless the tone selected is Funny and Relatable.
Nigerian context does not mean Pidgin language.
Nigerian means: naira pricing, Nigerian city references, Nigerian names, Nigerian situations, Nigerian psychology.
The writing stays sharp, clear English throughout.

TONE FRAMEWORKS - apply strictly:

Akin Alabi Style:
- Open with a specific story about a real-feeling Nigerian person in a situation your audience recognizes
- Never name the product in the first 3 sentences
- Build the pain and desire before revealing anything
- Giant Promise: state the single biggest transformation the product creates
- Fear of loss: paint a clear picture of life without this product continuing to get worse
- Awoof positioning: make the price feel like a steal compared to the value
- Stack at least 3 specific benefits before price
- Reveal price with confidence, not apology
- End with a deadline or scarcity that feels real
- CTA is confident and direct, not begging

Professional:
- Lead with the strongest benefit or result
- Use specific numbers and facts wherever possible
- No hype words: amazing, incredible, life-changing
- Credibility signals: years in business, number of customers, specific results achieved
- Clean structure: problem, solution, proof, CTA
- Tone of a trusted expert, not a salesperson

Emotional:
- Open with a painful situation the reader knows deeply
- Describe the feeling of that pain specifically
- Show the transformation: before and after
- Use Nigerian family values: providing for parents, respecting yourself, being the person others look up to
- Let the reader imagine their life after
- Soft CTA that feels like an invitation not a push

Hype and Energetic:
- Bold opening, all caps used sparingly for emphasis
- Short punchy sentences, maximum energy
- Create FOMO in every line
- Stack benefits rapidly
- Make inaction feel like a loss
- Hard urgent CTA

Funny and Relatable:
- Open with a situation everyone has experienced and laughed at
- Self-aware Nigerian humor: NEPA, Lagos traffic, sapa, oga at the top, village people
- Light Pidgin acceptable here only
- Make them laugh then smoothly transition to the offer
- CTA should also have a light touch of humor

Urgent and Scarce:
- Specific numbers: not limited stock but 7 pieces left
- Real deadlines: not offer ends soon but Friday 11:59pm
- Show what they lose if they wait
- Testimonial or proof point mid-copy to maintain trust
- Hard deadline CTA, no soft language

PLATFORM RULES - follow exactly for every platform selected:

WhatsApp Status:
- Maximum 5 short lines total
- Each line punchy and standalone
- Line breaks between every line
- No paragraphs
- Ends with one clear CTA: DM, link, or number
- Emojis used sparingly and purposefully, max 3 total
- Must be readable in 5 seconds

Instagram Caption:
- First line is the hook. Must stop the scroll. No generic openers. Make it specific and surprising.
- Lines 2-6: build the story or desire
- Lines 7-8: the offer and price
- Line 9: CTA (Link in bio, DM the word X, Comment below)
- Empty line before hashtags
- 15-20 hashtags: mix of Nigerian niche, location, and topic tags
- Total length: 150-250 words before hashtags

Facebook Post:
- Longer storytelling format, 4-6 paragraphs
- Opens with a story or bold statement
- Paragraph 2: the problem or desire
- Paragraph 3: the solution and how it works
- Paragraph 4: proof, testimonial, or result
- Paragraph 5: the offer, price, and value stack
- Paragraph 6: CTA and how to buy
- Ends with an engagement question to drive comments
- No hashtags on Facebook
- Total: 250-400 words

Twitter/X Thread:
- 6 tweets minimum
- Tweet 1: The hook. Bold claim or surprising fact.
- Tweets 2-4: Build the story or argument
- Tweet 5: The offer or product reveal
- Tweet 6: CTA with link or DM instruction
- Each tweet standalone but connected
- Number each tweet: 1/ 2/ 3/ etc
- Max 280 characters per tweet
- No hashtags until last tweet

TikTok:
- Video script format
- Hook (0-3 seconds): One sentence to stop the scroll
- Problem (3-10 seconds): Relate to their pain
- Solution (10-25 seconds): Show the product or service
- Proof (25-40 seconds): Result or testimonial
- CTA (40-60 seconds): Clear action to take
- Caption: 2-3 lines max plus 5 relevant hashtags

LinkedIn:
- Professional thought leadership angle
- Opens with a counterintuitive insight or bold statement
- Paragraph 2: The problem in the market
- Paragraph 3: Your approach or solution
- Paragraph 4: Specific result or case study
- Paragraph 5: The offer or CTA framed professionally
- No emojis except sparingly
- 3-5 relevant professional hashtags at end
- Total: 200-300 words`;

  const state = {
    started: false,
    currentStream: null,
    naijaModeActive: false,
    activeConversationId: null
  };
  const conversations = new Map();

  const escapeHtml = (value) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const parseMarkdown = (markdown) => {
    const codeBlocks = [];
    let text = markdown.replace(/```([\s\S]*?)```/g, (_, code) => {
      const token = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(`<div class="code-wrap"><button class="copy-code-btn" type="button">Copy</button><pre><code>${escapeHtml(code.trim())}</code></pre></div>`);
      return token;
    });

    text = escapeHtml(text);
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

    const paragraphs = text.split(/\n\n+/).map((block) => {
      const trimmedBlock = block.trim();
      if (/^###\s+/.test(trimmedBlock)) {
        return `<h3>${trimmedBlock.replace(/^###\s+/, "")}</h3>`;
      }
      if (/^##\s+/.test(trimmedBlock)) {
        return `<h2>${trimmedBlock.replace(/^##\s+/, "")}</h2>`;
      }
      if (/^#\s+/.test(trimmedBlock)) {
        return `<h1>${trimmedBlock.replace(/^#\s+/, "")}</h1>`;
      }
      if (/^-\s/m.test(trimmedBlock)) {
        const items = block
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => `<li>${line.replace(/^-+\s*/, "")}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      if (/^\d+\.\s/m.test(trimmedBlock)) {
        const items = block
          .split("\n")
          .filter((line) => /^\d+\.\s/.test(line.trim()))
          .map((line) => `<li>${line.replace(/^\d+\.\s*/, "")}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }
      return `<p>${trimmedBlock.replace(/\n/g, "<br>")}</p>`;
    });

    let html = paragraphs.join("");
    codeBlocks.forEach((block, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, block);
    });
    return html;
  };

  function getActiveConversation() {
    if (!state.activeConversationId) return null;
    return conversations.get(state.activeConversationId) || null;
  }

  function formatTitle(text) {
    return text.length <= 40 ? text : `${text.slice(0, 40).trimEnd()}...`;
  }

  function ensureConversationForMessage(userMessage) {
    let active = getActiveConversation();
    if (!active) {
      const id = Date.now().toString();
      active = { id, title: formatTitle(userMessage), messages: [] };
      conversations.set(id, active);
      state.activeConversationId = id;
      if (window.ClaudeSidebar) window.ClaudeSidebar.addConversation(active);
    }
    return active;
  }

  async function fetchClaude(payload, retries = 1) {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok && retries > 0 && response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 900));
      return fetchClaude(payload, retries - 1);
    }
    return response;
  }

  async function requestClaude(userMessage, attachment) {
    let userContent = userMessage;
    if (attachment && attachment.type && attachment.base64Data) {
      userContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: attachment.type,
            data: attachment.base64Data
          }
        },
        {
          type: "text",
          text: userMessage || "What is in this image?"
        }
      ];
    }
    conversationHistory.push({ role: "user", content: userContent });
    const response = await fetchClaude({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: state.naijaModeActive ? naijaSystemPrompt : undefined,
      messages: conversationHistory
    });

    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    const reply = data?.content?.[0]?.text || "Something went wrong. Please check your connection and try again.";
    conversationHistory.push({ role: "assistant", content: reply });
    return reply;
  }

  function getEls() {
    return {
      empty: document.getElementById("chatEmptyState"),
      messages: document.getElementById("chatMessages"),
      chatMain: document.getElementById("chatMain"),
      pinnedStrip: document.getElementById("pinnedStrip"),
      pinnedText: document.getElementById("pinnedText")
    };
  }

  function showConversation() {
    const { empty, messages } = getEls();
    state.started = true;
    empty.classList.add("hidden");
    messages.classList.remove("hidden");
  }

  function scrollToBottom() {
    const { chatMain } = getEls();
    chatMain.scrollTo({ top: chatMain.scrollHeight, behavior: "smooth" });
  }

  function appendUserMessage(text) {
    showConversation();
    const { messages } = getEls();
    const row = document.createElement("div");
    row.className = "message-row user";
    row.innerHTML = `<div class="user-bubble">${escapeHtml(text)}</div><div class="message-timestamp user-timestamp">${formatTimestamp(new Date())}</div>`;
    messages.appendChild(row);
    scrollToBottom();
    const active = getActiveConversation();
    if (active) {
      active.messages.push({ role: "user", content: text, timestamp: new Date().toISOString() });
      if (window.ClaudeSidebar) window.ClaudeSidebar.addConversation(active);
    }
  }

  function appendTypingIndicator() {
    const { messages } = getEls();
    const row = document.createElement("div");
    row.className = "message-row assistant";
    row.id = "typingRow";
    row.innerHTML = `<div class="assistant-head"><span class="diamond-icon"></span><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    messages.appendChild(row);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const typing = document.getElementById("typingRow");
    if (typing) typing.remove();
  }

  function formatTimestamp(dateObj) {
    return dateObj.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  }

  function attachAssistantActions(root) {
    root.querySelectorAll(".copy-code-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.parentElement.querySelector("code");
        navigator.clipboard.writeText(code.textContent || "");
      });
    });
    root.querySelectorAll(".action-copy").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const rawText = root.dataset.rawText || "";
        await navigator.clipboard.writeText(rawText);
        const icon = btn.querySelector("i");
        if (!icon) return;
        icon.className = "fa-solid fa-check";
        setTimeout(() => { icon.className = "fa-regular fa-copy"; }, 2000);
      });
    });
    root.querySelectorAll(".action-like").forEach((btn) => {
      btn.addEventListener("click", () => {
        const dislike = root.querySelector(".action-dislike");
        const likeIcon = btn.querySelector("i");
        const dislikeIcon = dislike.querySelector("i");
        btn.classList.add("active-like");
        dislike.classList.remove("active-dislike");
        likeIcon.className = "fa-solid fa-thumbs-up";
        dislikeIcon.className = "fa-regular fa-thumbs-down";
      });
    });
    root.querySelectorAll(".action-dislike").forEach((btn) => {
      btn.addEventListener("click", () => {
        const like = root.querySelector(".action-like");
        const likeIcon = like.querySelector("i");
        const dislikeIcon = btn.querySelector("i");
        btn.classList.add("active-dislike");
        like.classList.remove("active-like");
        dislikeIcon.className = "fa-solid fa-thumbs-down";
        likeIcon.className = "fa-regular fa-thumbs-up";
      });
    });
    root.querySelectorAll(".action-pin").forEach((btn) => {
      btn.addEventListener("click", () => {
        const active = getActiveConversation();
        if (!active) return;
        active.pinnedMessage = root.dataset.rawText || "";
        updatePinnedUI(active);
        refreshPinStates();
      });
    });
  }

  function refreshPinStates() {
    const active = getActiveConversation();
    const pinned = active?.pinnedMessage || "";
    document.querySelectorAll(".message-row.assistant").forEach((row) => {
      const pinBtn = row.querySelector(".action-pin");
      const pinIcon = row.querySelector(".action-pin i");
      if (!pinBtn || !pinIcon) return;
      if (pinned && row.dataset.rawText === pinned) {
        pinBtn.classList.add("active-pin");
        pinIcon.className = "fa-solid fa-thumbtack";
      } else {
        pinBtn.classList.remove("active-pin");
        pinIcon.className = "fa-regular fa-thumbtack";
      }
    });
  }

  function updatePinnedUI(conversation) {
    const { pinnedStrip, pinnedText } = getEls();
    if (!pinnedStrip || !pinnedText) return;
    if (conversation && conversation.pinnedMessage) {
      pinnedText.textContent = conversation.pinnedMessage;
      pinnedStrip.classList.remove("hidden");
    } else {
      pinnedText.textContent = "";
      pinnedStrip.classList.add("hidden");
    }
  }

  function appendAssistantStream(fullText) {
    const { messages } = getEls();
    const row = document.createElement("div");
    row.className = "message-row assistant";
    row.dataset.rawText = fullText;
    row.innerHTML = `<div class="assistant-head"><span class="diamond-icon"></span><div class="assistant-content"></div></div><div class="message-actions"><button class="action-copy" aria-label="Copy"><i class="fa-regular fa-copy"></i></button><button class="action-like" aria-label="Thumbs up"><i class="far fa-thumbs-up"></i></button><button class="action-dislike" aria-label="Thumbs down"><i class="far fa-thumbs-down"></i></button><button class="action-pin" aria-label="Pin"><i class="fa-regular fa-thumbtack"></i></button></div><div class="message-timestamp assistant-timestamp">${formatTimestamp(new Date())}</div>`;
    messages.appendChild(row);

    const content = row.querySelector(".assistant-content");
    const words = fullText.split(" ");
    let idx = 0;
    const active = getActiveConversation();
    const timestamp = new Date().toISOString();
    const stream = setInterval(() => {
      idx += 1;
      const partial = words.slice(0, idx).join(" ");
      content.innerHTML = parseMarkdown(partial);
      scrollToBottom();
      if (idx >= words.length) {
        clearInterval(stream);
        state.currentStream = null;
        attachAssistantActions(row);
        if (active) {
          active.messages.push({ role: "assistant", content: fullText, timestamp });
          if (window.ClaudeSidebar) window.ClaudeSidebar.addConversation(active);
        }
        refreshPinStates();
      }
    }, 40);
    state.currentStream = stream;
  }

  async function sendMessage(text, attachment) {
    ensureConversationForMessage(text);
    appendUserMessage(text);
    appendTypingIndicator();
    let responseText = "Something went wrong. Please check your connection and try again.";
    try {
      responseText = await requestClaude(text, attachment);
    } catch (error) {
      responseText = "Something went wrong. Please check your connection and try again.";
    } finally {
      removeTypingIndicator();
      appendAssistantStream(responseText);
    }
  }

  function renderConversationMessages(conversation) {
    const { empty, messages } = getEls();
    messages.innerHTML = "";
    if (!conversation || conversation.messages.length === 0) {
      messages.classList.add("hidden");
      empty.classList.remove("hidden");
      state.started = false;
      return;
    }
    state.started = true;
    empty.classList.add("hidden");
    messages.classList.remove("hidden");
    conversation.messages.forEach((msg) => {
      if (msg.role === "user") {
        const row = document.createElement("div");
        row.className = "message-row user";
        row.innerHTML = `<div class="user-bubble">${escapeHtml(msg.content)}</div><div class="message-timestamp user-timestamp">${formatTimestamp(new Date(msg.timestamp || Date.now()))}</div>`;
        messages.appendChild(row);
      } else {
        const row = document.createElement("div");
        row.className = "message-row assistant";
        row.dataset.rawText = msg.content;
        row.innerHTML = `<div class="assistant-head"><span class="diamond-icon"></span><div class="assistant-content">${parseMarkdown(msg.content)}</div></div><div class="message-actions"><button class="action-copy" aria-label="Copy"><i class="fa-regular fa-copy"></i></button><button class="action-like" aria-label="Thumbs up"><i class="far fa-thumbs-up"></i></button><button class="action-dislike" aria-label="Thumbs down"><i class="far fa-thumbs-down"></i></button><button class="action-pin" aria-label="Pin"><i class="fa-regular fa-thumbtack"></i></button></div><div class="message-timestamp assistant-timestamp">${formatTimestamp(new Date(msg.timestamp || Date.now()))}</div>`;
        messages.appendChild(row);
        attachAssistantActions(row);
      }
    });
    updatePinnedUI(conversation);
    refreshPinStates();
    scrollToBottom();
  }

  function loadConversation(id) {
    if (!id) return;
    const conversation = conversations.get(id) || (window.ClaudeSidebar ? window.ClaudeSidebar.getConversationById(id) : null);
    if (!conversation) return;
    conversations.set(id, conversation);
    state.activeConversationId = id;
    conversationHistory.length = 0;
    conversation.messages.forEach((msg) => {
      conversationHistory.push({ role: msg.role, content: msg.content });
    });
    renderConversationMessages(conversation);
    if (window.ClaudeSidebar) window.ClaudeSidebar.setActiveById(id);
  }

  async function generateContentResponse(payload) {
    const extraDetails = payload.extra && payload.extra.trim().length > 0 ? payload.extra.trim() : "None";
    const platformsList = payload.platforms.join(", ");
    const response = await fetchClaude({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: contentGenSystemPrompt,
      messages: [{
        role: "user",
        content: `Create high-converting Nigerian social media content:

Product/Service: ${payload.sell}
Ideal Customer: ${payload.idealCustomer}
Customer Age Range: ${payload.ageRanges.join(", ")}
Price: ${payload.price}
Goal: ${payload.goal}
Platforms: ${platformsList}
Tone: ${payload.tone}
Extra Details: ${extraDetails}

CRITICAL: Generate complete full-length content for EVERY SINGLE platform listed above. Do not skip any platform. Do not summarise. Write the complete full content for each as if it will be used immediately today.

For each platform deliver:
1. MAIN POST - complete ready to publish copy
2. THREE VARIATIONS:
   Variation A: Emotion and story led
   Variation B: Direct offer and price led
   Variation C: Social proof and results led
3. POSTING STRATEGY:
   - Best time to post for Nigerian audience
   - First comment to drop immediately after posting
   - One engagement question to add to the post
4. HASHTAGS - Instagram and TikTok only, 15-20 tags

Separate each platform section with this exact divider:
===PLATFORM NAME===

Write at the level of a N500,000 agency brief.
Every word must earn its place.
This content must be ready to run as a paid ad with zero editing needed.`
      }]
    });
    if (!response.ok) throw new Error("Content generation failed");
    const data = await response.json();
    return data?.content?.[0]?.text || "Something went wrong. Please try again.";
  }

  async function generateWhatsAppReply(payload) {
    const response = await fetchClaude({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: whatsappSystemPrompt,
      messages: [{
        role: "user",
        content: `Generate a WhatsApp business reply for a ${payload.businessType} business. Customer message: "${payload.customerMessage}". Tone: ${payload.tone}. Include: ${payload.includes.join(", ")}. Make it sound human, warm, and drive the customer toward buying or taking the next step.`
      }]
    });
    if (!response.ok) throw new Error("WhatsApp generation failed");
    const data = await response.json();
    return data.content[0].text;
  }

  function setGreeting() {
    const greeting = document.getElementById("greetingText");
    const hour = new Date().getHours();
    const timeLabel = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    greeting.textContent = `Good ${timeLabel}, Bamidele`;
  }

  function bindSuggestions() {
    document.querySelectorAll(".suggestion-card").forEach((card) => {
      card.addEventListener("click", () => {
        if (window.ClaudeInputAPI) {
          window.ClaudeInputAPI.sendFromOutside(card.textContent.trim());
        }
      });
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    setGreeting();
    bindSuggestions();
    if (window.ClaudeSidebar) {
      window.ClaudeSidebar.registerConversationSelect(loadConversation);
    }
    const pinnedClose = document.getElementById("pinnedClose");
    if (pinnedClose) {
      pinnedClose.addEventListener("click", () => {
        const active = getActiveConversation();
        if (!active) return;
        active.pinnedMessage = "";
        updatePinnedUI(active);
        refreshPinStates();
      });
    }
    window.ClaudeChat = {
      sendMessage,
      loadConversation,
      renderMarkdown: parseMarkdown,
      setNaijaMode: (isActive) => { state.naijaModeActive = Boolean(isActive); },
      generateContentResponse,
      generateWhatsAppReply,
      resetConversation: () => {
        conversationHistory.length = 0;
        if (state.currentStream) {
          clearInterval(state.currentStream);
          state.currentStream = null;
        }
        state.activeConversationId = null;
        state.started = false;
        updatePinnedUI(null);
      }
    };
  });
})();
