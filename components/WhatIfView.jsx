import { useState, useEffect, useRef } from "react";

const monoFont = "'JetBrains Mono', monospace";
const headFont = "'Space Mono', monospace";

var POPULAR = [
  { symbol: "SPY",     label: "SPY",  desc: "S&P 500 ETF"   },
  { symbol: "QQQ",     label: "QQQ",  desc: "Nasdaq 100"    },
  { symbol: "NVDA",    label: "NVDA", desc: "Nvidia"        },
  { symbol: "AAPL",    label: "AAPL", desc: "Apple"         },
  { symbol: "MSFT",    label: "MSFT", desc: "Microsoft"     },
  { symbol: "TSLA",    label: "TSLA", desc: "Tesla"         },
  { symbol: "AMZN",    label: "AMZN", desc: "Amazon"        },
  { symbol: "BTC-USD", label: "BTC",  desc: "Bitcoin"       },
  { symbol: "GLD",     label: "GLD",  desc: "Gold ETF"      },
];

var PERIODS = [
  { label: "1Y",  years: 1  },
  { label: "3Y",  years: 3  },
  { label: "5Y",  years: 5  },
  { label: "10Y", years: 10 },
];

function fmtDollar(n) {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(2) + "M";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPrice(n) {
  if (n == null || isNaN(n)) return "—";
  if (n >= 10000) return "$" + Math.round(n).toLocaleString("en-US");
  if (n >= 100) return "$" + n.toFixed(2);
  return "$" + n.toFixed(4);
}

function fmtDateShort(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function WhatIfView() {
  var [symbol, setSymbol] = useState("SPY");
  var [customInput, setCustomInput] = useState("");
  var [amount, setAmount] = useState(1000);
  var [years, setYears] = useState(5);
  var [chartData, setChartData] = useState([]);
  var [status, setStatus] = useState("loading");
  var [assetName, setAssetName] = useState("");
  var [hovered, setHovered] = useState(null);
  var svgRef = useRef(null);

  useEffect(function() {
    var cancelled = false;
    setStatus("loading");
    setChartData([]);
    setHovered(null);

    var endTs = Math.floor(Date.now() / 1000);
    var startTs = Math.floor((Date.now() - years * 365.25 * 86400000) / 1000);
    var url = "/api/stock?symbol=" + encodeURIComponent(symbol) + "&start=" + startTs + "&end=" + endTs;

    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (cancelled) return;
        var result = data && data.chart && data.chart.result && data.chart.result[0];
        if (!result) { setStatus("error"); return; }

        var timestamps = result.timestamp || [];
        var closes = result.indicators.quote[0].close || [];
        var valid = timestamps.map(function(t, i) {
          return { date: new Date(t * 1000).toISOString().split("T")[0], price: closes[i] };
        }).filter(function(d) { return d.price != null && !isNaN(d.price); });

        if (valid.length < 2) { setStatus("error"); return; }
        setChartData(valid);
        setAssetName(result.meta.shortName || result.meta.longName || "");
        setStatus("ready");
      })
      .catch(function() {
        if (!cancelled) setStatus("error");
      });

    return function() { cancelled = true; };
  }, [symbol, years]);

  function handleCustomSearch(e) {
    e.preventDefault();
    var s = customInput.trim().toUpperCase();
    if (s) { setSymbol(s); setCustomInput(""); }
  }

  // --- Calculations (depend on amount too, no fetch needed) ---
  var startPrice = chartData.length > 1 ? chartData[0].price : 0;
  var endPrice   = chartData.length > 1 ? chartData[chartData.length - 1].price : 0;
  var sharesOwned   = startPrice > 0 ? amount / startPrice : 0;
  var currentValue  = sharesOwned * endPrice;
  var gain          = currentValue - amount;
  var totalRetPct   = amount > 0 ? (gain / amount) * 100 : 0;
  var actualYears   = chartData.length > 1
    ? (new Date(chartData[chartData.length - 1].date) - new Date(chartData[0].date)) / (365.25 * 86400000)
    : years;
  var annualRetPct  = actualYears > 0 && currentValue > 0 && amount > 0
    ? (Math.pow(currentValue / amount, 1 / actualYears) - 1) * 100
    : 0;
  var isPositive = gain >= 0;
  var lineColor  = isPositive ? "#22c55e" : "#ef4444";

  // Portfolio value at each data point
  var portfolioValues = chartData.map(function(d) { return sharesOwned * d.price; });

  // --- SVG chart ---
  var W = 680, H = 210;
  var ML = 72, MR = 16, MT = 16, MB = 38;
  var IW = W - ML - MR, IH = H - MT - MB;

  var minV = portfolioValues.length > 0 ? Math.min.apply(null, portfolioValues) : 0;
  var maxV = portfolioValues.length > 0 ? Math.max.apply(null, portfolioValues) : amount * 2;
  minV = Math.min(minV, amount * 0.92);
  maxV = Math.max(maxV, amount * 1.08);
  var pad = (maxV - minV) * 0.08;
  minV -= pad; maxV += pad;
  var vRange = maxV - minV || 1;

  function xOf(i) { return ML + (i / (Math.max(chartData.length - 1, 1))) * IW; }
  function yOf(v) { return MT + IH - ((v - minV) / vRange) * IH; }

  var linePoints = portfolioValues.map(function(v, i) { return xOf(i) + "," + yOf(v); }).join(" ");
  var areaPath = portfolioValues.length > 1
    ? "M " + xOf(0) + "," + yOf(portfolioValues[0]) + " " +
      portfolioValues.slice(1).map(function(v, i) { return "L " + xOf(i + 1) + "," + yOf(v); }).join(" ") +
      " L " + xOf(chartData.length - 1) + "," + (MT + IH) +
      " L " + xOf(0) + "," + (MT + IH) + " Z"
    : "";

  var breakEvenY = yOf(amount);
  var showBreakEven = breakEvenY >= MT && breakEvenY <= MT + IH;

  var yTickCount = 4;
  var yTicks = Array.from({ length: yTickCount + 1 }, function(_, i) {
    return minV + (vRange * i / yTickCount);
  });

  var xTickCount = Math.min(5, chartData.length);
  var xTickIdxs = Array.from({ length: xTickCount }, function(_, i) {
    return Math.round(i * (chartData.length - 1) / Math.max(xTickCount - 1, 1));
  });

  function handleMouseMove(e) {
    if (!svgRef.current || chartData.length === 0) return;
    var rect = svgRef.current.getBoundingClientRect();
    var mouseX = ((e.clientX - rect.left) / rect.width) * W;
    var best = 0, bestDist = Infinity;
    chartData.forEach(function(_, i) {
      var d = Math.abs(xOf(i) - mouseX);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setHovered(best);
  }

  var hovVal  = hovered !== null ? portfolioValues[hovered] : null;
  var hovData = hovered !== null ? chartData[hovered] : null;
  var hovX    = hovered !== null ? xOf(hovered) : null;
  var hovY    = hovered !== null ? yOf(portfolioValues[hovered]) : null;
  var hovPct  = hovVal != null ? ((hovVal - amount) / amount * 100) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#000000", fontFamily: headFont }}>
          What If Calculator
        </h2>
        <div style={{ fontSize: 13, color: "#78716c", fontFamily: monoFont }}>
          If you invested $X in any stock N years ago, what would it be worth today?
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "18px 20px", marginBottom: 22 }}>

        {/* Popular tickers */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Quick pick
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {POPULAR.map(function(t) {
              var active = symbol === t.symbol;
              return (
                <button key={t.symbol} onClick={function() { setSymbol(t.symbol); }} title={t.desc} style={{
                  background: active ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.04)",
                  color: active ? "#facc15" : "#a8a29e",
                  border: "1px solid " + (active ? "#facc1544" : "rgba(255,255,255,0.08)"),
                  borderRadius: 6, padding: "5px 13px", cursor: "pointer",
                  fontSize: 12, fontWeight: 700, fontFamily: monoFont,
                  transition: "all 0.12s",
                }}>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>

          {/* Custom ticker */}
          <div>
            <div style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Custom ticker</div>
            <form onSubmit={handleCustomSearch} style={{ display: "flex", gap: 0 }}>
              <input
                value={customInput}
                onChange={function(e) { setCustomInput(e.target.value.toUpperCase()); }}
                placeholder="e.g. GOOGL"
                style={{
                  background: "rgba(0,0,0,0.25)", color: "#fafaf9",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRight: "none",
                  borderRadius: "6px 0 0 6px",
                  padding: "7px 11px", fontSize: 13, fontFamily: monoFont,
                  outline: "none", width: 110,
                }}
              />
              <button type="submit" style={{
                background: "rgba(250,204,21,0.15)", color: "#facc15",
                border: "1px solid rgba(250,204,21,0.3)",
                borderRadius: "0 6px 6px 0",
                padding: "7px 13px", cursor: "pointer",
                fontSize: 12, fontFamily: monoFont, fontWeight: 700,
              }}>Go →</button>
            </form>
          </div>

          {/* Amount */}
          <div>
            <div style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Amount</div>
            <div style={{ display: "flex", alignItems: "stretch" }}>
              <span style={{
                background: "rgba(0,0,0,0.2)", color: "#78716c",
                border: "1px solid rgba(255,255,255,0.12)", borderRight: "none",
                borderRadius: "6px 0 0 6px", padding: "7px 10px", fontSize: 13, fontFamily: monoFont,
                display: "flex", alignItems: "center",
              }}>$</span>
              <input
                type="number" min={1} value={amount}
                onChange={function(e) { var v = parseInt(e.target.value); if (v > 0) setAmount(v); }}
                style={{
                  background: "rgba(0,0,0,0.25)", color: "#fafaf9",
                  border: "1px solid rgba(255,255,255,0.12)", borderLeft: "none",
                  borderRadius: "0 6px 6px 0",
                  padding: "7px 10px", fontSize: 13, fontFamily: monoFont,
                  outline: "none", width: 90,
                }}
              />
            </div>
          </div>

          {/* Period */}
          <div>
            <div style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Period</div>
            <div style={{ display: "flex", gap: 4 }}>
              {PERIODS.map(function(p) {
                var active = years === p.years;
                return (
                  <button key={p.label} onClick={function() { setYears(p.years); }} style={{
                    background: active ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.04)",
                    color: active ? "#facc15" : "#a8a29e",
                    border: "1px solid " + (active ? "#facc1544" : "rgba(255,255,255,0.08)"),
                    borderRadius: 6, padding: "5px 11px", cursor: "pointer",
                    fontSize: 12, fontWeight: 700, fontFamily: monoFont,
                  }}>{p.label}</button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {status === "loading" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "36px 0", color: "#78716c", fontFamily: monoFont, fontSize: 13 }}>
          <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #57534e", borderTopColor: "#facc15", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
          Fetching {symbol} price history…
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div style={{ padding: "30px 0", color: "#78716c", fontFamily: monoFont, fontSize: 13 }}>
          Could not load data for <span style={{ color: "#fafaf9", fontWeight: 700 }}>{symbol}</span> — check the ticker and try again.
        </div>
      )}

      {/* Results */}
      {status === "ready" && chartData.length > 1 && (
        <div>
          {/* Result card */}
          <div style={{
            background: isPositive ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
            border: "1px solid " + (isPositive ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)"),
            borderRadius: 12, padding: "22px 26px", marginBottom: 18,
          }}>
            <div style={{ fontSize: 11, color: "#57534e", fontFamily: monoFont, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
              {symbol} · {fmtDateShort(chartData[0].date)} → today
            </div>
            <div style={{ fontSize: 15, color: "#78716c", fontFamily: "'DM Sans', system-ui, sans-serif", fontStyle: "italic", marginBottom: 8, lineHeight: 1.4 }}>
              In hindsight, you would have {isPositive
                ? "turned " + fmtDollar(amount) + " into"
                : "watched " + fmtDollar(amount) + " shrink to"
              }
            </div>
            <div style={{ fontSize: 52, fontWeight: 700, color: isPositive ? "#22c55e" : "#ef4444", fontFamily: headFont, lineHeight: 1, marginBottom: 14 }}>
              {fmtDollar(currentValue)}
            </div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap", fontFamily: monoFont }}>
              <div>
                <div style={{ fontSize: 10, color: "#57534e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Gain / Loss</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isPositive ? "#22c55e" : "#ef4444" }}>
                  {gain >= 0 ? "+" : ""}{fmtDollar(gain)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#57534e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Total Return</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isPositive ? "#22c55e" : "#ef4444" }}>
                  {totalRetPct >= 0 ? "+" : ""}{totalRetPct.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#57534e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Annualized</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isPositive ? "#22c55e" : "#ef4444" }}>
                  {annualRetPct >= 0 ? "+" : ""}{annualRetPct.toFixed(1)}% / yr
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#57534e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Shares Bought</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#a8a29e" }}>
                  {sharesOwned < 0.01 ? sharesOwned.toFixed(6) : sharesOwned.toFixed(4)} @ {fmtPrice(startPrice)}
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={{ background: "rgba(255,255,255,0.015)", borderRadius: 10, padding: "8px 4px 2px", position: "relative" }}>
            <svg
              ref={svgRef}
              viewBox={"0 0 " + W + " " + H}
              style={{ width: "100%", display: "block" }}
              onMouseMove={handleMouseMove}
              onMouseLeave={function() { setHovered(null); }}
            >
              <defs>
                <linearGradient id="whatifGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {yTicks.map(function(v, i) {
                return <line key={i} x1={ML} x2={ML + IW} y1={yOf(v)} y2={yOf(v)} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />;
              })}

              {/* Breakeven reference line */}
              {showBreakEven && (
                <line x1={ML} x2={ML + IW} y1={breakEvenY} y2={breakEvenY}
                  stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="5,4" />
              )}

              {/* Y-axis labels */}
              {yTicks.map(function(v, i) {
                var label = v >= 1000000 ? "$" + (v / 1000000).toFixed(1) + "M"
                  : v >= 1000 ? "$" + (v / 1000).toFixed(1) + "k"
                  : "$" + Math.round(v);
                return (
                  <text key={i} x={ML - 8} y={yOf(v) + 4} textAnchor="end" fill="#57534e" fontSize={10} fontFamily={monoFont}>
                    {label}
                  </text>
                );
              })}

              {/* X-axis labels */}
              {xTickIdxs.map(function(idx, i) {
                return (
                  <text key={i} x={xOf(idx)} y={H - 4} textAnchor="middle" fill="#57534e" fontSize={10} fontFamily={monoFont}>
                    {fmtDateShort(chartData[idx].date)}
                  </text>
                );
              })}

              {/* Area fill */}
              {areaPath && <path d={areaPath} fill="url(#whatifGrad)" />}

              {/* Portfolio line */}
              <polyline
                points={linePoints}
                fill="none"
                stroke={lineColor}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.88}
              />

              {/* Hover crosshair */}
              {hovered !== null && (
                <>
                  <line x1={hovX} x2={hovX} y1={MT} y2={MT + IH}
                    stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="3,3" />
                  <circle cx={hovX} cy={hovY} r={4} fill={lineColor} />
                </>
              )}

              {/* Invisible hover strips */}
              {chartData.map(function(d, i) {
                var bw = IW / chartData.length;
                return (
                  <rect key={i} x={xOf(i) - bw / 2} y={MT} width={bw} height={IH}
                    fill="transparent" style={{ cursor: "crosshair" }} />
                );
              })}
            </svg>

            {/* Hover tooltip */}
            {hovered !== null && hovData && hovVal !== null && (
              <div style={{
                position: "absolute",
                top: 8,
                ...(hovX > W * 0.6
                  ? { right: ((1 - hovX / W) * 100 + 1) + "%" }
                  : { left: (hovX / W * 100 + 2) + "%" }
                ),
                background: "#111110",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "10px 14px",
                fontFamily: monoFont, pointerEvents: "none", zIndex: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                minWidth: 160,
              }}>
                <div style={{ color: "#78716c", fontSize: 11, marginBottom: 4 }}>{hovData.date}</div>
                <div style={{ color: "#a8a29e", fontSize: 11, marginBottom: 6 }}>
                  {symbol} @ {fmtPrice(hovData.price)}
                </div>
                <div style={{ color: hovPct >= 0 ? "#22c55e" : "#ef4444", fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                  {fmtDollar(hovVal)}
                </div>
                <div style={{ color: hovPct >= 0 ? "#22c55e" : "#ef4444", fontSize: 11, fontWeight: 700 }}>
                  {hovPct >= 0 ? "+" : ""}{hovPct.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div style={{ marginTop: 10, fontSize: 11, color: "#44403c", fontFamily: monoFont }}>
            {assetName && assetName !== symbol ? symbol + " · " + assetName + " · " : ""} Weekly closes · excludes dividends & fees · data via Yahoo Finance
          </div>
        </div>
      )}
    </div>
  );
}
