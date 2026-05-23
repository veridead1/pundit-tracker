var SYMBOLS = [
  { id: "SPY",     ticker: "SPY"     },
  { id: "QQQ",     ticker: "QQQ"     },
  { id: "CL=F",    ticker: "CL=F"    },
  { id: "BTC-USD", ticker: "BTC-USD" },
  { id: "^TNX",    ticker: "^TNX"    },
];

var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://finance.yahoo.com/",
};

async function fetchQuote(s) {
  var encodedTicker = encodeURIComponent(s.ticker);
  var url = "https://query1.finance.yahoo.com/v8/finance/chart/" + encodedTicker + "?interval=1d&range=5d&includePrePost=false";
  try {
    var res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return { symbol: s.id, price: null, change: null, changePct: null };
    var data = await res.json();
    var result = data && data.chart && data.chart.result && data.chart.result[0];
    if (!result) return { symbol: s.id, price: null, change: null, changePct: null };

    var meta = result.meta;
    var closes = (result.indicators.quote[0].close || []).filter(function(c) { return c != null; });

    var price = meta.regularMarketPrice != null ? meta.regularMarketPrice : closes[closes.length - 1];
    var prevClose = meta.previousClose != null ? meta.previousClose
      : meta.chartPreviousClose != null ? meta.chartPreviousClose
      : closes[closes.length - 2];

    var change = (price != null && prevClose != null) ? price - prevClose : null;
    var changePct = (change != null && prevClose) ? (change / prevClose * 100) : null;

    return { symbol: s.id, price: price, change: change, changePct: changePct };
  } catch (e) {
    return { symbol: s.id, price: null, change: null, changePct: null };
  }
}

export default async function handler(req, res) {
  try {
    var results = await Promise.all(SYMBOLS.map(fetchQuote));
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    res.status(200).json({ prices: results });
  } catch (err) {
    console.error("Price fetch error:", err);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
}
