"use strict";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Server is not configured. Add GROQ_API_KEY to Vercel Environment Variables and redeploy." });
  }

  const { action, ...payload } = req.body || {};
  if (action !== "models" && action !== "chat/completions") {
    return res.status(400).json({ error: "Unsupported API action." });
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
