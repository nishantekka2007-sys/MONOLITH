"use strict";

// Best-effort per-instance throttling to reduce accidental or automated quota abuse.
const buckets = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin) {
    try { if (new URL(origin).host !== host) return res.status(403).json({ error: "Origin not allowed" }); }
    catch { return res.status(403).json({ error: "Invalid origin" }); }
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : String(forwarded || "")).split(",")[0].trim() || "unknown";
  const now = Date.now();
  const bucket = buckets.get(ip) || { count: 0, reset: now + WINDOW_MS };
  if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + WINDOW_MS; }
  bucket.count += 1;
  buckets.set(ip, bucket);
  if (bucket.count > MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.reset - now) / 1000)));
    return res.status(429).json({ error: "Too many requests. Please wait before trying again." });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Server is not configured. Add GROQ_API_KEY to Vercel Environment Variables and redeploy." });

  const { action, ...payload } = req.body || {};
  if (action !== "models" && action !== "chat/completions") {
    return res.status(400).json({ error: "Unsupported API action." });
  }
  if (action === "chat/completions" && (!Array.isArray(payload.messages) || !payload.messages.length || typeof payload.model !== "string")) {
    return res.status(400).json({ error: "A model and at least one message are required." });
  }

  const controller = new AbortController();
  res.on("close", () => { if (!res.writableEnded) controller.abort(); });

  try {
    const isModels = action === "models";
    const upstream = await fetch("https://api.groq.com/openai/v1/" + action, {
      method: isModels ? "GET" : "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      ...(isModels ? {} : { body: JSON.stringify(payload) }),
      signal: controller.signal
    });
    res.statusCode = upstream.status;
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (!upstream.body) return res.end();
    for await (const chunk of upstream.body) {
      if (res.destroyed) break;
      res.write(chunk);
    }
    if (!res.destroyed) res.end();
  } catch (error) {
    if (error.name === "AbortError" || res.destroyed) return;
    return res.status(502).json({ error: "Could not reach the Groq API. Please retry." });
  }
}
