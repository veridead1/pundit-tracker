export default async function handler(req, res) {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: "Missing params" });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&period1=${start}&period2=${end}&includePrePost=false`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://finance.yahoo.com/",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Yahoo Finance returned " + response.status });
    }

    const data = await response.json();
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    res.status(200).json(data);
  } catch (err) {
    console.error("S&P 500 fetch error:", err);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
}
