# Claude Clone — Built for the Nigerian Market

A pixel-perfect Claude AI chat interface clone with real AI 
integration and three powerful features built specifically 
for Nigerian entrepreneurs, marketers, and business owners.

Built by: Bamidele Matthew — github.com/bamson-dev

---

Live app: https://claude-clone.onrender.com/

---

## What Makes This Different From a Regular Claude Clone

Most Claude clones are just UI copies with no real functionality.
This one is different. It has three features that do not exist 
on the real Claude:

### 1. Naija Mode
Switches Claude's entire thinking to Nigerian context.
Responses reference naira pricing, Lagos and Abuja situations,
Nigerian brands, hustle culture, and local market dynamics.
Applies Akin Alabi's 'How to Sell to Nigerians' framework 
automatically when writing any marketing or business content.
Toggle it on with one click. Toggle it off the same way.

### 2. WhatsApp Business Reply Generator
Nigerian businesses run on WhatsApp.
Paste any customer message, select your business type and tone,
and get a professional, conversion-focused reply in seconds.
Supports four tones: Professional English, Friendly Pidgin,
Formal Corporate, and Naija Warm and Personal.
Includes payment details (Opay, Palmpay, Bank transfer),
call to action, and delivery information options.
Generated reply opens directly in WhatsApp with one click.

### 3. Naija Content Generator
Generates ready-to-publish social media content for 
Nigerian businesses across six platforms simultaneously.
Powered by Claude Sonnet with a deep Nigerian marketing 
system prompt built on Akin Alabi and Alex Hormozi frameworks.

Fill in seven simple questions:
- What you sell
- Who your ideal customer is
- Their age range
- Your price
- What you want people to do
- Which platforms
- What tone

Get back full platform-specific content for WhatsApp Status,
Instagram, Facebook, Twitter/X, TikTok, and LinkedIn.
Each platform includes a main post, three variations 
(emotion led, offer led, social proof led), posting strategy,
best time to post, engagement question, and hashtags.
Content is written at agency level, ready to run as a paid 
ad with zero editing.

---

## Core Chat Features

- Real AI responses powered by Claude Sonnet
- Full conversation memory within each session
- Word by word streaming response effect
- Proper markdown rendering: bold, italic, headers, 
  bullet points, numbered lists, code blocks
- Copy button on every Claude response
- Thumbs up and thumbs down on every response
- Pin any message to the top of the chat
- Regenerate any response with one click
- Conversation summary button for long chats
- Chat history saved to sidebar with search
- New chat creates fresh conversation
- Timestamps on every message
- File and image upload support
- Image analysis: attach any image and ask Claude about it

## Design Features

- Pixel-perfect Claude.ai UI replica
- Light and dark mode with localStorage persistence
- Fully responsive: works on iPhone, Android, tablet, desktop
- Mobile bottom navigation
- Smooth sidebar overlay on mobile
- Bottom sheet panels on mobile
- All touch targets minimum 44px
- No horizontal overflow on any screen size

---

## Tech Stack

- HTML5
- CSS3 (mobile-first, custom CSS variables)
- Vanilla JavaScript (no frameworks)
- Claude Sonnet API (Anthropic)
- Font Awesome 6 (icons)

---

## Project Structure

claude-clone/
├── index.html
├── css/
│   ├── main.css
│   ├── sidebar.css
│   ├── chat.css
│   ├── input.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── sidebar.js
│   ├── chat.js
│   └── responses.js
└── assets/
    └── icons/

-

## Render Deployment

### Run locally

```bash
npm start
```

The server runs on `PORT` (default `3000`).

### Environment variables

Set these in Render (or `.env` locally):

- `PORT` - provided by Render automatically.
- `AI_PROVIDER` - `auto` (default), `anthropic`, or `deepseek`.
- `ANTHROPIC_API_KEY` - required if provider is `anthropic` or fallback in `auto`.
- `DEEPSEEK_API_KEY` - required if provider is `deepseek` or fallback in `auto`.

You only need one key if you pin `AI_PROVIDER` to that provider.

### Deploy with Blueprint (recommended)

This repo includes a `render.yaml` Blueprint. One-click setup:

1. Push this repo to GitHub.
2. Open [Create a new Blueprint on Render](https://dashboard.render.com/blueprint/new?repo=https://github.com/Bamson-dev/Claude-clone-).
3. Review the service config and click **Apply**.
4. When prompted, add secret environment variables:
   - `ANTHROPIC_API_KEY` (if using Anthropic)
   - `DEEPSEEK_API_KEY` (if using DeepSeek)
5. Set `AI_PROVIDER` to `anthropic`, `deepseek`, or leave as `auto`.
6. Wait for the deploy to finish, then open your Render URL (default: `https://claude-clone.onrender.com`).

### Deploy manually (alternative)

1. In [Render Dashboard](https://dashboard.render.com/), click **New +** → **Web Service**.
2. Connect the GitHub repo `Bamson-dev/Claude-clone-`.
3. Configure:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/`
4. Add the environment variables listed above.
5. Click **Create Web Service**.

### Notes

- Never commit real API keys to GitHub.
- `.env` is ignored by `.gitignore`.
- If no valid provider key is set, the app returns: `No configured AI provider is available`.
- On Render's free tier, the service sleeps after ~15 minutes of inactivity. The first request after sleep may take 30–60 seconds to wake up.
