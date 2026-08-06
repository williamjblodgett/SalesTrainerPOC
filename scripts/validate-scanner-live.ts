import fs from "node:fs/promises";
import path from "node:path";

import {
  CloudmersiveDocumentScanner,
  DocumentScannerError,
} from "../src/lib/security/document-scanner";

async function loadFixture(environmentKey: string) {
  const fixturePath = process.env[environmentKey];
  if (!fixturePath) throw new Error(`${environmentKey} is required`);
  const resolved = path.resolve(fixturePath);
  const buffer = await fs.readFile(resolved);
  return {
    buffer: buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer,
    fileName: path.basename(resolved),
    mime: "text/plain",
  };
}

async function main() {
  if (!process.env.CLOUDMERSIVE_API_KEY) {
    throw new Error("CLOUDMERSIVE_API_KEY is required");
  }
  const scanner = new CloudmersiveDocumentScanner(
    process.env.CLOUDMERSIVE_API_KEY,
    process.env.CLOUDMERSIVE_BASE_URL,
  );
  const clean = await scanner.scan(await loadFixture("SCANNER_CLEAN_FILE"));
  if (clean.status !== "passed") throw new Error("Clean fixture did not pass");

  let quarantineVerified = false;
  try {
    await scanner.scan(await loadFixture("SCANNER_QUARANTINE_FILE"));
  } catch (error) {
    quarantineVerified =
      error instanceof DocumentScannerError && error.reason === "quarantined";
  }
  if (!quarantineVerified) {
    throw new Error("Quarantine fixture was not rejected");
  }
  console.log(
    JSON.stringify({
      provider: clean.provider,
      cleanFixture: "passed",
      quarantineFixture: "rejected",
      verifiedFileFormat: clean.verifiedFileFormat ?? null,
    }),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Scanner validation failed");
  process.exitCode = 1;
});
