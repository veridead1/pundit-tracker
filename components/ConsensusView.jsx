import { useState } from "react";

const monoFont = "'JetBrains Mono', monospace";
const headFont = "'Space Mono', monospace";

// Wall Street median year-end S&P 500 forecast vs actual close
// Sources: Goldman Sachs, JPMorgan, Morgan Stanley, Bloomberg consensus surveys
var DATA = [
  {
    year: "2020",
    forecast: 3300,   // Start-of-year median (pre-COVID); Goldman ~3,400, consensus ~3,300
    actual:   3756,   // Dec 31, 2020 actual close
    prevClose: 3231,  // Dec 31, 2019 close
    note: "COVID crashed the market 34% in six weeks — then the Fed unleashed unlimited QE and the market finished the year up 16%. Nobody called it.",
    est: false, inProgress: false,
  },
  {
    year: "2021",
    forecast: 4400,   // Goldman 4,300 · JPMorgan 4,400 · median ~4,400
    actual:   4766,   // Dec 31, 2021 actual close
    prevClose: 3756,
    note: "Vaccine rollout, $1.9T in fiscal stimulus, and reopening euphoria drove gains well past a consensus that was already bullish.",
    est: false, inProgress: false,
  },
  {
    year: "2022",
    forecast: 4800,   // Goldman 4,900 · consensus ~4,800 — nearly everyone bullish
    actual:   3839,   // Dec 31, 2022 actual close
    prevClose: 4766,
    note: "40-year-high inflation and 425bps of Fed rate hikes delivered the worst year since 2008. Consensus was uniformly bullish entering the year.",
    est: false, inProgress: false,
  },
  {
    year: "2023",
    forecast: 4050,   // Mike Wilson 3,900 · Kolanovic 4,200 · Goldman 4,000 · median ~4,050
    actual:   4769,   // Dec 31, 2023 actual close
    prevClose: 3839,
    note: "A bearish consensus scarred by 2022 completely missed the ChatGPT / AI boom. Tom Lee was the lone accurate bull — the rest badly underestimated the rally.",
    est: false, inProgress: false,
  },
  {
    year: "2024",
    forecast: 5000,   // Goldman 5,100 · Kolanovic 4,200 (outlier) · median ~5,000
    actual:   5882,   // Dec 31, 2024 actual close
    prevClose: 4769,
    note: "AI momentum, Magnificent 7 earnings, and rate-cut optimism pushed the market 23% — nearly every major bank undershot by a wide margin.",
    est: false, inProgress: false,
  },
  {
    year: "2025",
    forecast: 6200,   // Goldman ~6,300 · Yardeni 6,000 · median ~6,200
    actual:   6760,   // Estimated Dec 31, 2025 close
    prevClose: 5882,
    note: "AI bull market extended for a fifth year. Tariff uncertainty and Mag7 volatility in H1 tempered expectations — but the market recovered strongly.",
    est: true, inProgress: false,
  },
  {
    year: "2026",
    forecast: 7650,   // Bloomberg survey median of 60+ institutions (seed data)
    actual:   null,
    prevClose: 6760,
    note: "In progress — Bloomberg median of 60+ institutions · current ~7,100 · top call: Yardeni 8,250",
    est: false, inProgress: true,
  },
];

function pct(num, denom) {
  return (num - denom) / denom * 100;
}

function sign(n) {
  return n >= 0 ? "+" : "";
}

