import { useState, useEffect } from "react";

const monoFont = "'JetBrains Mono', monospace";

var TICKERS = [
  { symbol: "SPY",     label: "SPY",  sub: "S&P 500 ETF",    fmt: "price" },
  { symbol: "QQQ",     label: "QQQ",  sub: "Nasdaq 100 ETF", fmt: "price" },
  { symbol: "CL=F",    label: "OIL",  sub: "WTI Crude",      fmt: "price" },
  { symbol: "BTC-USD", label: "BTC",  sub: "Bitcoin",        fmt: "large" },
  { symbol: "^TNX",    label: "10Y",  sub: "Treasury Yield", fmt: "yield" },
];

function fmtPrice(price, fmt) {
  if (price == null) return "—";
  if (fmt === "yield") return price.toFixed(2) + "%";
  if (fmt === "large") return "$" + Math.round(price).toLocaleString("en-US");
  return "$" + price.toFixed(2);
}

export default function LivePrices() {
  var [quotes, setQuotes] = useState({});
  var [lastUpdated, setLastUpdated] = useState(null);
  var [status, setStatus] = useState("loading");

  function fetchPrices() {
    fetch("/api/prices")
      .then(function(res) {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then(function(data) {
        if (data.prices) {
          var map = {};
          data.prices.forEach(function(p) { map[p.symbol] = p; });
          setQuotes(map);
          setLastUpdated(new Date());
          setStatus("ready");
        }
      })
      .catch(function() {
        setStatus(function(prev) { return prev === "loading" ? "error" : prev; });
      });
  }

  useEffect(function() {
    fetchPrices();
    var interval = setInterval(fetchPrices, 60000);
    return function() { clearInterval(interval); };
  }, []);

  return (
    <div className="hc-sidebar-right" style={{
      width: 190,
      flexShrink: 0,
      position: "sticky",
      top: 24,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      padding: "16px 14px",
      alignSelf: "flex-start",
    }}>
      {/* Header */}
      <div style={{
        fontSize: 12, color: "#000000", fontFamily: monoFont,
        textTransform: "uppercase", letterSpacing: 1.2,
        marginBottom: 14, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>Live Prices</span>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: status === "ready" ? "#22c55e" : status === "error" ? "#ef4444" : "#78716c",
          display: "inline-block",
          boxShadow: status === "ready" ? "0 0 6px #22c55e88" : "none",
        }} />
      </div>

      {/* Loading spinner */}
      {status === "loading" && (
        <div style={{ color: "#78716c", fontFamily: monoFont, fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            display: "inline-block", width: 8, height: 8,
            border: "2px solid #57534e", borderTopColor: "#facc15",
            borderRadius: "50%", animation: "spin 1s linear infinite",
          }} />
          <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
          Loading...
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div style={{ color: "#78716c", fontFamily: monoFont, fontSize: 11 }}>
          Unavailable
        </div>
      )}

      {/* Ticker rows */}
      {status === "ready" && TICKERS.map(function(ticker, i) {
        var q = quotes[ticker.symbol];
        var up = q && q.change >= 0;
        var changeColor = q ? (up ? "#22c55e" : "#ef4444") : "#57534e";
        var sign = q && up ? "+" : "";
        var isLast = i === TICKERS.length - 1;
        return (
          <div key={ticker.symbol} style={{
            paddingBottom: isLast ? 0 : 10,
            marginBottom: isLast ? 0 : 10,
            borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
          }}>
            {/* Symbol + price */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
              <span style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 700, color: "#000000" }}>
                {ticker.label}
              </span>
              <span style={{ fontFamily: monoFont, fontSize: 13, fontWeight: 700, color: "#000000" }}>
                {q ? fmtPrice(q.price, ticker.fmt) : "—"}
              </span>
            </div>
            {/* Sub-label + change % */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: monoFont, fontSize: 10, color: "#78716c" }}>
                {ticker.sub}
              </span>
              <span style={{ fontFamily: monoFont, fontSize: 11, fontWeight: 600, color: changeColor }}>
                {q ? sign + q.changePct.toFixed(2) + "%" : "—"}
              </span>
            </div>
          </div>
        );
      })}

      {/* Last updated */}
      {lastUpdated && (
        <div style={{ marginTop: 12, fontSize: 10, color: "#44403c", fontFamily: monoFont }}>
          {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
    </div>
  );
}
