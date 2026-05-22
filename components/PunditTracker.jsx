import React, { useState, useEffect, useCallback } from "react";
import PunditChart from "./PunditChart";

const STORAGE_KEY = "pundit-tracker-v3";
const PIN_KEY = "pundit-tracker-pin";

const monoFont = "'JetBrains Mono', monospace";
const headFont = "'Space Mono', monospace";

const shellStyle = {
  maxWidth: 720,
  margin: "0 auto",
  padding: 24,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  color: "#d6d3d1",
  minHeight: "100vh",
};

const selectStyle = {
  background: "rgba(0,0,0,0.3)",
  color: "#d6d3d1",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 12,
  fontFamily: monoFont,
  outline: "none",
  cursor: "pointer",
};

var DEFAULT_PIN = "2468";

var SEED_DATA = [
  { id: "seed01", commentator: "Ben Snider (Goldman Sachs)", prediction: "S&P 500 will climb 6% to a year-end target of 7,600, driven by 12% EPS growth and continued AI spending", asset: "S&P 500", direction: "bullish", target: "7,600", timeframe: "Year-end 2026", source: "Goldman Sachs Research report", date_stated: "2026-04-24", created: "2026-05-21T12:00:00Z" },
  { id: "seed02", commentator: "Bank of America", prediction: "S&P 500 will rise another 8% in the next year with 12% earnings growth, benefiting from a 1990s-style productivity boom", asset: "S&P 500", direction: "bullish", target: "7,100", timeframe: "2026", source: "BofA strategist note", date_stated: "2026-01-15", created: "2026-05-21T12:01:00Z" },
  { id: "seed03", commentator: "Michael Burry", prediction: "Current AI-driven rally feels like the final months of the 1999-2000 bubble. Stocks going up only because they have been going up, on a two-letter thesis everyone thinks they understand. The market has jumped the shark.", asset: "S&P 500", direction: "bearish", target: "~30% decline in SOXX (via put options)", timeframe: null, source: "Substack post", date_stated: "2026-05-08", created: "2026-05-21T12:02:00Z" },
  { id: "seed04", commentator: "Jim Cramer", prediction: "2026 is more punishing than 1999 — market does not stop punishing companies that disappoint. You are unsafe at any level. The hated are over-hated and the loved are over-loved.", asset: "S&P 500", direction: "bearish", target: null, timeframe: null, source: "CNBC Mad Money", date_stated: "2026-05-11", created: "2026-05-21T12:03:00Z" },
  { id: "seed05", commentator: "Jim Cramer", prediction: "Massive AI investment will sustain market momentum despite volatility. AI-related spending now drives most U.S. economic growth. Semiconductor and AI infrastructure stocks are foundational and must be owned.", asset: "QQQ", direction: "bullish", target: null, timeframe: null, source: "CNBC Mad Money", date_stated: "2026-05-08", created: "2026-05-21T12:04:00Z" },
  { id: "seed06", commentator: "Tom Lee (Fundstrat)", prediction: "Energy stocks will outperform technology stocks in 2026. Years of underperformance make energy a mean reversion trade with geopolitical support.", asset: "XLE", direction: "bullish", target: null, timeframe: "2026", source: "Fundstrat research / TheStreet", date_stated: "2026-01-21", created: "2026-05-21T12:05:00Z" },
  { id: "seed07", commentator: "Tom Lee (Fundstrat)", prediction: "Stocks are now in the process of going back to their all-time highs. S&P 500 could reach 7,300 this year. 70% of the index has already weathered a bear market cycle.", asset: "S&P 500", direction: "bullish", target: "7,300", timeframe: "2026", source: "CNBC Closing Bell", date_stated: "2026-04-08", created: "2026-05-21T12:06:00Z" },
  { id: "seed08", commentator: "Cathie Wood (ARK Invest)", prediction: "U.S. economy is a coiled spring that could bounce back powerfully. Forecasts real GDP growth surging toward 5% with falling inflation and potentially outright deflation, driven by AI-led productivity boom.", asset: null, direction: "bullish", target: "5% real GDP growth", timeframe: "2026", source: "ARK Invest 2026 Outlook Letter", date_stated: "2026-01-15", created: "2026-05-21T12:07:00Z" },
  { id: "seed09", commentator: "Cathie Wood (ARK Invest)", prediction: "AI bubble is years away. The most powerful capital spending cycle in history is coming. What once was the cap in spending has become a floor. Consumers adopting AI at twice the pace of the internet in the 1990s.", asset: "ARKK", direction: "bullish", target: null, timeframe: "2026-2030", source: "ARK Invest 2026 Outlook Letter", date_stated: "2026-01-15", created: "2026-05-21T12:08:00Z" },
  { id: "seed10", commentator: "BCA Research", prediction: "Potential US recession is the main risk. Stays neutral on stocks for now only because AI capital expenditure provides a tailwind. Weakening US labor market is the chief concern.", asset: "S&P 500", direction: "neutral", target: null, timeframe: "2026", source: "BCA Research outlook", date_stated: "2026-01-01", created: "2026-05-21T12:09:00Z" },
  { id: "seed11", commentator: "Ed Yardeni (Yardeni Research)", prediction: "Raised S&P 500 year-end target to 8,250 — the highest on Wall Street. Bumped 2026 EPS estimate to $330 and 2027 to $375. Raised odds of his 'Roaring 2020s' scenario continuing to 80% from 60%.", asset: "S&P 500", direction: "bullish", target: "8,250", timeframe: "Year-end 2026", source: "Fortune / Yardeni Research", date_stated: "2026-05-10", created: "2026-05-22T12:10:00Z" },
  { id: "seed12", commentator: "Tom Lee (Fundstrat)", prediction: "It is 'very probable' stocks will sail past 7,700 this year. Earnings strength and AI momentum continue to support the bull case.", asset: "S&P 500", direction: "bullish", target: "7,700+", timeframe: "2026", source: "CNBC", date_stated: "2026-04-27", created: "2026-05-22T12:11:00Z" },
  { id: "seed13", commentator: "Jamie Dimon (JPMorgan)", prediction: "Valuations, credit spreads, and investor behavior are all signaling people expect a smooth resolution to problems that remain genuinely unresolved. Geopolitical tensions, sticky inflation from the 'One Big Beautiful Bill', and elevated gas prices are being ignored by markets.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2026", source: "JPMorgan / TheStreet", date_stated: "2026-05-01", created: "2026-05-22T12:12:00Z" },
  { id: "seed14", commentator: "Ray Dalio (Bridgewater)", prediction: "The global systems that keep money flowing freely are breaking down. The world is on the brink of a 'capital war' — China and parts of Europe are buying fewer U.S. bonds due to sanctions risk and geopolitical tensions, with major ramifications for stocks.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2026", source: "Motley Fool / Nasdaq", date_stated: "2026-02-15", created: "2026-05-22T12:13:00Z" },
  { id: "seed15", commentator: "Cathie Wood (ARK Invest)", prediction: "ARK Invest bought 85,485 Palantir shares across five ETFs worth ~$11.15M, with ARKK leading the accumulation. Sees Palantir as a core AI infrastructure holding despite Burry's short.", asset: "PLTR", direction: "bullish", target: null, timeframe: "2026", source: "247WallSt / ForeignPolicyJournal", date_stated: "2026-04-15", created: "2026-05-22T12:14:00Z" },
  { id: "seed16", commentator: "Michael Burry", prediction: "Palantir is wildly overvalued and worth less than $50 per share, implying a ~65% decline from current levels. Initiated put options against Palantir as part of broader tech short thesis.", asset: "PLTR", direction: "bearish", target: "<$50", timeframe: null, source: "Insider Monkey / 247WallSt", date_stated: "2026-04-15", created: "2026-05-22T12:15:00Z" },
  { id: "seed17", commentator: "Paul Tudor Jones", prediction: "Current market environment feels similar to 1999, but draws a different conclusion from Burry — the rally could continue for another year or two before a meaningful correction arrives.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2026-2027", source: "CNBC", date_stated: "2026-05-01", created: "2026-05-22T12:16:00Z" },
  { id: "seed18", commentator: "Morgan Stanley", prediction: "S&P 500 to reach 7,800 by year-end, supported by earnings growth and continued AI capital expenditure. Political risks remain a key uncertainty for the second half.", asset: "S&P 500", direction: "bullish", target: "7,800", timeframe: "Year-end 2026", source: "Morgan Stanley Market Outlook", date_stated: "2026-01-01", created: "2026-05-22T12:17:00Z" },
  { id: "seed19", commentator: "UBS Global Wealth Management", prediction: "S&P 500 to reach 7,500 by year-end. All major Wall Street analysts now predict a stock rally in 2026, with the median forecast pointing to roughly 10% gains.", asset: "S&P 500", direction: "bullish", target: "7,500", timeframe: "Year-end 2026", source: "AdvisorHub", date_stated: "2026-01-01", created: "2026-05-22T12:18:00Z" },
  { id: "seed20", commentator: "RBC Capital Markets", prediction: "S&P 500 target of 7,900 for year-end 2026. Strong earnings growth of 10%+ in revenues and expanding operating margins to ~16% all-time highs support the bull case.", asset: "S&P 500", direction: "bullish", target: "7,900", timeframe: "Year-end 2026", source: "AdvisorHub / TheStreet", date_stated: "2026-01-01", created: "2026-05-22T12:19:00Z" }
];

