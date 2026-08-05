import "server-only";

import { z } from "zod";

export type DocumentScanResult = {
  provider: "built-in-document-safety" | "cloudmersive-advanced";
  status: "passed";
  verifiedFileFormat?: string;
};

export class DocumentScannerError extends Error {
  constructor(
    message: string,
    readonly reason: "quarantined" | "unavailable" | "misconfigured",
  ) {
    super(message);
    this.name = "DocumentScannerError";
  }
}

export interface DocumentScanner {
  scan(input: { buffer: ArrayBuffer; fileName: string; mime: string }): Promise<DocumentScanResult>;
}

const cloudmersiveResultSchema = z.object({
  CleanResult: z.boolean(),
  ContainsExecutable: z.boolean().optional(),
  ContainsInvalidFile: z.boolean().optional(),
  ContainsScript: z.boolean().optional(),
  ContainsPasswordProtectedFile: z.boolean().optional(),
  ContainsRestrictedFileFormat: z.boolean().optional(),
  ContainsMacros: z.boolean().optional(),
  ContainsXmlExternalEntities: z.boolean().optional(),
  ContainsInsecureDeserialization: z.boolean().optional(),
  ContainsHtml: z.boolean().optional(),
  ContainsUnsafeArchive: z.boolean().optional(),
  ContainsOleEmbeddedObject: z.boolean().optional(),
  ContainsUnwantedAction: z.boolean().optional(),
  VerifiedFileFormat: z.string().nullable().optional(),
  FoundViruses: z.array(z.object({ FileName: z.string().optional(), VirusName: z.string().optional() })).optional(),
});

function builtInScan(buffer: ArrayBuffer): DocumentScanResult {
  const bytes = new Uint8Array(buffer);
  const preview = new TextDecoder("latin1").decode(bytes.slice(0, Math.min(bytes.length, 2_000_000)));
  const unsafe = ["EICAR-STANDARD-ANTIVIRUS-TEST-FILE", "/JavaScript", "/OpenAction", "vbaProject.bin"];
  if (unsafe.some((marker) => preview.includes(marker))) {
    throw new DocumentScannerError("The file was quarantined by the document safety scan.", "quarantined");
  }
  return { provider: "built-in-document-safety", status: "passed" };
}

export class BuiltInDocumentScanner implements DocumentScanner {
  async scan(input: { buffer: ArrayBuffer }) {
    return builtInScan(input.buffer);
  }
}

export class CloudmersiveDocumentScanner implements DocumentScanner {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.cloudmersive.com",
  ) {}

  async scan(input: { buffer: ArrayBuffer; fileName: string; mime: string }) {
    // Keep the local marker scan as a cheap first layer; the commercial scan is authoritative.
    builtInScan(input.buffer);
    const body = new FormData();
    body.set("inputFile", new Blob([input.buffer], { type: input.mime }), input.fileName);
    const timeout = Math.min(30_000, Math.max(2_000, Number(process.env.DOCUMENT_SCANNER_TIMEOUT_MS ?? 15_000)));
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/virus/scan/file/advanced`, {
        method: "POST",
        headers: {
          Apikey: this.apiKey,
          fileName: input.fileName,
          allowExecutables: "false",
          allowInvalidFiles: "false",
          allowScripts: "false",
          allowPasswordProtectedFiles: "false",
          allowMacros: "false",
          allowXmlExternalEntities: "false",
          allowInsecureDeserialization: "false",
          allowHtml: "false",
          allowUnsafeArchives: "false",
          restrictFileTypes: ".txt,.pdf,.docx",
        },
        body,
        signal: AbortSignal.timeout(timeout),
      });
    } catch {
      throw new DocumentScannerError("The commercial document scanner is temporarily unavailable.", "unavailable");
    }
    if (!response.ok) {
      throw new DocumentScannerError("The commercial document scanner rejected the request.", "unavailable");
    }
    let result: z.infer<typeof cloudmersiveResultSchema>;
    try {
      result = cloudmersiveResultSchema.parse(await response.json());
    } catch {
      throw new DocumentScannerError("The commercial document scanner returned an invalid response.", "unavailable");
    }
    const unsafe = !result.CleanResult || [
      result.ContainsExecutable,
      result.ContainsInvalidFile,
      result.ContainsScript,
      result.ContainsPasswordProtectedFile,
      result.ContainsRestrictedFileFormat,
      result.ContainsMacros,
      result.ContainsXmlExternalEntities,
      result.ContainsInsecureDeserialization,
      result.ContainsHtml,
      result.ContainsUnsafeArchive,
      result.ContainsOleEmbeddedObject,
      result.ContainsUnwantedAction,
    ].some(Boolean);
    if (unsafe) throw new DocumentScannerError("The file was quarantined by the commercial document scanner.", "quarantined");
    return {
      provider: "cloudmersive-advanced" as const,
      status: "passed" as const,
      ...(result.VerifiedFileFormat ? { verifiedFileFormat: result.VerifiedFileFormat } : {}),
    };
  }
}

export function createDocumentScanner(): DocumentScanner {
  const mode = process.env.DOCUMENT_SCANNER_MODE ?? "built_in";
  if (mode === "cloudmersive") {
    if (!process.env.CLOUDMERSIVE_API_KEY) {
      throw new DocumentScannerError("CLOUDMERSIVE_API_KEY is required for commercial scanning.", "misconfigured");
    }
    return new CloudmersiveDocumentScanner(process.env.CLOUDMERSIVE_API_KEY, process.env.CLOUDMERSIVE_BASE_URL);
  }
  if (mode !== "built_in") throw new DocumentScannerError("DOCUMENT_SCANNER_MODE is invalid.", "misconfigured");
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_BUILT_IN_DOCUMENT_SCANNER !== "true") {
    throw new DocumentScannerError("Commercial document scanning is required in production.", "misconfigured");
  }
  return new BuiltInDocumentScanner();
}
