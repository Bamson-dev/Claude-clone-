const http = require("http");
const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const raw = fs.readFileSync(envPath, "utf8");
  raw.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }
    const idx = trimmed.indexOf("=");
    if (idx === -1) {
      return;
    }
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function logDebug(hypothesisId, location, message, data) {
  // #region agent log
  fetch("http://127.0.0.1:7259/ingest/2185d34f-051b-4338-86cb-b8c26904afa6", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "5fa845"
    },
    body: JSON.stringify({
      sessionId: "5fa845",
      runId: "backend-proxy",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion
}

function getAnthropicApiKey() {
  // Reload .env on-demand so long-running test servers pick up changes.
  loadEnvFile();
  return process.env.ANTHROPIC_API_KEY || "";
}

function getDeepSeekApiKey() {
  // Reload .env on-demand so long-running test servers pick up changes.
  loadEnvFile();
  return process.env.DEEPSEEK_API_KEY || "";
}

function getProviderPreference() {
  loadEnvFile();
  const provider = (process.env.AI_PROVIDER || "").trim().toLowerCase();
  if (provider === "deepseek" || provider === "anthropic") {
    return provider;
  }
  return "auto";
}

function normalizeMessageContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .filter((item) => item && item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
}

function toDeepSeekMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages.map((msg) => ({
    role: msg.role || "user",
    content: normalizeMessageContent(msg.content)
  }));
}

function mapDeepSeekModel(model) {
  if (typeof model !== "string" || !model.trim()) {
    return "deepseek-chat";
  }
  // Map Claude defaults sent by frontend to a DeepSeek model.
  if (model.includes("claude")) {
    return "deepseek-chat";
  }
  return model;
}

function mapStopReason(reason) {
  if (reason === "stop") {
    return "end_turn";
  }
  if (reason === "length") {
    return "max_tokens";
  }
  return reason || "end_turn";
}

async function callDeepSeek(payload, apiKey) {
  const deepSeekPayload = {
    model: mapDeepSeekModel(payload.model),
    messages: toDeepSeekMessages(payload.messages),
    max_tokens: payload.max_tokens || 700,
    temperature: typeof payload.temperature === "number" ? payload.temperature : undefined
  };
  const upstream = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(deepSeekPayload)
  });
  const upstreamText = await upstream.text();
  if (!upstream.ok) {
    return { upstream, responseText: upstreamText };
  }
  const data = JSON.parse(upstreamText);
  const assistantText = data?.choices?.[0]?.message?.content || "";
  const proxyResponse = {
    id: data?.id || `msg_${Date.now()}`,
    type: "message",
    role: "assistant",
    model: deepSeekPayload.model,
    content: [{ type: "text", text: assistantText }],
    stop_reason: mapStopReason(data?.choices?.[0]?.finish_reason),
    stop_sequence: null,
    usage: {
      input_tokens: data?.usage?.prompt_tokens || 0,
      output_tokens: data?.usage?.completion_tokens || 0
    }
  };
  return { upstream, responseText: JSON.stringify(proxyResponse) };
}

async function callAnthropic(payload, apiKey) {
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(payload)
  });
  return { upstream, responseText: await upstream.text() };
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Forbidden" }));
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/api/messages" && req.method === "OPTIONS") {
    // #region agent log
    logDebug("B4", "server.js:/api/messages:options", "Handled CORS preflight", {
      origin: req.headers.origin || null
    });
    // #endregion
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/messages") {
    try {
      const payload = await readJsonBody(req);
      const providerPreference = getProviderPreference();
      const ANTHROPIC_API_KEY = getAnthropicApiKey();
      const DEEPSEEK_API_KEY = getDeepSeekApiKey();
      const providerChain =
        providerPreference === "auto" ? ["deepseek", "anthropic"] : [providerPreference];
      // #region agent log
      logDebug("B1", "server.js:/api/messages:entry", "Proxy request received", {
        providerPreference,
        providerChain,
        hasAnthropicKey: Boolean(ANTHROPIC_API_KEY),
        hasDeepSeekKey: Boolean(DEEPSEEK_API_KEY),
        model: payload?.model || null,
        origin: req.headers.origin || null
      });
      // #endregion

      if (providerPreference === "deepseek" && !DEEPSEEK_API_KEY) {
        res.writeHead(500, { "Content-Type": "application/json", ...corsHeaders });
        res.end(JSON.stringify({ error: "Server missing DEEPSEEK_API_KEY" }));
        return;
      }

      if (providerPreference === "anthropic" && !ANTHROPIC_API_KEY) {
        res.writeHead(500, { "Content-Type": "application/json", ...corsHeaders });
        res.end(JSON.stringify({ error: "Server missing ANTHROPIC_API_KEY" }));
        return;
      }

      let attemptError = null;
      let result = null;
      let selectedProvider = providerChain[0];
      for (const provider of providerChain) {
        try {
          if (provider === "deepseek") {
            if (!DEEPSEEK_API_KEY) {
              continue;
            }
            result = await callDeepSeek(payload, DEEPSEEK_API_KEY);
            selectedProvider = provider;
          } else {
            if (!ANTHROPIC_API_KEY) {
              continue;
            }
            result = await callAnthropic(payload, ANTHROPIC_API_KEY);
            selectedProvider = provider;
          }
          if (result?.upstream?.ok || providerPreference !== "auto") {
            break;
          }
          // Auto mode only: fallback to next provider if upstream failed.
          result = null;
        } catch (error) {
          attemptError = error;
          if (providerPreference !== "auto") {
            throw error;
          }
        }
      }

      if (!result) {
        if (attemptError) {
          throw attemptError;
        }
        res.writeHead(500, { "Content-Type": "application/json", ...corsHeaders });
        res.end(JSON.stringify({ error: "No configured AI provider is available" }));
        return;
      }

      // #region agent log
      logDebug("B2", "server.js:/api/messages:upstream", "Upstream response", {
        provider: selectedProvider,
        status: result.upstream.status,
        ok: result.upstream.ok,
        bodyPreview: result.responseText.slice(0, 240)
      });
      // #endregion

      res.writeHead(result.upstream.status, { "Content-Type": "application/json", ...corsHeaders });
      res.end(result.responseText);
    } catch (error) {
      const causeMessage = error?.cause?.message ? `: ${error.cause.message}` : "";
      // #region agent log
      logDebug("B3", "server.js:/api/messages:error", "Proxy failed", {
        errorName: error?.name || "Error",
        errorMessage: error?.message || "Unknown",
        errorCause: error?.cause?.message || null
      });
      // #endregion
      res.writeHead(500, { "Content-Type": "application/json", ...corsHeaders });
      res.end(JSON.stringify({ error: `${error.message || "Proxy error"}${causeMessage}` }));
    }
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Method not allowed" }));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
