import assert from "node:assert/strict";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { repairedLandingHtml } from "../dist/server/revenue-os.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(repositoryRoot, "pages-dist");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "SalesTrainerPOC";
const repositoryOwner = process.env.GITHUB_REPOSITORY_OWNER ?? "williamjblodgett";
const pagesUrl =
  process.env.GITHUB_PAGES_URL ??
  `https://${repositoryOwner.toLowerCase()}.github.io/${repositoryName}/`;
const liveAppUrl =
  process.env.LIVE_APP_URL ??
  "https://salessim-training-demo.williamjblodgett.chatgpt.site";

const publicPreviewStyles = `
.public-preview{display:flex;align-items:center;justify-content:center;gap:10px;background:#0b3157;color:#d7e8f7;padding:9px 5vw;font-size:11px;line-height:1.45;text-align:center}
.public-preview strong{color:#55dc89;letter-spacing:.04em}.public-preview a{color:#fff;font-weight:800;text-decoration:underline;text-underline-offset:3px}
@media(max-width:620px){.public-preview{align-items:flex-start;flex-direction:column;gap:3px;text-align:left}}
`;

const metadata = `
<base href="/${repositoryName}/">
<link rel="canonical" href="${pagesUrl}">
<link rel="icon" type="image/webp" href="brand/suadence-logo.webp">
<meta property="og:type" content="website">
<meta property="og:title" content="Suadence Revenue OS — One call in. 20 revenue assets out.">
<meta property="og:description" content="Turn every customer conversation into structured revenue intelligence and governed revenue assets.">
<meta property="og:url" content="${pagesUrl}">
<meta property="og:image" content="${pagesUrl}og-revenue-os.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Suadence Revenue OS">
<meta name="twitter:description" content="One call in. 20 revenue assets out.">
<meta name="twitter:image" content="${pagesUrl}og-revenue-os.png">
`;

const previewBanner = `<aside class="public-preview" aria-label="Public preview notice"><strong>PUBLIC PRODUCT PREVIEW</strong><span>Secure workflows, persistence, and AI operations open in the authenticated workspace.</span><a href="${liveAppUrl}/app" target="_blank" rel="noopener noreferrer">Open secure workspace →</a></aside>`;

const publicLandingHtml = repairedLandingHtml
  .replace("</head>", `${metadata}<style>${publicPreviewStyles}</style></head>`)
  .replace("<body>", `<body>${previewBanner}`)
  .replaceAll('src="/brand/', 'src="brand/')
  .replaceAll(
    'href="/app"',
    `href="${liveAppUrl}/app" target="_blank" rel="noopener noreferrer"`,
  )
  .replaceAll(
    'href="/demo"',
    `href="${liveAppUrl}/demo" target="_blank" rel="noopener noreferrer"`,
  );

assert.match(publicLandingHtml, />TBD</, "GitHub Pages must display TBD pricing");
assert.doesNotMatch(publicLandingHtml, /\$[\d,]+/, "GitHub Pages must not publish pricing");
assert.doesNotMatch(publicLandingHtml, /href="\/(?:app|demo)"/, "product links must be absolute");
assert.doesNotMatch(publicLandingHtml, /\/api\/revenue-os/, "the static page must not call private APIs");
assert.match(publicLandingHtml, /src="brand\/suadence-logo\.webp"/, "the logo path must be portable");
assert.match(publicLandingHtml, new RegExp(`${liveAppUrl.replaceAll(".", "\\.")}\/app`));
assert.match(publicLandingHtml, new RegExp(`${liveAppUrl.replaceAll(".", "\\.")}\/demo`));

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(path.join(outputDirectory, "brand"), { recursive: true });
await cp(
  path.join(repositoryRoot, "public", "brand", "suadence-logo.webp"),
  path.join(outputDirectory, "brand", "suadence-logo.webp"),
);
await cp(
  path.join(repositoryRoot, "public", "og-revenue-os.png"),
  path.join(outputDirectory, "og-revenue-os.png"),
);
await Promise.all([
  writeFile(path.join(outputDirectory, "index.html"), publicLandingHtml, "utf8"),
  writeFile(path.join(outputDirectory, "404.html"), publicLandingHtml, "utf8"),
  writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8"),
  writeFile(
    path.join(outputDirectory, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${pagesUrl}sitemap.xml\n`,
    "utf8",
  ),
  writeFile(
    path.join(outputDirectory, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${pagesUrl}</loc></url></urlset>\n`,
    "utf8",
  ),
]);

console.log(`GitHub Pages site built at ${outputDirectory}`);
console.log(`Public URL: ${pagesUrl}`);
console.log(`Secure product handoff: ${liveAppUrl}`);
