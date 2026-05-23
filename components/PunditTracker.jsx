import React, { useState, useEffect, useCallback } from "react";
import PunditChart from "./PunditChart";

const STORAGE_KEY = "pundit-tracker-v4";
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
  background: "#000000",
  color: "#ffffff",
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
  { id: "seed10", commentator: "BCA Research", prediction: "Potential US recession is the main risk. Stays neutral on stocks for now only because AI capital expenditure provides a tailwind. Weakening US labor market is the chief concern.", asset: "S&P 500", direction: "neutral", target: null, timeframe: "2026", source: "BCA Research outlook", date_stated: "2026-01-01", created: "2026-05-21T12:09:00Z" },
  { id: "seed11", commentator: "Ed Yardeni (Yardeni Research)", prediction: "Raised S&P 500 year-end target to 8,250 — the highest on Wall Street. Bumped 2026 EPS estimate to $330 and 2027 to $375. Raised odds of his 'Roaring 2020s' scenario continuing to 80% from 60%.", asset: "S&P 500", direction: "bullish", target: "8,250", timeframe: "Year-end 2026", source: "Fortune / Yardeni Research", date_stated: "2026-05-10", created: "2026-05-22T12:10:00Z" },
  { id: "seed12", commentator: "Tom Lee (Fundstrat)", prediction: "It is 'very probable' stocks will sail past 7,700 this year. Earnings strength and AI momentum continue to support the bull case.", asset: "S&P 500", direction: "bullish", target: "7,700+", timeframe: "2026", source: "CNBC", date_stated: "2026-04-27", created: "2026-05-22T12:11:00Z" },
  { id: "seed13", commentator: "Jamie Dimon (JPMorgan)", prediction: "Valuations, credit spreads, and investor behavior are all signaling people expect a smooth resolution to problems that remain genuinely unresolved. Geopolitical tensions, sticky inflation from the 'One Big Beautiful Bill', and elevated gas prices are being ignored by markets.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2026", source: "JPMorgan / TheStreet", date_stated: "2026-05-01", created: "2026-05-22T12:12:00Z" },
  { id: "seed14", commentator: "Ray Dalio (Bridgewater)", prediction: "The global systems that keep money flowing freely are breaking down. The world is on the brink of a 'capital war' — China and parts of Europe are buying fewer U.S. bonds due to sanctions risk and geopolitical tensions, with major ramifications for stocks.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2026", source: "Motley Fool / Nasdaq", date_stated: "2026-02-15", created: "2026-05-22T12:13:00Z" },
  { id: "seed17", commentator: "Paul Tudor Jones", prediction: "Current market environment feels similar to 1999, but draws a different conclusion from Burry — the rally could continue for another year or two before a meaningful correction arrives.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2026-2027", source: "CNBC", date_stated: "2026-05-01", created: "2026-05-22T12:16:00Z" },
  { id: "seed18", commentator: "Morgan Stanley", prediction: "S&P 500 to reach 7,800 by year-end, supported by earnings growth and continued AI capital expenditure. Political risks remain a key uncertainty for the second half.", asset: "S&P 500", direction: "bullish", target: "7,800", timeframe: "Year-end 2026", source: "Morgan Stanley Market Outlook", date_stated: "2026-01-01", created: "2026-05-22T12:17:00Z" },
  { id: "seed19", commentator: "UBS Global Wealth Management", prediction: "S&P 500 to reach 7,500 by year-end. All major Wall Street analysts now predict a stock rally in 2026, with the median forecast pointing to roughly 10% gains.", asset: "S&P 500", direction: "bullish", target: "7,500", timeframe: "Year-end 2026", source: "AdvisorHub", date_stated: "2026-01-01", created: "2026-05-22T12:18:00Z" },
  { id: "seed20", commentator: "RBC Capital Markets", prediction: "S&P 500 target of 7,900 for year-end 2026. Strong earnings growth of 10%+ in revenues and expanding operating margins to ~16% all-time highs support the bull case.", asset: "S&P 500", direction: "bullish", target: "7,900", timeframe: "Year-end 2026", source: "AdvisorHub / TheStreet", date_stated: "2026-01-01", created: "2026-05-22T12:19:00Z" },
  { id: "seed21", commentator: "Warren Buffett", prediction: "Many investors are in a 'gambling mood' right now. The 2026 market dip isn't big enough to deploy Berkshire's $373B cash pile. Current valuations don't present a compelling enough opportunity to act.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2026", source: "Motley Fool / TheStreet", date_stated: "2026-05-12", created: "2026-05-22T12:20:00Z" },
  { id: "seed22", commentator: "Warren Buffett", prediction: "Buffett Valuation Indicator sits at 222% of GDP — far exceeding the 90–135% historical 'fair value' range. The indicator Buffett himself popularized is flashing its loudest warning in decades.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2026", source: "Advisor Perspectives / ainvest.com", date_stated: "2026-05-06", created: "2026-05-22T12:21:00Z" },
  { id: "seed29", commentator: "Peter Schiff (Euro Pacific Capital)", prediction: "U.S. stocks are in a 'historic bear market' despite appearances. The AI rally is an unsustainable bubble. Bond holders will be 'killed.' Investors must rotate into gold and mining stocks before it's too late.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2026", source: "Yahoo Finance / Benzinga", date_stated: "2026-01-01", created: "2026-05-22T12:28:00Z" },
  { id: "seed30", commentator: "John Stoltzfus (Oppenheimer)", prediction: "S&P 500 to reach 8,100 by year-end 2026 — a Street-high target at the time. Remains broadly overweight US equities with selective fixed income exposure and modest gold allocation. 'The bull remains intact.'", asset: "S&P 500", direction: "bullish", target: "8,100", timeframe: "Year-end 2026", source: "CNBC / Yahoo Finance", date_stated: "2026-01-06", created: "2026-05-22T12:29:00Z" },
  { id: "seed31", commentator: "Nouriel Roubini (Atlas Capital)", prediction: "Breaks with bear consensus: AI is not a bubble. AI + quantum computing + robotics + defense and automation could double US GDP growth from 2% to 4%. High valuations are rational and acceptable given the innovation cycle.", asset: "S&P 500", direction: "neutral", target: "4% GDP growth", timeframe: "2026-2030", source: "Yahoo Finance", date_stated: "2026-01-01", created: "2026-05-22T12:30:00Z" },
  { id: "seed33", commentator: "JPMorgan Global Research", prediction: "Forecasts double-digit equity gains across both DM and EM in 2026, buttressed by robust earnings, lower rates, declining policy headwinds, and continued AI capex. Maintains 35% US recession probability as tail risk.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2026", source: "JPMorgan Global Research Outlook", date_stated: "2026-01-01", created: "2026-05-22T12:32:00Z" },
  { id: "seed34", commentator: "Goldman Sachs Research", prediction: "'Marathon bull market' thesis: 12% S&P 500 total return driven by five AI-linked themes. The 22x forward P/E is 'justified by earnings durability' and a Goldilocks macro backdrop. EPS forecast: $305–$309.", asset: "S&P 500", direction: "bullish", target: "7,600", timeframe: "Year-end 2026", source: "FinancialContent / Goldman Sachs", date_stated: "2026-02-12", created: "2026-05-22T12:33:00Z" },
  { id: "seed35", commentator: "David Kostin (Goldman Sachs)", prediction: "Retiring after 30 years at Goldman. Landmark final call: set original year-end S&P 500 target of 7,200, later raised to 7,600. Core thesis: 'fundamental floor from earnings, not speculation.' Succeeded by Ben Snider.", asset: "S&P 500", direction: "bullish", target: "7,200", timeframe: "Year-end 2026", source: "FinancialContent / Goldman Sachs", date_stated: "2025-12-22", created: "2026-05-22T12:34:00Z" },
  { id: "seed37", commentator: "NatWest Markets", prediction: "Spies 'a powerful engine of economic expansion' in AI. Forecasts a multi-year above-trend growth cycle as AI-driven productivity gains compound across industries. Overweight equities globally.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2026-2028", source: "Bloomberg 2026 Investment Outlooks", date_stated: "2026-01-01", created: "2026-05-22T12:36:00Z" },
  { id: "seed38", commentator: "Vanguard", prediction: "Forecasts only 0.1–3.3% real annual US equity returns over the next decade. Elevated current valuations are the primary constraint vs the past 20 years of strong gains. US equities look relatively expensive vs international.", asset: "S&P 500", direction: "neutral", target: "0–3% real annual return", timeframe: "10-year outlook", source: "Morningstar Canada / Vanguard Research", date_stated: "2026-01-01", created: "2026-05-22T12:37:00Z" },
  { id: "seed39", commentator: "Jeremy Siegel (Wharton)", prediction: "Structural market changes — including zero-cost indexing and reduced transaction costs — justify permanently higher warranted P/E ratios than history suggests. The CAPE and Buffett Indicator overstate current overvaluation.", asset: "S&P 500", direction: "neutral", target: null, timeframe: "2026", source: "ainvest.com / Wharton commentary", date_stated: "2026-01-01", created: "2026-05-22T12:38:00Z" },
  { id: "seed40", commentator: "Jeff Gundlach (DoubleLine)", prediction: "'I think it's time to call it a day on riding the S&P 500.' Prefers metals, commodities, foreign stocks, local currency EM bonds, real assets, gold, and high-quality bonds. Against private credit. Expects de-dollarization to continue.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2026", source: "Advisor Perspectives / DoubleLine webcast", date_stated: "2026-01-14", created: "2026-05-22T12:39:00Z" },
  { id: "seed42", commentator: "Robert Shiller (Yale)", prediction: "Shiller CAPE ratio has surged above 40x — more than double the 17x historical average and well above the levels that preceded the 2000 and 2008 crashes. Current valuations warrant significant caution.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2026", source: "ainvest.com / Advisor Perspectives", date_stated: "2026-04-01", created: "2026-05-22T12:41:00Z" },
  { id: "seed43", commentator: "JPMorgan Asset Management", prediction: "35% probability of US and global recession in H2 2026 as fiscal tailwinds fade and labor market deteriorates. Consumer spending slowdown is the key trigger to watch. Recommends selective positioning heading into H2.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "H2 2026", source: "JPMorgan Mid-Year Outlook 2026", date_stated: "2026-01-01", created: "2026-05-22T12:42:00Z" },
  { id: "seed44", commentator: "Scott Bessent (US Treasury)", prediction: "Markets may be 'pricing in a smooth resolution to problems that remain genuinely unresolved.' Watching whether AI capex justifies current extreme valuations. Magnificent 7 already down ~7% YTD even as AI spending surges.", asset: "S&P 500", direction: "neutral", target: null, timeframe: "2026", source: "Yahoo Finance / Fortune", date_stated: "2026-04-01", created: "2026-05-22T12:43:00Z" },
  { id: "seed45", commentator: "Bloomberg Intelligence (60+ institutions)", prediction: "Optimism nearly universal across 60+ global institutions surveyed. Median S&P 500 year-end target of 7,650 implying ~8% upside from current levels. FactSet bottom-up targets suggest ~15% upside over the next 12 months.", asset: "S&P 500", direction: "bullish", target: "7,650", timeframe: "Year-end 2026", source: "Bloomberg / CNN Business", date_stated: "2026-05-01", created: "2026-05-22T12:44:00Z" },

  // ── 2021 calls ───────────────────────────────────────────────────────────────
  { id: "seed74", commentator: "Jeremy Grantham (GMO)", prediction: "'The long, long bull market since 2009 has finally matured into a fully-fledged epic bubble.' In his 'Waiting for the Last Dance' note, predicted a crash like 1929, 2000, and 2008. 'All the hallmarks are there: extreme overvaluation, explosive price increases, frenzied issuance, and hysterically speculative investor behavior.'", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2021-2022", source: "GMO research note 'Waiting for the Last Dance'", date_stated: "2021-01-05", created: "2026-05-22T13:13:00Z" },
  { id: "seed75", commentator: "Goldman Sachs", prediction: "Set year-end 2021 S&P 500 target at 4,300 — an 11% gain from year-end 2020 levels. Cited vaccine rollout, fiscal stimulus, and strong earnings recovery as key drivers. S&P 500 ended 2021 at 4,766, exceeding this target by over 10%.", asset: "S&P 500", direction: "bullish", target: "4,300", timeframe: "Year-end 2021", source: "Goldman Sachs Research", date_stated: "2021-01-01", created: "2026-05-22T13:14:00Z" },
  { id: "seed76", commentator: "JPMorgan Global Research", prediction: "Set 2021 year-end S&P 500 target at 4,400, describing the backdrop as 'one of the best for sustained equity gains in years.' Cited reopening momentum, pent-up consumer demand, and fiscal stimulus. S&P finished the year 8% above their target at 4,766.", asset: "S&P 500", direction: "bullish", target: "4,400", timeframe: "Year-end 2021", source: "JPMorgan Global Research Outlook", date_stated: "2021-01-01", created: "2026-05-22T13:15:00Z" },
  { id: "seed77", commentator: "Michael Burry", prediction: "'We are in the greatest speculative bubble of all time in all things.' Warned meme stock and crypto buyers were headed for the 'mother of all crashes.' Also tweeted 'Prepare for #inflation' — noting it took $3 of new debt to create $1 of GDP pre-COVID and was getting worse. Both the bubble warning and inflation call proved accurate.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2021-2022", source: "Twitter (@michaeljburry) / Bloomberg", date_stated: "2021-02-01", created: "2026-05-22T13:16:00Z" },
  { id: "seed78", commentator: "Jay Powell (Federal Reserve)", prediction: "'Inflation is transitory.' Dismissed surging price pressures as temporary supply-chain disruptions that would resolve without rate hikes. Kept rates near zero and maintained $120B/month in QE purchases throughout 2021. Widely regarded as one of the most consequential wrong calls in Federal Reserve history.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2021", source: "FOMC press conferences / Congressional testimony", date_stated: "2021-06-16", created: "2026-05-22T13:17:00Z" },

  // ── 2022 calls ───────────────────────────────────────────────────────────────
  { id: "seed79", commentator: "Goldman Sachs", prediction: "Set year-end 2022 S&P 500 target at 4,900, implying a modest 3% gain from 2021's close. By June, Goldman cut the target to 4,300 as 40-year-high inflation and aggressive Fed rate hikes crushed valuations. The S&P 500 closed 2022 at 3,840 — down 19% — making this one of Goldman's worst annual calls.", asset: "S&P 500", direction: "bullish", target: "4,900", timeframe: "Year-end 2022", source: "Goldman Sachs Research / CNBC", date_stated: "2022-01-01", created: "2026-05-22T13:18:00Z" },
  { id: "seed80", commentator: "Jeremy Grantham (GMO)", prediction: "'Let the wild rumpus begin.' The superbubble is deflating. Predicted S&P 500 fair value near 3,000 — another 35% decline from levels at the time. 'You will have a gut-wrenching decline.' Called it the fourth great superbubble in US history after 1929, 2000, and 2008. S&P did fall 19% in 2022, partially validating the call.", asset: "S&P 500", direction: "bearish", target: "~3,000", timeframe: "2022-2024", source: "Bloomberg / GMO research note", date_stated: "2022-01-20", created: "2026-05-22T13:19:00Z" },
  { id: "seed81", commentator: "Mike Wilson (Morgan Stanley)", prediction: "Flagged a 'bear market rally' setting up for a nasty correction. Called for S&P 500 to bottom around 3,400 in a soft landing or 3,000 in a recession — the most bearish major Wall Street forecast. Was widely mocked early in 2022 but proved the most accurate major strategist of the year as the S&P fell 19%.", asset: "S&P 500", direction: "bearish", target: "3,400–3,000", timeframe: "2022", source: "Morgan Stanley / CNBC", date_stated: "2022-04-04", created: "2026-05-22T13:20:00Z" },
  { id: "seed82", commentator: "Nouriel Roubini", prediction: "'Expect a long and ugly recession and a stock drop of 40%.' Predicted the Fed would be forced to choose between fighting inflation and preventing a financial crisis — and couldn't do both. 'Stocks have to go much lower. There are going to be many negative surprises.' S&P fell 19% in 2022 but avoided the full 40% scenario.", asset: "S&P 500", direction: "bearish", target: "−40%", timeframe: "2022-2023", source: "ThinkAdvisor / Fortune", date_stated: "2022-09-22", created: "2026-05-22T13:21:00Z" },
  { id: "seed83", commentator: "Tom Lee (Fundstrat)", prediction: "Set a year-end 2022 S&P 500 target of ~5,000, remaining bullish as the year began. Was significantly wrong — 40-year-high inflation and 425 bps of Fed rate hikes sent the S&P 500 down 19% to close at 3,840, one of the worst years since the 2008 financial crisis.", asset: "S&P 500", direction: "bullish", target: "~5,000", timeframe: "Year-end 2022", source: "Fundstrat / CNBC", date_stated: "2022-01-01", created: "2026-05-22T13:22:00Z" },

  // ── 2023 calls ───────────────────────────────────────────────────────────────
  { id: "seed84", commentator: "Mike Wilson (Morgan Stanley)", prediction: "'Stocks will drop another 24% in early 2023 — S&P 500 target: 3,900.' Predicted earnings downgrades would force a final capitulation. Doubled down on his bearish stance even as markets rallied. Was the most wrong major forecaster of 2023 — the S&P gained 24% to close at 4,770. Wilson later admitted: 'We were wrong.'", asset: "S&P 500", direction: "bearish", target: "3,900", timeframe: "Year-end 2023", source: "Morgan Stanley / Fortune / CNBC", date_stated: "2023-01-01", created: "2026-05-22T13:23:00Z" },
  { id: "seed85", commentator: "Marko Kolanovic (JPMorgan)", prediction: "Remained bearish on US equities and urged investors to shift out of stocks just as the AI rally began. Year-end 2023 S&P 500 target: ~4,200. The S&P closed 2023 at 4,770 — Kolanovic was wrong. His multi-year streak of bearish miscalls eventually led to his departure from JPMorgan in July 2024 after 19 years.", asset: "S&P 500", direction: "bearish", target: "4,200", timeframe: "Year-end 2023", source: "JPMorgan / Fortune", date_stated: "2023-01-01", created: "2026-05-22T13:24:00Z" },
  { id: "seed86", commentator: "Tom Lee (Fundstrat)", prediction: "Set S&P 500 year-end 2023 target at 4,750 — the most bullish major Wall Street forecast at the time. Argued the consensus was too bearish and that falling inflation plus AI enthusiasm would drive a new bull market. S&P ended 2023 at 4,769 — Lee's call was accurate to within 0.4%, earning him 'best forecaster of 2023.'", asset: "S&P 500", direction: "bullish", target: "4,750", timeframe: "Year-end 2023", source: "CNBC / Fundstrat / Bloomberg", date_stated: "2023-01-01", created: "2026-05-22T13:25:00Z" },
  { id: "seed87", commentator: "Ed Yardeni (Yardeni Research)", prediction: "Predicted S&P 500 would soar 30%+ over the next two years as his 'Roaring 2020s' scenario played out. Set a year-end 2024 target of 5,400 and 2025 target of 6,000. 'The bull market has plenty of room to run as AI-driven productivity gains compound.' Among the most prescient major forecasters of the cycle.", asset: "S&P 500", direction: "bullish", target: "5,400 (2024) / 6,000 (2025)", timeframe: "2024-2025", source: "Fortune / Yardeni Research / CNBC", date_stated: "2023-12-11", created: "2026-05-22T13:26:00Z" },

  // ── 2024 calls ───────────────────────────────────────────────────────────────
  { id: "seed88", commentator: "Marko Kolanovic (JPMorgan)", prediction: "Set S&P 500 year-end 2024 target at 4,200 — the most bearish forecast on all of Wall Street, implying a 12% decline. Called for stocks to fall as earnings disappointed and rates stayed high. The S&P 500 closed 2024 at 5,882 — 40% above his target. Kolanovic left JPMorgan in July 2024.", asset: "S&P 500", direction: "bearish", target: "4,200", timeframe: "Year-end 2024", source: "JPMorgan / Fortune / Yahoo Finance", date_stated: "2024-01-01", created: "2026-05-22T13:27:00Z" },
  { id: "seed89", commentator: "Tom Lee (Fundstrat)", prediction: "Set S&P 500 year-end 2024 target at 5,200 — the Street's most bullish major forecast. Raised it to 5,700 in April as AI momentum accelerated. Also predicted S&P 500 would reach 15,000 by end of the decade driven by AI productivity. S&P closed 2024 at 5,882, exceeding even his raised target.", asset: "S&P 500", direction: "bullish", target: "5,200 → 5,700", timeframe: "Year-end 2024", source: "CNBC / Fundstrat / Fortune", date_stated: "2024-01-01", created: "2026-05-22T13:28:00Z" },
  { id: "seed90", commentator: "Goldman Sachs", prediction: "Set S&P 500 year-end 2024 target at 5,100. Was among the more bullish major banks at the start of the year but still underestimated the AI-driven rally by 15%. S&P closed 2024 at 5,882 as the AI theme and Magnificent 7 outperformed all forecasts.", asset: "S&P 500", direction: "bullish", target: "5,100", timeframe: "Year-end 2024", source: "Goldman Sachs Research", date_stated: "2024-01-01", created: "2026-05-22T13:29:00Z" },
  { id: "seed91", commentator: "Ed Yardeni (Yardeni Research)", prediction: "Raised year-end 2024 S&P 500 target to 5,400 in February, citing AI-driven productivity and 'Roaring 2020s' scenario. Set year-end 2025 target of 6,000 and year-end 2026 target of 7,000. Was directionally the most accurate major forecaster of the 2024 cycle, though the final 5,882 close still exceeded his target.", asset: "S&P 500", direction: "bullish", target: "5,400", timeframe: "Year-end 2024", source: "CNBC / Yardeni Research / ThinkAdvisor", date_stated: "2024-02-22", created: "2026-05-22T13:30:00Z" },
  { id: "seed92", commentator: "Jeremy Grantham (GMO)", prediction: "'There is a 70% probability the stock market will crash.' Maintained his superbubble thesis entering 2024 — argued AI excitement was mimicking 1999 tech mania and true S&P 500 fair value was near 3,000. GMO's flagship fund significantly underperformed the index for the fourth consecutive year as the bull market extended.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2024", source: "Fortune / GMO research", date_stated: "2024-01-01", created: "2026-05-22T13:31:00Z" },

  // ── 2020 COVID-era calls ──────────────────────────────────────────────────
  { id: "seed46", commentator: "Ray Dalio (Bridgewater)", prediction: "'Cash is trash.' In a world of negative real yields and massive global liquidity, holding cash is a losing strategy. Investors should own equities, gold, and real assets over cash.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2020", source: "World Economic Forum, Davos", date_stated: "2020-01-22", created: "2026-05-22T12:45:00Z" },
  { id: "seed47", commentator: "Jim Cramer", prediction: "The coronavirus selloff is an overreaction. 'I would not sell' cruise, travel, and restaurant stocks. The China outbreak is being priced in too aggressively — these declines are a buying opportunity in beaten-down consumer names.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2020", source: "CNBC Mad Money", date_stated: "2020-02-24", created: "2026-05-22T12:46:00Z" },
  { id: "seed48", commentator: "Warren Buffett", prediction: "'Never bet against America.' America's economic magic has repeatedly turned adversity into prosperity. Long-term investors in American equities will be well rewarded despite any crisis. 'In the 20th century, the Dow rose from 66 to 11,497 despite wars, a Depression, and countless crises.'", asset: "S&P 500", direction: "bullish", target: null, timeframe: "Long-term", source: "Berkshire Hathaway Annual Letter (released Feb 2020)", date_stated: "2020-02-22", created: "2026-05-22T12:47:00Z" },
  { id: "seed49", commentator: "Steve Chiavarone (Federated Hermes)", prediction: "'This is different from anything that has ever happened. You have never shut down the entire global economy.' Unlike past financial crises, a pandemic-induced shutdown has no historical playbook. Recession is inevitable and recovery will be far slower than markets expect.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2020", source: "CNBC", date_stated: "2020-03-16", created: "2026-05-22T12:48:00Z" },
  { id: "seed50", commentator: "Bill Ackman (Pershing Square)", prediction: "'Hell is coming.' Unless the US shuts down for 30 days, the stock market will go to zero. Ackman revealed he had hedged Pershing Square's entire portfolio against collapse via credit default swaps, describing the stakes as existential for the economy.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2020", source: "CNBC", date_stated: "2020-03-18", created: "2026-05-22T12:49:00Z" },
  { id: "seed51", commentator: "Tom Lee (Fundstrat)", prediction: "The COVID selloff has created a generational buying opportunity. Stocks are pricing in a scenario far worse than will materialize. Investors should aggressively buy this dip — the S&P 500 bottom is likely near or already in.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2020", source: "CNBC / Fundstrat research note", date_stated: "2020-03-18", created: "2026-05-22T12:50:00Z" },
  { id: "seed54", commentator: "Bill Ackman (Pershing Square)", prediction: "Reversed entire bearish position — disclosed $2.6B gain from credit default swap hedges and reinvested all proceeds into stocks. 'We are long stocks, long America.' Made one of the most dramatic short-to-long pivots in hedge fund history in under two weeks.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2020", source: "CNBC / Pershing Square investor letter", date_stated: "2020-03-25", created: "2026-05-22T12:53:00Z" },
  { id: "seed58", commentator: "David Tepper (Appaloosa Management)", prediction: "'I love riding a horse that's running.' Still bullish on stocks at all-time highs, citing Fed policy and trade deal tailwinds. 'We have been long and continue that way.' Agreed with Druckenmiller that current momentum justified continued equity exposure despite stretched valuations.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2020", source: "CNBC", date_stated: "2020-01-17", created: "2026-05-22T12:57:00Z" },
  { id: "seed59", commentator: "Stanley Druckenmiller (Duquesne)", prediction: "'Still riding the horse.' Remained bullish near-term on stocks despite elevated valuations, agreeing with Tepper that Fed accommodation and the US-China Phase 1 trade deal justified continued equity exposure. Less than 5 weeks before COVID began collapsing markets.", asset: "S&P 500", direction: "bullish", target: null, timeframe: "2020 Q1", source: "CNBC", date_stated: "2020-01-17", created: "2026-05-22T12:58:00Z" },
  { id: "seed60", commentator: "Scott Minerd (Guggenheim)", prediction: "'We are in the ludicrous season.' Sounded alarm on valuations just weeks before the COVID crash — stocks pricing in near-perfection with credit spreads artificially compressed. Called for caution but stopped short of recommending outright selling.", asset: "S&P 500", direction: "neutral", target: null, timeframe: "2020", source: "CNBC", date_stated: "2020-02-13", created: "2026-05-22T12:59:00Z" },
  { id: "seed61", commentator: "Scott Minerd (Guggenheim)", prediction: "'We've reached a tipping point with the coronavirus outbreak.' Turned decisively bearish. Called for investors to sell equities as COVID lockdowns became increasingly likely. Was among the earliest major Wall Street voices to identify the pandemic as a genuine market-moving crisis.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2020", source: "CNBC / Seeking Alpha", date_stated: "2020-02-26", created: "2026-05-22T13:00:00Z" },
  { id: "seed62", commentator: "Nouriel Roubini", prediction: "Predicted global equities would fall 30–40% for the year and warned of a 'Greater Depression' — a shock faster and more severe than 2008. Called post-crash rallies 'a dead cat bounce and fake head rally in a persistent bear market.' Said the US$3T stimulus wouldn't prevent a depression.", asset: "S&P 500", direction: "bearish", target: "−30% to −40% for year", timeframe: "2020", source: "Project Syndicate / The Daily Hodl", date_stated: "2020-03-29", created: "2026-05-22T13:01:00Z" },
  { id: "seed63", commentator: "Scott Minerd (Guggenheim)", prediction: "S&P 500 could fall to 1,500–1,600 in a historical bear market retracement. Based on 1929 and 2008 precedent, initial COVID declines would be followed by further drops of 50%+. Positioned Guggenheim's fixed income and equity books for a prolonged downturn.", asset: "S&P 500", direction: "bearish", target: "1,500–1,600", timeframe: "2020", source: "Bloomberg", date_stated: "2020-04-17", created: "2026-05-22T13:02:00Z" },
  { id: "seed64", commentator: "David Tepper (Appaloosa Management)", prediction: "'This is the second-most overvalued stock market I've ever seen, behind only 1999.' Warned Amazon, Alphabet, and Facebook were 'fully valued,' and banks were still too high with zero rates and massive loan losses ahead. S&P 500's forward P/E had ballooned above 20x — not seen since 2002.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2020", source: "CNBC / Bloomberg", date_stated: "2020-05-13", created: "2026-05-22T13:03:00Z" },
  { id: "seed65", commentator: "Stanley Druckenmiller (Duquesne)", prediction: "'The risk-reward for equities is maybe as bad as I've seen it in my career.' Believed the pandemic had broken the back of a credit bubble and the market was pricing in a V-shaped recovery that wouldn't materialize. Took short bets against stocks and the recovery rally.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2020", source: "CNBC / eResearch", date_stated: "2020-05-11", created: "2026-05-22T13:04:00Z" },
  { id: "seed67", commentator: "Stanley Druckenmiller (Duquesne)", prediction: "Said he was 'humbled' by the market's comeback and admitted he 'underestimated how many red lines and how far the Fed would go.' Returned just 3% while the S&P 500 rallied 40% from its March bottom. Also underestimated the excitement around reopening trades.", asset: "S&P 500", direction: "neutral", target: null, timeframe: "2020", source: "CNBC", date_stated: "2020-06-08", created: "2026-05-22T13:06:00Z" },
  { id: "seed68", commentator: "Mohamed El-Erian (Allianz)", prediction: "'It's an uncomfortable bet to continue to bet on a huge recovery.' Called the post-COVID rally policy-induced and disconnected from fundamentals. 'It's all been about technicals — that allows the market to over and over again shrug off fundamentals.' The risk was a wave of corporate bankruptcies.", asset: "S&P 500", direction: "neutral", target: null, timeframe: "2020", source: "CNBC", date_stated: "2020-06-08", created: "2026-05-22T13:07:00Z" },
  { id: "seed69", commentator: "Jeremy Grantham (GMO)", prediction: "'If you look back in two or three years and this market drops 50%, history books will say that looked like one of the great warnings of all time.' Called the recovery a classic bear market rally, not a new bull. GMO cut global equity exposure to near 2008 lows. Lost 2.5% in 2020 vs S&P's +18%.", asset: "S&P 500", direction: "bearish", target: null, timeframe: "2020-2022", source: "Market Realist / CNBC / GMO research", date_stated: "2020-06-15", created: "2026-05-22T13:08:00Z" },
  { id: "seed71", commentator: "Goldman Sachs", prediction: "Raised year-end 2020 S&P 500 target to 3,600 from 3,000 — a 20% upgrade driven by faster-than-expected economic recovery and resilient earnings. 'Investors consider equities undervalued given a lower-than-expected risk premium.' Also set a 2021 year-end target of 4,300.", asset: "S&P 500", direction: "bullish", target: "3,600", timeframe: "Year-end 2020", source: "Goldman Sachs Research / Motley Fool", date_stated: "2020-08-17", created: "2026-05-22T13:10:00Z" },
  { id: "seed73", commentator: "Goldman Sachs", prediction: "Raised year-end 2020 S&P 500 target to 3,700 and set 2021 target of 4,300 following Pfizer vaccine announcement. Called it 'the most important positive development for global equities since the virus outbreak.' Upgraded cyclicals, value stocks, and reopening plays.", asset: "S&P 500", direction: "bullish", target: "3,700 (2020) / 4,300 (2021)", timeframe: "Year-end 2020 / Year-end 2021", source: "Fortune / CNBC", date_stated: "2020-11-11", created: "2026-05-22T13:12:00Z" }
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
  var clickable = !!props.onCommentatorClick;
  const [hov, setHov] = React.useState(false);

  var fields = [
    pred.target ? "Target: " + pred.target : null,
    pred.timeframe ? "By: " + pred.timeframe : null,
    pred.source ? "Via: " + pred.source : null,
    pred.date_stated ? "Said: " + pred.date_stated : null,
    "Logged: " + new Date(pred.created).toLocaleDateString(),
  ].filter(Boolean);

  return (
    <div
      onClick={clickable ? function() { props.onCommentatorClick(pred.commentator); } : undefined}
      onMouseEnter={clickable ? function() { setHov(true); } : undefined}
      onMouseLeave={clickable ? function() { setHov(false); } : undefined}
      style={{
        background: hov ? dirBg(pred.direction).replace("0.08", "0.13").replace("0.06", "0.10") : dirBg(pred.direction),
        border: "1px solid " + dirColor(pred.direction) + (hov ? "55" : "33"),
        borderRadius: 10, padding: "16px 20px", marginBottom: 10, position: "relative",
        cursor: clickable ? "pointer" : "default",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: hov ? "#ffffff" : "#fafaf9" }}>{pred.commentator}</span>
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
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, color: "#78716c", fontFamily: monoFont, alignItems: "center" }}>
            {fields.map(function(f, idx) { return <span key={idx}>{f}</span>; })}
            {clickable && (
              <span style={{ marginLeft: "auto", color: hov ? dirColor(pred.direction) : "#44403c", fontSize: 10, fontFamily: monoFont, transition: "color 0.15s" }}>
                View pundit →
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <button onClick={function(e) { e.stopPropagation(); props.onDelete(pred.id); }} style={{
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
  const [filterYear, setFilterYear] = useState("2026");
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

  var allYears = [];
  var seenYears = {};
  data.predictions.forEach(function(p) {
    if (p.date_stated) {
      var yr = p.date_stated.slice(0, 4);
      if (!seenYears[yr]) { seenYears[yr] = true; allYears.push(yr); }
    }
  });
  allYears.sort(function(a, b) { return b - a; });

  var filtered = data.predictions.filter(function(p) {
    if (filterCommentator !== "all" && p.commentator !== filterCommentator) return false;
    if (filterDirection !== "all" && p.direction !== filterDirection) return false;
    if (filterYear !== "all") {
      if (!p.date_stated || p.date_stated.slice(0, 4) !== filterYear) return false;
    }
    return true;
  });

  // Build S&P 500 year-end 2026 targets sidebar
  function parseTargetNum(t) {
    if (!t) return null;
    var clean = t.replace(/,/g, "").replace(/\+/g, "").replace(/~/g, "");
    var m = clean.match(/\d{4,}/);
    return m ? parseInt(m[0]) : null;
  }

  var sp500Targets = [];
  var seenTargetCommentators = {};
  data.predictions
    .filter(function(p) {
      if (!p.target || !p.timeframe) return false;
      var tf = p.timeframe.toLowerCase();
      var isYearEnd2026 = tf.includes("2026") || tf.includes("year-end");
      var num = parseTargetNum(p.target);
      return p.asset === "S&P 500" && isYearEnd2026 && num && num > 5000 && p.direction !== "bearish";
    })
    .sort(function(a, b) {
      return new Date(b.date_stated || 0) - new Date(a.date_stated || 0);
    })
    .forEach(function(p) {
      if (!seenTargetCommentators[p.commentator]) {
        seenTargetCommentators[p.commentator] = true;
        sp500Targets.push({ commentator: p.commentator, target: parseTargetNum(p.target), id: p.id });
      }
    });
  sp500Targets.sort(function(a, b) { return b.target - a.target; });

  var maxTarget = sp500Targets.length > 0 ? sp500Targets[0].target : 0;
  var minTarget = sp500Targets.length > 0 ? sp500Targets[sp500Targets.length - 1].target : 0;
  var targetRange = maxTarget - minTarget || 1;

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
    <div style={{
      maxWidth: 1080,
      margin: "0 auto",
      padding: 24,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: "#d6d3d1",
      minHeight: "100vh",
      display: "flex",
      gap: 24,
      alignItems: "flex-start",
    }}>

      {/* S&P 500 Targets Sidebar */}
      {sp500Targets.length > 0 && (
        <div style={{
          width: 230,
          flexShrink: 0,
          position: "sticky",
          top: 24,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "16px 14px",
          alignSelf: "flex-start",
        }}>
          <div style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 14 }}>
            2026 S&P 500 Targets
          </div>
          {sp500Targets.map(function(t, i) {
            var barPct = ((t.target - minTarget) / targetRange) * 100;
            var shortName = t.commentator
              .replace(/ \(.*?\)/g, "")
              .replace("Global Wealth Management", "")
              .replace("Investment Institute", "")
              .replace("Capital Markets", "")
              .replace("Intelligence (60+ institutions)", "")
              .trim();
            return (
              <div key={t.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#57534e", fontFamily: monoFont, width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 12, color: "#a8a29e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.commentator}>
                    {shortName}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#facc15", fontFamily: monoFont, flexShrink: 0 }}>
                    {t.target.toLocaleString()}
                  </span>
                </div>
                <div style={{ marginLeft: 23, height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 1 }}>
                  <div style={{ height: "100%", width: barPct + "%", background: "rgba(250,204,21,0.35)", borderRadius: 1, minWidth: "8%" }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "#57534e", fontFamily: monoFont }}>
            {sp500Targets.length} forecasts · hover for full name
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, maxWidth: 720 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div onClick={handleTitleClick} style={{ cursor: "default", userSelect: "none" }}>
            <h1 style={{ margin: 0, fontSize: 44, fontWeight: 400, color: "#000000", letterSpacing: 2, fontFamily: "'Bebas Neue', sans-serif" }}>HINDSIGHT CAPITAL</h1>
            <div style={{ fontSize: 11, color: "#78716c", fontFamily: monoFont, letterSpacing: 1, marginTop: 2 }}>WALL STREET PREDICTION TRACKER</div>
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
                <select value={filterYear} onChange={function(e) { setFilterYear(e.target.value); }} style={selectStyle}>
                  {allYears.map(function(yr) { return <option key={yr} value={yr}>{yr}</option>; })}
                  <option value="all">All Years</option>
                </select>
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
              return <PredictionCard key={p.id} pred={p} onDelete={handleDelete} isAdmin={isAdmin}
                onCommentatorClick={function(name) { setView("leaderboard"); setPunditDetail(name); }} />;
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

      </div> {/* end main content */}
    </div>
  );
}