var EMPTY_FORM = {
  commentator: "",
  prediction: "",
  asset: "",
  direction: "bullish",
  target: "",
  timeframe: "",
  source: "",
  date_stated: "",
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function dirColor(dir) {
  if (dir === "bullish") return "#22c55e";
  if (dir === "bearish") return "#ef4444";
  return "#a1a1aa";
}

function dirBg(dir) {
  if (dir === "bullish") return "rgba(34,197,94,0.08)";
  if (dir === "bearish") return "rgba(239,68,68,0.08)";
  return "rgba(161,161,170,0.06)";
}

var storage = {
  get: async function(key) {
    try {
      var val = localStorage.getItem(key);
      return val !== null ? { value: val } : null;
    } catch(e) { return null; }
  },
  set: async function(key, value) {
    try { localStorage.setItem(key, value); } catch(e) {}
  },
  delete: async function(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  },
};

async function loadData() {
  try {
    var result = await storage.get(STORAGE_KEY);
    if (result) {
      var parsed = JSON.parse(result.value);
      if (parsed.predictions && parsed.predictions.length > 0) return parsed;
    }
  } catch (e) {}
  var seeded = { predictions: SEED_DATA.slice() };
  try { await storage.set(STORAGE_KEY, JSON.stringify(seeded)); } catch(e) {}
  return seeded;
}

async function saveData(data) {
  try { await storage.set(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error("Save failed:", e); }
}

async function loadPin() {
  try {
    var result = await storage.get(PIN_KEY);
    return result ? result.value : DEFAULT_PIN;
  } catch(e) { return DEFAULT_PIN; }
}

async function savePin(pin) {
  try { await storage.set(PIN_KEY, pin); } catch(e) {}
}

function StatCard(props) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "18px 20px", flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, color: "#78716c", marginBottom: 6, fontFamily: monoFont }}>{props.label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: props.accent || "#fafaf9", fontFamily: headFont, lineHeight: 1.1 }}>{props.value}</div>
    </div>
  );
}

