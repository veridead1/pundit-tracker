import { useState, useEffect, useRef } from "react";

const monoFont = "'JetBrains Mono', monospace";

function dirColor(dir) {
  if (dir === "bullish") return "#22c55e";
  if (dir === "bearish") return "#ef4444";
  return "#a1a1aa";
}

function fmtDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function fmtDateLong(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

        var startTs = Math.floor((minDate - 30 * 86400000) / 1000);
        var endTs = Math.floor(Math.min(maxDate + 60 * 86400000, Date.now()) / 1000);

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

  // SVG layout
  var W = 680, H = 270;
  var ML = 76, MR = 16, MT = 28, MB = 38;
  var IW = W - ML - MR, IH = H - MT - MB;

  var prices = chartData.map(function(d) { return d.price; });
  var minP = Math.min.apply(null, prices);
  var maxP = Math.max.apply(null, prices);
  var pRange = maxP - minP || 1;
  minP = minP - pRange * 0.08;
  maxP = maxP + pRange * 0.10;
  pRange = maxP - minP;

  function xOf(i) { return ML + (i / (chartData.length - 1)) * IW; }
  function yOf(p) { return MT + IH - ((p - minP) / pRange) * IH; }

  var linePoints = chartData.map(function(d, i) { return xOf(i) + "," + yOf(d.price); }).join(" ");

  // Map each prediction to nearest chart data point
  var predPoints = datedPreds.map(function(p, pi) {
    var bestIdx = 0, bestDiff = Infinity;
    chartData.forEach(function(d, i) {
      var diff = Math.abs(new Date(d.date) - new Date(p.date_stated));
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    });
    return { pred: p, idx: bestIdx, num: pi + 1 };
  });

  // Group by index for tooltip
  var predsByIdx = {};
  predPoints.forEach(function(pp) {
    if (!predsByIdx[pp.idx]) predsByIdx[pp.idx] = [];
    predsByIdx[pp.idx].push(pp);
  });

  // Y axis ticks
  var yTickCount = 5;
  var yTickVals = Array.from({ length: yTickCount + 1 }, function(_, i) {
    return minP + (pRange * i / yTickCount);
  });

  // X axis ticks
  var xTickCount = Math.min(7, chartData.length);
  var xTickIdxs = Array.from({ length: xTickCount }, function(_, i) {
    return Math.round(i * (chartData.length - 1) / Math.max(xTickCount - 1, 1));
  });

  // Mouse move
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

  // Area fill path
  var areaPath = "M " + xOf(0) + "," + yOf(chartData[0].price) + " " +
    chartData.slice(1).map(function(d, i) { return "L " + xOf(i + 1) + "," + yOf(d.price); }).join(" ") +
    " L " + xOf(chartData.length - 1) + "," + (MT + IH) +
    " L " + xOf(0) + "," + (MT + IH) + " Z";

  // Period stats
  var firstPrice = chartData[0].price;
  var lastPrice = chartData[chartData.length - 1].price;
  var periodPct = ((lastPrice - firstPrice) / firstPrice * 100);
  var periodColor = periodPct >= 0 ? "#22c55e" : "#ef4444";
  var periodSign = periodPct >= 0 ? "+" : "";

  // Period high/low
  var highIdx = prices.indexOf(Math.max.apply(null, prices));
  var lowIdx = prices.indexOf(Math.min.apply(null, prices));

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: "#78716c", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1.2 }}>
          S&P 500 at time of calls
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", fontFamily: monoFont, fontSize: 13 }}>
          <span style={{ color: "#57534e" }}>
            {fmtDate(chartData[0].date)} – {fmtDate(chartData[chartData.length - 1].date)}
          </span>
          <span style={{ color: periodColor, fontWeight: 700 }}>
            {periodSign}{periodPct.toFixed(1)}% over period
          </span>
        </div>
      </div>

      <div style={{ position: "relative", background: "rgba(255,255,255,0.015)", borderRadius: 10, padding: "8px 4px 2px" }}>
        <svg
          ref={svgRef}
          viewBox={"0 0 " + W + " " + H}
          style={{ width: "100%", display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={function() { setHovered(null); }}
        >
          <defs>
            <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTickVals.map(function(v, i) {
            return <line key={i} x1={ML} x2={ML + IW} y1={yOf(v)} y2={yOf(v)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />;
          })}

          {/* Y axis labels */}
          {yTickVals.map(function(v, i) {
            return (
              <text key={i} x={ML - 10} y={yOf(v) + 4} textAnchor="end" fill="#57534e" fontSize={11} fontFamily={monoFont}>
                {Math.round(v).toLocaleString()}
              </text>
            );
          })}

          {/* X axis labels */}
          {xTickIdxs.map(function(idx, i) {
            return (
              <text key={i} x={xOf(idx)} y={H - 6} textAnchor="middle" fill="#57534e" fontSize={11} fontFamily={monoFont}>
                {fmtDate(chartData[idx].date)}
              </text>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad2)" />

          {/* Price line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="rgba(250,204,21,0.75)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Period high marker */}
          <circle cx={xOf(highIdx)} cy={yOf(chartData[highIdx].price)} r={2.5} fill="#facc15" opacity={0.6} />
          <text x={xOf(highIdx)} y={yOf(chartData[highIdx].price) - 6} textAnchor="middle" fill="#facc15" fontSize={10} fontFamily={monoFont} opacity={0.7}>
            ▲ {fmtPrice(chartData[highIdx].price)}
          </text>

          {/* Period low marker */}
          <circle cx={xOf(lowIdx)} cy={yOf(chartData[lowIdx].price)} r={2.5} fill="#78716c" opacity={0.6} />
          <text x={xOf(lowIdx)} y={yOf(chartData[lowIdx].price) + 14} textAnchor="middle" fill="#78716c" fontSize={10} fontFamily={monoFont} opacity={0.7}>
            ▼ {fmtPrice(chartData[lowIdx].price)}
          </text>

          {/* Start price label */}
          <text x={ML + 4} y={yOf(firstPrice) - 6} fill="#78716c" fontSize={10} fontFamily={monoFont}>
            {fmtPrice(firstPrice)}
          </text>

          {/* End price label */}
          <text x={ML + IW - 4} y={yOf(lastPrice) - 6} fill="#a8a29e" fontSize={10} fontFamily={monoFont} textAnchor="end">
            {fmtPrice(lastPrice)}
          </text>

          {/* Prediction vertical drop lines */}
          {predPoints.map(function(pp, i) {
            var cx = xOf(pp.idx);
            var cy = yOf(chartData[pp.idx].price);
            return (
              <line key={i}
                x1={cx} x2={cx}
                y1={cy + 10} y2={MT + IH}
                stroke={dirColor(pp.pred.direction)}
                strokeWidth={1}
                strokeDasharray="3,3"
                opacity={0.35}
              />
            );
          })}

          {/* Prediction dots with numbered badges */}
          {predPoints.map(function(pp, i) {
            var cx = xOf(pp.idx);
            var cy = yOf(chartData[pp.idx].price);
            var color = dirColor(pp.pred.direction);
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={14} fill={color} opacity={0.07} />
                <circle cx={cx} cy={cy} r={8} fill={color} stroke="#1c1917" strokeWidth={2} />
                <text x={cx} y={cy + 3.5} textAnchor="middle" fill="#0c0a09" fontSize={10} fontFamily={monoFont} fontWeight="700">
                  {pp.num}
                </text>
              </g>
            );
          })}

          {/* Hover crosshair */}
          {hovered !== null && (
            <>
              <line x1={hovX} x2={hovX} y1={MT} y2={MT + IH}
                stroke="rgba(255,255,255,0.13)" strokeWidth={1} strokeDasharray="3,3" />
              <circle cx={hovX} cy={hovY} r={3.5} fill="#facc15" />
            </>
          )}

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
                style={{ cursor: "crosshair" }}
              />
            );
          })}
        </svg>

        {/* Hover tooltip */}
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
            maxWidth: 240,
            boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
          }}>
            <div style={{ color: "#78716c", marginBottom: 3, fontSize: 12 }}>{fmtDateLong(hovData.date)}</div>
            <div style={{ color: "#fafaf9", fontWeight: 700, fontSize: 15, marginBottom: hovPreds.length ? 6 : 0 }}>
              {fmtPrice(hovData.price)}
            </div>
            {hovPreds.map(function(pp, i) {
              var predPrice = chartData[pp.idx].price;
              var pctSince = ((lastPrice - predPrice) / predPrice * 100);
              var sincColor = pctSince >= 0 ? "#22c55e" : "#ef4444";
              var sincSign = pctSince >= 0 ? "+" : "";
              return (
                <div key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 6, marginTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{
                      background: dirColor(pp.pred.direction) + "22",
                      color: dirColor(pp.pred.direction),
                      fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                      padding: "1px 6px", borderRadius: 3,
                    }}>
                      {pp.pred.direction}
                    </span>
                    <span style={{ color: sincColor, fontSize: 12, fontWeight: 700, marginLeft: "auto" }}>
                      {sincSign}{pctSince.toFixed(1)}% since
                    </span>
                  </div>
                  {pp.pred.target && (
                    <div style={{ color: "#78716c", fontSize: 11, marginBottom: 3 }}>Target: {pp.pred.target}</div>
                  )}
                  <div style={{ color: "#a8a29e", lineHeight: 1.45, fontSize: 12 }}>
                    {pp.pred.prediction.length > 110 ? pp.pred.prediction.slice(0, 110) + "…" : pp.pred.prediction}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prediction reference list */}
      {predPoints.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, color: "#57534e", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Calls on this chart
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {predPoints.map(function(pp, i) {
              var predPrice = chartData[pp.idx].price;
              var pctSince = ((lastPrice - predPrice) / predPrice * 100);
              var sincColor = pctSince >= 0 ? "#22c55e" : "#ef4444";
              var sincSign = pctSince >= 0 ? "+" : "";
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 8, padding: "10px 12px",
                }}>
                  {/* Numbered badge */}
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: dirColor(pp.pred.direction),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#0c0a09", marginTop: 1,
                  }}>{pp.num}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Stats row */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 5, fontFamily: monoFont, fontSize: 12 }}>
                      <span style={{ color: "#78716c" }}>{fmtDateLong(pp.pred.date_stated)}</span>
                      <span style={{ color: "#a8a29e", fontWeight: 700 }}>S&P {fmtPrice(predPrice)}</span>
                      <span style={{ color: sincColor, fontWeight: 700 }}>{sincSign}{pctSince.toFixed(1)}% since</span>
                      <span style={{
                        background: dirColor(pp.pred.direction) + "22",
                        color: dirColor(pp.pred.direction),
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                        padding: "1px 6px", borderRadius: 3,
                      }}>{pp.pred.direction}</span>
                      {pp.pred.target && (
                        <span style={{ color: "#57534e" }}>Target: {pp.pred.target}</span>
                      )}
                    </div>
                    {/* Prediction text */}
                    <div style={{ color: "#78716c", fontSize: 13, lineHeight: 1.5, fontFamily: "'DM Sans', system-ui, sans-serif", fontStyle: "italic" }}>
                      {pp.pred.prediction.length > 160 ? pp.pred.prediction.slice(0, 160) + "…" : pp.pred.prediction}
                    </div>
                    {pp.pred.source && (
                      <div style={{ fontSize: 12, color: "#44403c", fontFamily: monoFont, marginTop: 4 }}>
                        via {pp.pred.source}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
