import assert from "node:assert/strict";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const sourceDirectory = path.join(repositoryRoot, "demo");
const outputDirectory = path.join(repositoryRoot, "pages-dist");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "SalesTrainerPOC";
const repositoryOwner = process.env.GITHUB_REPOSITORY_OWNER ?? "williamjblodgett";
const pagesUrl = process.env.GITHUB_PAGES_URL ?? `https://${repositoryOwner.toLowerCase()}.github.io/${repositoryName}/`;

const [html, script] = await Promise.all([
  readFile(path.join(sourceDirectory, "index.html"), "utf8"),
  readFile(path.join(sourceDirectory, "app.js"), "utf8"),
]);

assert.match(html, /Interactive Demo/, "Pages must ship the interactive demo shell");
assert.match(script, /routeNames/, "Pages must include resilient client-side navigation");
assert.match(script, /synthetic/i, "Pages must identify synthetic-only data handling");
assert.doesNotMatch(script, /OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY/, "Pages must never contain server secrets");
assert.doesNotMatch(html, /\$[\d,]+/, "Pages must not publish pricing");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(path.join(outputDirectory, "brand"), { recursive: true });
await mkdir(path.join(outputDirectory, "data"), { recursive: true });
await Promise.all([
  cp(sourceDirectory, outputDirectory, { recursive: true }),
  cp(path.join(repositoryRoot, "public", "brand", "suadence-logo.webp"), path.join(outputDirectory, "brand", "suadence-logo.webp")),
  cp(path.join(repositoryRoot, "public", "data", "industry-packs.json"), path.join(outputDirectory, "data", "industry-packs.json")),
  cp(path.join(repositoryRoot, "public", "og-revenue-os.png"), path.join(outputDirectory, "og-revenue-os.png")),
]);

const pageHtml = html.replace("</head>", `<link rel="canonical" href="${pagesUrl}"><meta property="og:image" content="${pagesUrl}og-revenue-os.png"></head>`);
await Promise.all([
  writeFile(path.join(outputDirectory, "index.html"), pageHtml, "utf8"),
  writeFile(path.join(outputDirectory, "404.html"), pageHtml, "utf8"),
  writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8"),
  writeFile(path.join(outputDirectory, "robots.txt"), `User-agent: *\nAllow: /\n`, "utf8"),
]);

console.log(`Interactive GitHub Pages demo built at ${outputDirectory}`);
console.log(`Public URL: ${pagesUrl}`);