function PredictionCard(props) {
  var pred = props.pred;
  var isAdmin = props.isAdmin;
  var fields = [
    pred.target ? "Target: " + pred.target : null,
    pred.timeframe ? "By: " + pred.timeframe : null,
    pred.source ? "Via: " + pred.source : null,
    pred.date_stated ? "Said: " + pred.date_stated : null,
    "Logged: " + new Date(pred.created).toLocaleDateString(),
  ].filter(Boolean);

  return (
    <div style={{ background: dirBg(pred.direction), border: "1px solid " + dirColor(pred.direction) + "33", borderRadius: 10, padding: "16px 20px", marginBottom: 10, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#fafaf9" }}>{pred.commentator}</span>
            <span style={{
              fontSize: 10, textTransform: "uppercase", letterSpacing: 1,
              padding: "2px 8px", borderRadius: 4,
              background: dirColor(pred.direction) + "22",
              color: dirColor(pred.direction),
              fontFamily: monoFont, fontWeight: 600,
            }}>{pred.direction}</span>
            {pred.asset && (
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 4,
                background: "rgba(255,255,255,0.06)", color: "#d6d3d1", fontFamily: monoFont,
              }}>{pred.asset}</span>
            )}
          </div>
          <div style={{ fontSize: 14, color: "#d6d3d1", lineHeight: 1.5, marginBottom: 6, fontStyle: "italic" }}>
            {pred.prediction}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, color: "#78716c", fontFamily: monoFont }}>
            {fields.map(function(f, idx) { return <span key={idx}>{f}</span>; })}
          </div>
        </div>
        {isAdmin && (
          <button onClick={function() { props.onDelete(pred.id); }} style={{
            background: "rgba(120,113,108,0.15)", color: "#78716c",
            border: "1px solid rgba(120,113,108,0.3)", borderRadius: 5,
            padding: "4px 10px", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: monoFont,
            alignSelf: "flex-start",
          }}>Delete</button>
        )}
      </div>
    </div>
  );
}