export default function ConsensusView() {
  var [hovYear, setHovYear] = useState(null);

  // Stats from confirmed (non-estimated) completed years
  var confirmed = DATA.filter(function(d) { return d.actual && !d.est && !d.inProgress; });
  var missesPP = confirmed.map(function(d) {
    return pct(d.actual, d.prevClose) - pct(d.forecast, d.prevClose);
  });
  var avgAbsMiss = missesPP.reduce(function(s, m) { return s + Math.abs(m); }, 0) / missesPP.length;
  var beatCount = missesPP.filter(function(m) { return m > 0; }).length;
  var worstIdx = missesPP.reduce(function(bi, m, i) { return Math.abs(m) > Math.abs(missesPP[bi]) ? i : bi; }, 0);
  var worstYear = confirmed[worstIdx].year;

  // Chart layout
  var W = 680, H = 280;
  var ML = 52, MR = 16, MT = 36, MB = 52;
  var IW = W - ML - MR;
  var IH = H - MT - MB;

  var yMin = -25, yMax = 34;
  var yRange = yMax - yMin;
  var yTicks = [-20, -10, 0, 10, 20, 30];

  function yOf(v) {
    return MT + IH - ((v - yMin) / yRange) * IH;
  }

  var zeroY = yOf(0);
  var groupW = IW / DATA.length;
  var barW = Math.min(groupW * 0.29, 26);
  var halfGap = 3;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#000000", fontFamily: headFont }}>
          Consensus vs Reality
        </h2>
        <div style={{ fontSize: 13, color: "#78716c", fontFamily: monoFont }}>
          Wall Street median year-end S&P 500 forecast vs actual · 2020–2026
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "nowrap" }}>
        {[
          { label: "Avg Miss",      value: avgAbsMiss.toFixed(1) + "pp", accent: "#facc15",  title: "Average absolute miss in percentage points" },
          { label: "Beat Forecast", value: beatCount + " / " + confirmed.length, accent: "#22c55e", title: "Years actual exceeded consensus" },
          { label: "Missed",        value: (confirmed.length - beatCount) + " / " + confirmed.length, accent: "#ef4444", title: "Years actual fell short of consensus" },
          { label: "Worst Year",    value: worstYear, accent: "#ef4444", title: "Largest miss between forecast and actual" },
        ].map(function(s) {
          return (
            <div key={s.label} title={s.title} style={{
              flex: 1, minWidth: 0,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#78716c", marginBottom: 6, fontFamily: monoFont }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.accent, fontFamily: headFont, lineHeight: 1.1 }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div style={{ background: "rgba(255,255,255,0.015)", borderRadius: 10, padding: "4px 4px 2px", marginBottom: 24 }}>
        <svg
          viewBox={"0 0 " + W + " " + H}
          style={{ width: "100%", display: "block" }}
        >
          {/* Grid + Y-axis */}
          {yTicks.map(function(v) {
            var isZero = v === 0;
            return (
              <g key={v}>
                <line
                  x1={ML} x2={ML + IW} y1={yOf(v)} y2={yOf(v)}
                  stroke={isZero ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.05)"}
                  strokeWidth={isZero ? 1.5 : 1}
                />
                <text
                  x={ML - 7} y={yOf(v) + 4}
                  textAnchor="end" fill={isZero ? "#a8a29e" : "#57534e"}
                  fontSize={10} fontFamily={monoFont}
                >
                  {sign(v)}{v}%
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <rect x={ML} y={10} width={10} height={10} fill="rgba(120,113,108,0.5)" rx={2} />
          <text x={ML + 14} y={19} fill="#57534e" fontSize={9} fontFamily={monoFont}>Consensus forecast</text>
          <rect x={ML + 140} y={10} width={10} height={10} fill="#22c55e" opacity={0.8} rx={2} />
          <text x={ML + 154} y={19} fill="#57534e" fontSize={9} fontFamily={monoFont}>Beat forecast</text>
          <rect x={ML + 240} y={10} width={10} height={10} fill="#ef4444" opacity={0.8} rx={2} />
          <text x={ML + 254} y={19} fill="#57534e" fontSize={9} fontFamily={monoFont}>Missed forecast</text>
          <rect x={ML + 340} y={10} width={10} height={10} fill="rgba(161,161,170,0.5)" rx={2} />
          <text x={ML + 354} y={19} fill="#57534e" fontSize={9} fontFamily={monoFont}>Estimated</text>

          {/* Year groups */}
          {DATA.map(function(d, i) {
            var cx = ML + (i + 0.5) * groupW;
            var fRet = pct(d.forecast, d.prevClose);
            var aRet = d.actual ? pct(d.actual, d.prevClose) : null;
            var beat = aRet !== null && aRet > fRet;
            var isHov = hovYear === d.year;

            var actualColor = d.inProgress ? "rgba(250,204,21,0.35)"
              : d.est ? "rgba(161,161,170,0.55)"
              : beat ? "rgba(34,197,94,0.82)"
              : "rgba(239,68,68,0.82)";

            // Forecast bar geometry
            var fX = cx - halfGap - barW;
            var fRectY = Math.min(yOf(fRet), zeroY);
            var fRectH = Math.max(Math.abs(yOf(fRet) - zeroY), 2);

            // Actual bar geometry
            var aX = cx + halfGap;
            var aRectY = aRet !== null ? Math.min(yOf(aRet), zeroY) : zeroY;
            var aRectH = aRet !== null ? Math.max(Math.abs(yOf(aRet) - zeroY), 2) : 0;

            // Miss label Y — above whichever bar is taller
            var topBarY = aRet !== null
              ? Math.min(yOf(fRet), yOf(aRet), zeroY)
              : Math.min(yOf(fRet), zeroY);
            var labelY = topBarY - 5;

            return (
              <g
                key={d.year}
                onMouseEnter={function() { setHovYear(d.year); }}
                onMouseLeave={function() { setHovYear(null); }}
              >
                {/* Forecast bar */}
                <rect
                  x={fX} y={fRectY} width={barW} height={fRectH}
                  fill={"rgba(120,113,108," + (isHov ? "0.65" : "0.4") + ")"}
                  rx={2}
                />

                {/* Actual bar */}
                {aRet !== null && (
                  <rect
                    x={aX} y={aRectY} width={barW} height={aRectH}
                    fill={actualColor}
                    rx={2}
                  />
                )}

                {/* 2026 in-progress outline */}
                {d.inProgress && (
                  <rect
                    x={aX} y={Math.min(yOf(fRet * 0.6), zeroY)}
                    width={barW}
                    height={Math.max(Math.abs(yOf(fRet * 0.6) - zeroY), 4)}
                    fill="none"
                    stroke="rgba(250,204,21,0.45)"
                    strokeWidth={1.5}
                    strokeDasharray="4,3"
                    rx={2}
                  />
                )}

                {/* Miss label */}
                {aRet !== null && !d.inProgress && (
                  <text
                    x={cx} y={labelY}
                    textAnchor="middle"
                    fill={beat ? "#22c55e" : "#ef4444"}
                    fontSize={9} fontFamily={monoFont} fontWeight="700"
                    opacity={isHov ? 1 : 0.55}
                  >
                    {sign(aRet - fRet)}{(aRet - fRet).toFixed(1)}pp
                  </text>
                )}

                {/* Year label */}
                <text
                  x={cx} y={H - 6}
                  textAnchor="middle"
                  fill={isHov ? "#fafaf9" : "#57534e"}
                  fontSize={11} fontFamily={monoFont}
                  fontWeight={isHov ? "700" : "400"}
                >
                  {d.year}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Year-by-year breakdown */}
      <div style={{ fontSize: 12, color: "#57534e", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
        Year by Year
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {DATA.map(function(d) {
          var fRet = pct(d.forecast, d.prevClose);
          var aRet = d.actual ? pct(d.actual, d.prevClose) : null;
          var beat = aRet !== null && aRet > fRet;
          var missPP = aRet !== null ? (aRet - fRet) : null;

          var accentColor = d.inProgress ? "#facc15"
            : d.est ? "#a1a1aa"
            : beat ? "#22c55e"
            : "#ef4444";
          var borderColor = d.inProgress ? "rgba(250,204,21,0.18)"
            : d.est ? "rgba(161,161,170,0.12)"
            : beat ? "rgba(34,197,94,0.18)"
            : "rgba(239,68,68,0.18)";

          return (
            <div key={d.year} style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid " + borderColor,
              borderRadius: 10, padding: "14px 18px",
            }}>
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
                <span style={{ fontFamily: headFont, fontSize: 20, fontWeight: 700, color: "#000000", minWidth: 46 }}>{d.year}</span>

                {/* Forecast */}
                <div style={{ fontFamily: monoFont, fontSize: 12 }}>
                  <span style={{ color: "#57534e" }}>Consensus </span>
                  <span style={{ color: "#a8a29e", fontWeight: 700 }}>{d.forecast.toLocaleString()}</span>
                  <span style={{ color: "#57534e" }}> ({sign(fRet)}{fRet.toFixed(1)}%)</span>
                </div>

                {/* Actual */}
                {aRet !== null && (
                  <div style={{ fontFamily: monoFont, fontSize: 12 }}>
                    <span style={{ color: "#57534e" }}>Actual </span>
                    <span style={{ color: accentColor, fontWeight: 700 }}>{d.actual.toLocaleString()}{d.est ? "*" : ""}</span>
                    <span style={{ color: accentColor }}> ({sign(aRet)}{aRet.toFixed(1)}%)</span>
                  </div>
                )}

                {/* Badge */}
                <div style={{ marginLeft: "auto" }}>
                  {d.inProgress ? (
                    <span style={{ fontFamily: monoFont, fontSize: 11, color: "#facc15", background: "rgba(250,204,21,0.1)", padding: "3px 10px", borderRadius: 4 }}>IN PROGRESS</span>
                  ) : missPP !== null ? (
                    <span style={{ fontFamily: monoFont, fontSize: 11, fontWeight: 700, color: accentColor, background: beat ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", padding: "3px 10px", borderRadius: 4 }}>
                      {beat ? "BEAT" : "MISSED"} {sign(missPP)}{missPP.toFixed(1)}pp
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Note */}
              <div style={{ fontSize: 12, color: "#78716c", lineHeight: 1.55, fontFamily: "'DM Sans', system-ui, sans-serif", fontStyle: "italic" }}>
                {d.note}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 14, fontSize: 11, color: "#44403c", fontFamily: monoFont, lineHeight: 1.6 }}>
        * 2025 actual close estimated. Forecasts = median of major Wall Street year-end outlooks (Goldman Sachs, JPMorgan, Morgan Stanley + Bloomberg consensus survey). pp = percentage points.
      </div>
    </div>
  );
}
