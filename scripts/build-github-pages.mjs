import assert from "node:assert/strict";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const sourceDirectory = path.join(repositoryRoot, "demo");
const outputDirectory = path.join(repositoryRoot, "pages-dist");
const demoOutputDirectory = path.join(outputDirectory, "demo");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "SalesTrainerPOC";
const repositoryOwner = process.env.GITHUB_REPOSITORY_OWNER ?? "williamjblodgett";
const pagesUrl = process.env.GITHUB_PAGES_URL ?? `https://${repositoryOwner.toLowerCase()}.github.io/${repositoryName}/`;
const secureAppUrl = process.env.SECURE_APP_URL ?? "https://salessim-training-demo.williamjblodgett.chatgpt.site/app";

const { repairedLandingHtml } = await import("../dist/server/revenue-os.js");

const [html, script] = await Promise.all([
  readFile(path.join(sourceDirectory, "index.html"), "utf8"),
  readFile(path.join(sourceDirectory, "app.js"), "utf8"),
]);

assert.match(html, /Interactive Demo/, "Pages must ship the interactive demo shell");
assert.match(repairedLandingHtml, /One call in/, "Pages must ship the product landing page");
assert.match(repairedLandingHtml, /id="pricing"/, "Landing page must include pricing");
assert.match(repairedLandingHtml, />TBD</, "Public pricing must remain TBD");
assert.match(script, /routeNames/, "Pages must include resilient client-side navigation");
assert.match(script, /synthetic/i, "Pages must identify synthetic-only data handling");
assert.doesNotMatch(script, /OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY/, "Pages must never contain server secrets");
assert.doesNotMatch(html, /\$[\d,]+/, "Pages must not publish pricing");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(path.join(outputDirectory, "brand"), { recursive: true });
await mkdir(path.join(demoOutputDirectory, "brand"), { recursive: true });
await mkdir(path.join(demoOutputDirectory, "data"), { recursive: true });
await Promise.all([
  cp(sourceDirectory, demoOutputDirectory, { recursive: true }),
  cp(path.join(repositoryRoot, "public", "brand", "suadence-logo.webp"), path.join(outputDirectory, "brand", "suadence-logo.webp")),
  cp(path.join(repositoryRoot, "public", "brand", "suadence-logo.webp"), path.join(demoOutputDirectory, "brand", "suadence-logo.webp")),
  cp(path.join(repositoryRoot, "public", "data", "industry-packs.json"), path.join(demoOutputDirectory, "data", "industry-packs.json")),
  cp(path.join(repositoryRoot, "public", "og-revenue-os.png"), path.join(outputDirectory, "og-revenue-os.png")),
]);

const landingPageHtml = repairedLandingHtml
  .replaceAll('href="/app"', `href="${secureAppUrl}"`)
  .replaceAll('href="/demo"', `href="${pagesUrl}demo/"`)
  .replaceAll('src="/brand/suadence-logo.webp"', 'src="./brand/suadence-logo.webp"')
  .replace("</head>", `<link rel="canonical" href="${pagesUrl}"><meta property="og:image" content="${pagesUrl}og-revenue-os.png"></head>`);
const demoPageHtml = html.replace("</head>", `<link rel="canonical" href="${pagesUrl}demo/"><meta property="og:image" content="${pagesUrl}og-revenue-os.png"></head>`);
const demoScript = script.replace("https://github.com/williamjblodgett/SalesTrainerPOC", secureAppUrl);
await Promise.all([
  writeFile(path.join(outputDirectory, "index.html"), landingPageHtml, "utf8"),
  writeFile(path.join(outputDirectory, "404.html"), landingPageHtml, "utf8"),
  writeFile(path.join(demoOutputDirectory, "index.html"), demoPageHtml, "utf8"),
  writeFile(path.join(demoOutputDirectory, "app.js"), demoScript, "utf8"),
  writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8"),
  writeFile(path.join(outputDirectory, "robots.txt"), `User-agent: *\nAllow: /\n`, "utf8"),
]);

console.log(`GitHub Pages marketing site built at ${outputDirectory}`);
console.log(`Main site: ${pagesUrl}`);
console.log(`Interactive demo: ${pagesUrl}demo/`);