export default function PunditTracker() {
  const [data, setData] = useState({ predictions: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [filterCommentator, setFilterCommentator] = useState("all");
  const [filterDirection, setFilterDirection] = useState("all");
  const [confirmReset, setConfirmReset] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [storedPin, setStoredPin] = useState(DEFAULT_PIN);
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [titleClicks, setTitleClicks] = useState(0);
  const [titleClickTimer, setTitleClickTimer] = useState(null);
  const [punditDetail, setPunditDetail] = useState(null);

  useEffect(function() {
    var cancelled = false;
    async function init() {
      var loaded = await loadData();
      var pin = await loadPin();
      if (cancelled) return;
      setData(loaded);
      setStoredPin(pin);
      setLoading(false);
    }
    init();
    return function() { cancelled = true; };
  }, []);

  var persist = useCallback(async function(newData) {
    setData(newData);
    await saveData(newData);
  }, []);

  var handleLogin = function() {
    if (pinInput === storedPin) {
      setIsAdmin(true);
      setShowLogin(false);
      setPinInput("");
      setPinError("");
    } else {
      setPinError("Wrong PIN");
      setPinInput("");
    }
  };

  var handleTitleClick = function() {
    var next = titleClicks + 1;
    setTitleClicks(next);
    if (titleClickTimer) clearTimeout(titleClickTimer);
    if (next >= 5) {
      setTitleClicks(0);
      if (!isAdmin) { setShowLogin(true); setPinError(""); setPinInput(""); }
    } else {
      var t = setTimeout(function() { setTitleClicks(0); }, 1500);
      setTitleClickTimer(t);
    }
  };

  var handleChangePin = async function() {
    if (newPinInput.length < 4) { setPinError("PIN must be at least 4 characters"); return; }
    if (newPinInput !== confirmNewPin) { setPinError("PINs don't match"); return; }
    await savePin(newPinInput);
    setStoredPin(newPinInput);
    setNewPinInput(""); setConfirmNewPin(""); setShowChangePin(false); setPinError("");
  };

  var handleFormChange = function(field, value) {
    setForm(function(prev) { return Object.assign({}, prev, { [field]: value }); });
    setFormError("");
  };

  var handleSavePrediction = async function() {
    if (!form.commentator.trim()) { setFormError("Commentator is required"); return; }
    if (!form.prediction.trim()) { setFormError("Prediction is required"); return; }
    var pred = {
      id: genId(),
      created: new Date().toISOString(),
      commentator: form.commentator.trim(),
      prediction: form.prediction.trim(),
      asset: form.asset.trim() || null,
      direction: form.direction,
      target: form.target.trim() || null,
      timeframe: form.timeframe.trim() || null,
      source: form.source.trim() || null,
      date_stated: form.date_stated || null,
    };
    var newData = { predictions: [pred].concat(data.predictions) };
    await persist(newData);
    setForm(EMPTY_FORM);
    setView("dashboard");
  };

  var handleDelete = async function(id) {
    var newPreds = data.predictions.filter(function(p) { return p.id !== id; });
    await persist({ predictions: newPreds });
  };

  var handleReset = async function() {
    try { await storage.delete(STORAGE_KEY); } catch(e) {}
    var seeded = { predictions: SEED_DATA.slice() };
    await persist(seeded);
    setConfirmReset(false);
  };

  var total = data.predictions.length;
  var bullish = data.predictions.filter(function(p) { return p.direction === "bullish"; }).length;
  var bearish = data.predictions.filter(function(p) { return p.direction === "bearish"; }).length;
  var neutral = data.predictions.filter(function(p) { return p.direction === "neutral"; }).length;

  var commentatorNames = [];
  var seen = {};
  data.predictions.forEach(function(p) {
    if (p.commentator && !seen[p.commentator]) { seen[p.commentator] = true; commentatorNames.push(p.commentator); }
  });
  commentatorNames.sort();

  var leaderboard = commentatorNames.map(function(name) {
    var preds = data.predictions.filter(function(p) { return p.commentator === name; });
    var b = preds.filter(function(p) { return p.direction === "bullish"; }).length;
    var br = preds.filter(function(p) { return p.direction === "bearish"; }).length;
    return { name: name, total: preds.length, bullish: b, bearish: br };
  });
  leaderboard.sort(function(a, b) { return b.total - a.total; });

  var filtered = data.predictions.filter(function(p) {
    if (filterCommentator !== "all" && p.commentator !== filterCommentator) return false;
    if (filterDirection !== "all" && p.direction !== filterDirection) return false;
    return true;
  });

  var inputStyle = {
    background: "rgba(0,0,0,0.3)", color: "#fafaf9",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6,
    padding: "8px 12px", fontSize: 13, fontFamily: monoFont,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  var labelStyle = { fontSize: 11, color: "#78716c", fontFamily: monoFont, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 1 };

  var navItems = [{ key: "dashboard", label: "Feed" }];
  if (isAdmin) navItems.push({ key: "add", label: "+ Add" });
  navItems.push({ key: "leaderboard", label: "Pundits" });

  if (loading) {
    return (
      <div style={Object.assign({}, shellStyle, { display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 })}>
        <div style={{ color: "#78716c", fontFamily: monoFont }}>Loading tracker...</div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div onClick={handleTitleClick} style={{ cursor: "default", userSelect: "none" }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fafaf9", letterSpacing: -0.5, fontFamily: headFont }}>PUNDIT TRACKER</h1>
            <div style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont, letterSpacing: 1, marginTop: 2 }}>FINANCIAL COMMENTARY LOG</div>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {navItems.map(function(item) {
              var active = view === item.key;
              return (
                <button key={item.key} onClick={function() { setView(item.key); setPunditDetail(null); }} style={{
                  background: active ? "rgba(250,204,21,0.15)" : "transparent",
                  color: active ? "#facc15" : "#78716c",
                  border: "1px solid " + (active ? "#facc1544" : "rgba(255,255,255,0.06)"),
                  borderRadius: 6, padding: "6px 14px", cursor: "pointer",
                  fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, fontFamily: monoFont,
                }}>{item.label}</button>
              );
            })}
            {isAdmin && (
              <button onClick={function() { setIsAdmin(false); setView("dashboard"); setShowChangePin(false); }} style={{
                background: "rgba(34,197,94,0.12)",
                color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 6, padding: "6px 10px", cursor: "pointer",
                fontSize: 13, fontFamily: monoFont, lineHeight: 1,
              }}>🔓</button>
            )}
          </div>
        </div>
      </div>

      {/* Login panel */}
      {showLogin && !isAdmin && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "#fafaf9", marginBottom: 10, fontFamily: headFont }}>Enter Admin PIN</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="password" value={pinInput}
              onChange={function(e) { setPinInput(e.target.value); setPinError(""); }}
              onKeyDown={function(e) { if (e.key === "Enter") handleLogin(); }}
              placeholder="PIN" style={Object.assign({}, inputStyle, { maxWidth: 160 })} autoFocus />
            <button onClick={handleLogin} style={{ background: "#facc15", color: "#0c0a09", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: headFont }}>Unlock</button>
            <button onClick={function() { setShowLogin(false); }} style={{ background: "transparent", color: "#78716c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontFamily: monoFont }}>Cancel</button>
          </div>
          {pinError && <div style={{ color: "#ef4444", fontSize: 11, fontFamily: monoFont, marginTop: 6 }}>{pinError}</div>}
        </div>
      )}

      {/* Change PIN panel */}
      {isAdmin && showChangePin && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "#fafaf9", marginBottom: 10, fontFamily: headFont }}>Change PIN</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 240 }}>
            <input type="password" value={newPinInput} onChange={function(e) { setNewPinInput(e.target.value); setPinError(""); }} placeholder="New PIN (min 4 chars)" style={inputStyle} />
            <input type="password" value={confirmNewPin} onChange={function(e) { setConfirmNewPin(e.target.value); setPinError(""); }} placeholder="Confirm new PIN" style={inputStyle} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleChangePin} style={{ background: "#facc15", color: "#0c0a09", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: headFont }}>Save PIN</button>
              <button onClick={function() { setShowChangePin(false); setNewPinInput(""); setConfirmNewPin(""); setPinError(""); }} style={{ background: "transparent", color: "#78716c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontFamily: monoFont }}>Cancel</button>
            </div>
          </div>
          {pinError && <div style={{ color: "#ef4444", fontSize: 11, fontFamily: monoFont, marginTop: 6 }}>{pinError}</div>}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total" value={total} />
        <StatCard label="Bullish" value={bullish} accent="#22c55e" />
        <StatCard label="Bearish" value={bearish} accent="#ef4444" />
        <StatCard label="Neutral" value={neutral} accent="#a1a1aa" />
      </div>

      {/* Add view */}
      {view === "add" && isAdmin && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 24 }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 15, color: "#fafaf9", fontFamily: headFont }}>Log a Call</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Commentator *</label>
              <input value={form.commentator} onChange={function(e) { handleFormChange("commentator", e.target.value); }} placeholder="e.g. Jim Cramer" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Prediction *</label>
              <textarea value={form.prediction} onChange={function(e) { handleFormChange("prediction", e.target.value); }} placeholder="What did they say?" style={Object.assign({}, inputStyle, { minHeight: 80, resize: "vertical", lineHeight: 1.5 })} />
            </div>
            <div>
              <label style={labelStyle}>Direction *</label>
              <select value={form.direction} onChange={function(e) { handleFormChange("direction", e.target.value); }} style={Object.assign({}, inputStyle, { cursor: "pointer" })}>
                <option value="bullish">Bullish</option>
                <option value="bearish">Bearish</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Asset / Ticker</label>
              <input value={form.asset} onChange={function(e) { handleFormChange("asset", e.target.value); }} placeholder="e.g. S&P 500, TSLA" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Price Target</label>
              <input value={form.target} onChange={function(e) { handleFormChange("target", e.target.value); }} placeholder="e.g. $400 or +15%" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Timeframe</label>
              <input value={form.timeframe} onChange={function(e) { handleFormChange("timeframe", e.target.value); }} placeholder="e.g. Year-end 2026" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Source</label>
              <input value={form.source} onChange={function(e) { handleFormChange("source", e.target.value); }} placeholder="e.g. CNBC Mad Money" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date Stated</label>
              <input type="date" value={form.date_stated} onChange={function(e) { handleFormChange("date_stated", e.target.value); }} style={Object.assign({}, inputStyle, { colorScheme: "dark" })} />
            </div>
          </div>
          {formError && <div style={{ color: "#ef4444", fontSize: 12, fontFamily: monoFont, marginTop: 10 }}>{formError}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button onClick={handleSavePrediction} style={{ background: "#facc15", color: "#0c0a09", border: "none", borderRadius: 6, padding: "10px 22px", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: headFont }}>Save</button>
            <button onClick={function() { setForm(EMPTY_FORM); setFormError(""); setView("dashboard"); }} style={{ background: "transparent", color: "#78716c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 18px", cursor: "pointer", fontSize: 13, fontFamily: monoFont }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Dashboard view */}
      {view === "dashboard" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            {total > 0 && (
              <React.Fragment>
                <select value={filterCommentator} onChange={function(e) { setFilterCommentator(e.target.value); }} style={selectStyle}>
                  <option value="all">All Commentators</option>
                  {commentatorNames.map(function(n) { return <option key={n} value={n}>{n}</option>; })}
                </select>
                <select value={filterDirection} onChange={function(e) { setFilterDirection(e.target.value); }} style={selectStyle}>
                  <option value="all">All Directions</option>
                  <option value="bullish">Bullish</option>
                  <option value="bearish">Bearish</option>
                  <option value="neutral">Neutral</option>
                </select>
                <span style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
              </React.Fragment>
            )}
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#57534e" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
              <div style={{ fontSize: 14, fontFamily: headFont }}>{total === 0 ? "No calls logged yet" : "No matches for these filters"}</div>
            </div>
          ) : (
            filtered.map(function(p) {
              return <PredictionCard key={p.id} pred={p} onDelete={handleDelete} isAdmin={isAdmin} />;
            })
          )}
        </div>
      )}

      {/* Leaderboard view */}
      {view === "leaderboard" && !punditDetail && (
        <div>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, color: "#fafaf9", fontFamily: headFont }}>Commentators</h2>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#57534e", fontSize: 14, fontFamily: headFont }}>No commentators tracked yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {leaderboard.map(function(c, i) {
                return (
                  <div key={c.name} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10, padding: "14px 18px", cursor: "pointer",
                  }} onClick={function() { setPunditDetail(c.name); }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: i === 0 ? "rgba(250,204,21,0.13)" : "rgba(255,255,255,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 800,
                      color: i === 0 ? "#facc15" : "#78716c",
                      fontFamily: headFont,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#fafaf9", fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont }}>
                        {c.total} call{c.total !== 1 ? "s" : ""} · {c.bullish} bullish · {c.bearish} bearish
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont }}>View →</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pundit detail view */}
      {view === "leaderboard" && punditDetail && (function() {
        var pundPreds = data.predictions.filter(function(p) { return p.commentator === punditDetail; });
        var pundBullish = pundPreds.filter(function(p) { return p.direction === "bullish"; }).length;
        var pundBearish = pundPreds.filter(function(p) { return p.direction === "bearish"; }).length;
        var pundNeutral = pundPreds.filter(function(p) { return p.direction === "neutral"; }).length;
        return (
          <div>
            {/* Back button + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={function() { setPunditDetail(null); }} style={{
                background: "transparent", color: "#78716c",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
                padding: "5px 12px", cursor: "pointer", fontSize: 11,
                fontFamily: monoFont, display: "flex", alignItems: "center", gap: 6,
              }}>← Back</button>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fafaf9", fontFamily: headFont }}>{punditDetail}</h2>
            </div>

            {/* Mini stats */}
            <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
              {[
                { label: "Total", value: pundPreds.length, color: "#fafaf9" },
                { label: "Bullish", value: pundBullish, color: "#22c55e" },
                { label: "Bearish", value: pundBearish, color: "#ef4444" },
                { label: "Neutral", value: pundNeutral, color: "#a1a1aa" },
              ].map(function(s) {
                return (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 16px" }}>
                    <div style={{ fontSize: 10, color: "#78716c", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: headFont, lineHeight: 1 }}>{s.value}</div>
                  </div>
                );
              })}
            </div>

            {/* Chart */}
            <PunditChart predictions={pundPreds} />

            {/* Predictions list */}
            <div style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              All Calls
            </div>
            {pundPreds.map(function(p) {
              return <PredictionCard key={p.id} pred={p} onDelete={handleDelete} isAdmin={isAdmin} />;
            })}
          </div>
        );
      })()}

      {/* Admin footer */}
      {isAdmin && total > 0 && (
        <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <button onClick={function() { setShowChangePin(!showChangePin); }} style={{ background: "transparent", color: "#78716c", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontSize: 10, fontFamily: monoFont }}>Change PIN</button>
          <div>
            {confirmReset ? (
              <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#ef4444", fontFamily: monoFont }}>Reset to original data?</span>
                <button onClick={handleReset} style={{ background: "rgba(239,68,68,0.13)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: monoFont }}>Yes, reset</button>
                <button onClick={function() { setConfirmReset(false); }} style={{ background: "rgba(120,113,108,0.15)", color: "#78716c", border: "1px solid rgba(120,113,108,0.3)", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: monoFont }}>Cancel</button>
              </div>
            ) : (
              <button onClick={function() { setConfirmReset(true); }} style={{ background: "transparent", color: "#57534e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontSize: 10, fontFamily: monoFont }}>Reset All Data</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
