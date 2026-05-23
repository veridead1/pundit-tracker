export default async function handler(req, res) {
  var { symbol, start, end } = req.query;
  if (!symbol || !start || !end) return res.status(400).json({ error: "Missing params" });

  var encodedSymbol = encodeURIComponent(symbol.toUpperCase().trim());
  var url = "https://query1.finance.yahoo.com/v8/finance/chart/" + encodedSymbol +
    "?interval=1wk&period1=" + start + "&period2=" + end + "&includePrePost=false";

  try {
    var response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://finance.yahoo.com/",
      },
    });

    if (!response.ok) {
      var code = response.status;
      return res.status(code === 404 ? 404 : 502).json({
        error: code === 404 ? "Symbol not found: " + symbol : "Yahoo Finance error " + code,
      });
    }

    var data = await response.json();
    var result = data && data.chart && data.chart.result && data.chart.result[0];
    if (!result || !result.timestamp) {
      return res.status(404).json({ error: "No data for " + symbol });
    }

    res.setHeader("Cache-Control", "s-maxage=14400, stale-while-revalidate");
    res.status(200).json(data);
  } catch (err) {
    console.error("Stock fetch error:", err);
    res.status(500).json({ error: "Failed to fetch" });
  }
}
