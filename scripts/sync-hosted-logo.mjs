import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const workerPath = path.join(root, "dist", "server", "index.js");
const logoPath = path.join(root, "public", "brand", "suadence-logo.webp");
const source = fs.readFileSync(workerPath, "utf8");
const logo = fs.readFileSync(logoPath).toString("base64");
const updated = source.replace(/^const logoBase64 = "[^"]*";/, `const logoBase64 = "${logo}";`);

if (updated === source) throw new Error("Hosted logo constant was not found.");
fs.writeFileSync(workerPath, updated, "utf8");
process.stdout.write(`Embedded ${logo.length} base64 characters from ${path.relative(root, logoPath)}.\n`);
