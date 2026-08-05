import { afterEach, describe, expect, it, vi } from "vitest";

import { CloudmersiveDocumentScanner, DocumentScannerError, createDocumentScanner } from "@/lib/security/document-scanner";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const input = {
  buffer: new TextEncoder().encode("Seller: hello\nBuyer: hello").buffer,
  fileName: "call.txt",
  mime: "text/plain",
};

describe("commercial document scanning", () => {
  it("accepts a clean advanced scan and sends fail-closed document controls", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        Apikey: "scanner-key",
        allowMacros: "false",
        allowScripts: "false",
        restrictFileTypes: ".txt,.pdf,.docx",
      });
      return new Response(JSON.stringify({ CleanResult: true, VerifiedFileFormat: "TXT" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(new CloudmersiveDocumentScanner("scanner-key").scan(input)).resolves.toEqual({
      provider: "cloudmersive-advanced",
      status: "passed",
      verifiedFileFormat: "TXT",
    });
  });

  it("quarantines any threat or unsafe-content signal", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ CleanResult: true, ContainsMacros: true }), { status: 200 })));
    await expect(new CloudmersiveDocumentScanner("scanner-key").scan(input)).rejects.toMatchObject({ reason: "quarantined" });
  });

  it("does not silently fall back when the provider is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("unavailable", { status: 503 })));
    await expect(new CloudmersiveDocumentScanner("scanner-key").scan(input)).rejects.toMatchObject({ reason: "unavailable" });
  });

  it("requires the commercial provider in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DOCUMENT_SCANNER_MODE", "built_in");
    expect(() => createDocumentScanner()).toThrow(DocumentScannerError);
  });
});
