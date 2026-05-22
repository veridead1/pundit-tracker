// AI features are currently disabled - no API key configured
export default function handler(req, res) {
  res.status(503).json({ error: "AI features are not enabled" });
}
