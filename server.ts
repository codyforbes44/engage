import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy for X.com (Twitter) API v2
  // This helps bypass CORS and keeps keys safer
  app.post("/api/x/metrics", async (req, res) => {
    const { apiKey } = req.body;
    const finalApiKey = apiKey || process.env.X_API_KEY;

    if (!finalApiKey) {
      return res.status(400).json({ error: "X API Key (Bearer Token) is required" });
    }

    try {
      // Example: Fetching user metrics for the authenticated user
      // Note: This requires the Bearer Token to have appropriate permissions
      const response = await axios.get("https://api.twitter.com/2/users/me?user.fields=public_metrics", {
        headers: {
          Authorization: `Bearer ${finalApiKey}`,
        },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("X API Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch X metrics" });
    }
  });

  // API Proxy for xAI (Grok)
  app.post("/api/xai/chat", async (req, res) => {
    const { apiKey, messages, model, temperature } = req.body;
    const finalApiKey = apiKey || process.env.XAI_API_KEY;

    if (!finalApiKey) {
      return res.status(400).json({ error: "xAI API Key is required" });
    }

    try {
      const response = await axios.post("https://api.x.ai/v1/chat/completions", {
        model: model || "grok-beta",
        messages,
        temperature: temperature ?? 0.7,
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${finalApiKey}`,
        },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("xAI API Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to call xAI API" });
    }
  });

  // Config endpoint to check for global keys
  app.get("/api/config", (req, res) => {
    res.json({
      hasGlobalXAIKey: !!process.env.XAI_API_KEY,
      hasGlobalXKey: !!process.env.X_API_KEY,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
