import { Html, Head, Main, NextScript } from "next/document";

// TODO: update SITE_URL when you have a custom domain
var SITE_URL = "https://hindsight-capital.vercel.app";
var SITE_NAME = "Hindsight Capital";
var TITLE = "Hindsight Capital — Wall Street Prediction Tracker";
var DESCRIPTION =
  "Tracking Wall Street pundit S&P 500 predictions from 2020 to 2026. " +
  "See who called the crash, who missed the rally, and how the consensus compares to reality. " +
  "Plus: find out what $1,000 invested 5 years ago would be worth today.";

var structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": SITE_NAME,
  "url": SITE_URL,
  "description": DESCRIPTION,
  "inLanguage": "en-US",
  "author": {
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_URL,
  },
};

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Primary */}
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="keywords" content="wall street predictions, S&P 500 forecast accuracy, pundit tracker, stock market predictions, consensus vs reality, investment calculator, Jim Cramer, Tom Lee, Goldman Sachs predictions" />
        <meta name="author" content={SITE_NAME} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={SITE_URL} />

        {/* Open Graph — controls how the link looks when shared on Twitter/X, LinkedIn, iMessage etc */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={SITE_URL + "/og-image.png"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Hindsight Capital — Wall Street Prediction Tracker" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter / X card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={SITE_URL + "/og-image.png"} />

        {/* Browser chrome */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />

        {/* JSON-LD structured data — helps Google understand what the site is */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;700;800&family=JetBrains+Mono:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body style={{ margin: 0, background: "#ffffff" }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
