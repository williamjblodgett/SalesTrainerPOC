import assert from "node:assert/strict";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(repositoryRoot, "pages-dist");
const canonicalUrl = "https://salessim-five.vercel.app/";

const redirectPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Suadence has moved</title>
  <meta name="robots" content="noindex,follow">
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
  <link rel="canonical" href="${canonicalUrl}">
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f7fb;color:#071e41;font:16px/1.5 system-ui,sans-serif}.card{width:min(88vw,520px);padding:38px;border:1px solid #dce5ee;border-radius:24px;background:white;box-shadow:0 24px 70px #071e4115}.logo{width:280px;max-width:100%;height:auto}h1{margin:32px 0 12px;font-size:34px;letter-spacing:-.03em}p{color:#5d6d7e}a{display:inline-flex;margin-top:16px;padding:12px 18px;border-radius:10px;background:#078eaa;color:white;font-weight:700;text-decoration:none}</style>
  <script>window.location.replace(${JSON.stringify(canonicalUrl)});</script>
</head>
<body><main class="card"><img class="logo" src="./brand/suadence-logo.webp" alt="Suadence"><h1>The complete site has moved.</h1><p>Marketing, product access, and account recovery now live together on one secure domain.</p><a href="${canonicalUrl}">Open Suadence</a></main></body>
</html>`;

assert.match(redirectPage, /salessim-five\.vercel\.app/);
assert.doesNotMatch(redirectPage, /chatgpt\.com|chatgpt\.site/);
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(path.join(outputDirectory, "brand"), { recursive: true });
await cp(
  path.join(repositoryRoot, "public", "brand", "suadence-logo.webp"),
  path.join(outputDirectory, "brand", "suadence-logo.webp"),
);
await Promise.all([
  writeFile(path.join(outputDirectory, "index.html"), redirectPage, "utf8"),
  writeFile(path.join(outputDirectory, "404.html"), redirectPage, "utf8"),
  writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8"),
  writeFile(path.join(outputDirectory, "robots.txt"), "User-agent: *\nDisallow: /\n", "utf8"),
]);

console.log(`GitHub Pages now redirects to ${canonicalUrl}`);
