import { useState, useEffect, useRef } from "react";

const monoFont = "'JetBrains Mono', monospace";

function dirColor(dir) {
  if (dir === "bullish") return "#22c55e";
  if (dir === "bearish") return "#ef4444";
  return "#a1a1aa";
}

function fmtDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtPrice(p) {
  return p != null ? p.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—";
}

export default function PunditChart({ predictions }) {
  const [chartData, setChartData] = useState([]);
  const [status, setStatus] = useState("loading");
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  const datedPreds = predictions.filter(function(p) { return p.date_stated; });

  useEffect(function() {
    if (datedPreds.length === 0) { setStatus("error"); return; }

    var cancelled = false;

    async function loadData() {
      try {
        var dates = datedPreds.map(function(p) { return new Date(p.date_stated).getTime(); });
        var minDate = Math.min.apply(null, dates);
        var maxDate = Math.max.apply(null, dates);

        var startTs = Math.floor((minDate - 21 * 86400000) / 1000);
        var endTs = Math.floor(Math.min(maxDate + 21 * 86400000, Date.now()) / 1000);

        var res = await fetch("/api/sp500?start=" + startTs + "&end=" + endTs);
        var json = await res.json();
        if (cancelled) return;

        var result = json && json.chart && json.chart.result && json.chart.result[0];
        if (!result) throw new Error("no data");

        var timestamps = result.timestamp;
        var closes = result.indicators.quote[0].close;

        var data = timestamps.map(function(t, i) {
          return {
            date: new Date(t * 1000).toISOString().split("T")[0],
            price: closes[i],
          };
        }).filter(function(d) { return d.price != null && !isNaN(d.price); });

        if (!cancelled) {
          setChartData(data);
          setStatus("ready");
        }
      } catch(e) {
        if (!cancelled) setStatus("error");
      }
    }

    loadData();
    return function() { cancelled = true; };
  }, []);

  if (status === "loading") {
    return (
      <div style={{ color: "#78716c", fontFamily: monoFont, fontSize: 11, padding: "12px 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ display: "inline-block", width: 10, height: 10, border: "2px solid #57534e", borderTopColor: "#facc15", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
        Loading S&P 500 data...
      </div>
    );
  }

  if (status === "error" || chartData.length < 2) return null;

  // SVG layout constants
  var W = 660, H = 190;
  var ML = 60, MR = 12, MT = 14, MB = 30;
  var IW = W - ML - MR, IH = H - MT - MB;

  var prices = chartData.map(function(d) { return d.price; });
  var minP = Math.min.apply(null, prices);
  var maxP = Math.max.apply(null, prices);
  var pRange = maxP - minP || 1;
  // Add a little vertical padding
  minP = minP - pRange * 0.05;
  maxP = maxP + pRange * 0.05;
  pRange = maxP - minP;

  function xOf(i) { return ML + (i / (chartData.length - 1)) * IW; }
  function yOf(p) { return MT + IH - ((p - minP) / pRange) * IH; }

  var linePoints = chartData.map(function(d, i) { return xOf(i) + "," + yOf(d.price); }).join(" ");

  // Map each prediction to nearest chart data index
  var predPoints = datedPreds.map(function(p) {
    var bestIdx = 0, bestDiff = Infinity;
    chartData.forEach(function(d, i) {
      var diff = Math.abs(new Date(d.date) - new Date(p.date_stated));
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    });
    return { pred: p, idx: bestIdx };
  });

  // Group by index
  var predsByIdx = {};
  predPoints.forEach(function(pp) {
    if (!predsByIdx[pp.idx]) predsByIdx[pp.idx] = [];
    predsByIdx[pp.idx].push(pp.pred);
  });

  // Y axis ticks
  var yTickCount = 4;
  var yTickVals = Array.from({ length: yTickCount + 1 }, function(_, i) {
    return minP + (pRange * i / yTickCount);
  });

  // X axis ticks (up to 6)
  var xTickCount = Math.min(6, chartData.length);
  var xTickIdxs = Array.from({ length: xTickCount }, function(_, i) {
    return Math.round(i * (chartData.length - 1) / Math.max(xTickCount - 1, 1));
  });

  // Mouse move: find nearest data point
  function handleMouseMove(e) {
    if (!svgRef.current) return;
    var rect = svgRef.current.getBoundingClientRect();
    var mouseX = ((e.clientX - rect.left) / rect.width) * W;
    var best = 0, bestDist = Infinity;
    chartData.forEach(function(_, i) {
      var d = Math.abs(xOf(i) - mouseX);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setHovered(best);
  }

  var hovData = hovered !== null ? chartData[hovered] : null;
  var hovPreds = hovered !== null ? (predsByIdx[hovered] || []) : [];
  var hovX = hovered !== null ? xOf(hovered) : null;
  var hovY = hovered !== null ? yOf(chartData[hovered].price) : null;

  // Area fill path (under the line)
  var areaPath = "M " + xOf(0) + "," + yOf(chartData[0].price) + " " +
    chartData.slice(1).map(function(d, i) { return "L " + xOf(i + 1) + "," + yOf(d.price); }).join(" ") +
    " L " + xOf(chartData.length - 1) + "," + (MT + IH) +
    " L " + xOf(0) + "," + (MT + IH) + " Z";

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 10, color: "#78716c", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
        S&P 500 at time of calls
      </div>

      <div style={{ position: "relative", background: "rgba(255,255,255,0.015)", borderRadius: 10, padding: "8px 4px 2px" }}>
        <svg
          ref={svgRef}
          viewBox={"0 0 " + W + " " + H}
          style={{ width: "100%", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={function() { setHovered(null); }}
        >
          {/* Gradient def */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTickVals.map(function(v, i) {
            return <line key={i} x1={ML} x2={ML + IW} y1={yOf(v)} y2={yOf(v)} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />;
          })}

          {/* Y axis labels */}
          {yTickVals.map(function(v, i) {
            return (
              <text key={i} x={ML - 8} y={yOf(v) + 4} textAnchor="end" fill="#57534e" fontSize={10} fontFamily={monoFont}>
                {Math.round(v).toLocaleString()}
              </text>
            );
          })}

          {/* X axis labels */}
          {xTickIdxs.map(function(idx, i) {
            return (
              <text key={i} x={xOf(idx)} y={H - 4} textAnchor="middle" fill="#57534e" fontSize={10} fontFamily={monoFont}>
                {fmtDate(chartData[idx].date)}
              </text>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Price line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="rgba(250,204,21,0.7)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Hover crosshair */}
          {hovered !== null && (
            <>
              <line x1={hovX} x2={hovX} y1={MT} y2={MT + IH}
                stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="3,3" />
              <circle cx={hovX} cy={hovY} r={3.5} fill="#facc15" />
            </>
          )}

          {/* Prediction dots */}
          {predPoints.map(function(pp, i) {
            var cx = xOf(pp.idx);
            var cy = yOf(chartData[pp.idx].price);
            var color = dirColor(pp.pred.direction);
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={10} fill={color} opacity={0.1} />
                <circle cx={cx} cy={cy} r={5} fill={color} stroke="#1c1917" strokeWidth={2} />
              </g>
            );
          })}

          {/* Invisible hover strips */}
          {chartData.map(function(d, i) {
            var barW = IW / chartData.length;
            return (
              <rect
                key={i}
                x={xOf(i) - barW / 2}
                y={MT}
                width={barW}
                height={IH}
                fill="transparent"
                style={{ cursor: predsByIdx[i] ? "pointer" : "default" }}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {hovered !== null && hovData && (
          <div style={{
            position: "absolute",
            top: 8,
            ...(hovX > W * 0.55
              ? { right: ((1 - hovX / W) * 100 + 1) + "%" }
              : { left: (hovX / W * 100 + 2) + "%" }
            ),
            background: "#111110",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "10px 13px",
            fontFamily: monoFont,
            fontSize: 11,
            pointerEvents: "none",
            zIndex: 20,
            maxWidth: 220,
            boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          }}>
            <div style={{ color: "#78716c", marginBottom: 4 }}>{fmtDate(hovData.date)}</div>
            <div style={{ color: "#fafaf9", fontWeight: 700 }}>S&P 500: {fmtPrice(hovData.price)}</div>
            {hovPreds.map(function(p, i) {
              return (
                <div key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 6, marginTop: 6 }}>
                  <span style={{ color: dirColor(p.direction), fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                    ● {p.direction}
                  </span>
                  <div style={{ color: "#a8a29e", marginTop: 3, lineHeight: 1.4, fontSize: 10 }}>
                    {p.prediction.length > 90 ? p.prediction.slice(0, 90) + "…" : p.prediction}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, fontSize: 10, fontFamily: monoFont, color: "#78716c", marginTop: 8 }}>
        <span><span style={{ color: "#22c55e" }}>●</span> Bullish call</span>
        <span><span style={{ color: "#ef4444" }}>●</span> Bearish call</span>
        <span><span style={{ color: "#a1a1aa" }}>●</span> Neutral call</span>
      </div>
    </div>
  );
}
