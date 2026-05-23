export default async function handler(req, res) {
  var symbols = ["SPY", "QQQ", "CL=F", "BTC-USD", "^TNX"];
  var url = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=" + encodeURIComponent(symbols.join(","));

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
      return res.status(502).json({ error: "Yahoo Finance returned " + response.status });
    }

    var data = await response.json();
    var results = (data && data.quoteResponse && data.quoteResponse.result) || [];

    var prices = results.map(function(q) {
      return {
        symbol: q.symbol,
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePct: q.regularMarketChangePercent,
        marketState: q.marketState,
      };
    });

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    res.status(200).json({ prices: prices });
  } catch (err) {
    console.error("Price fetch error:", err);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
}
