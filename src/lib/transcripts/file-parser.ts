import "server-only";

import { fileTypeFromBuffer } from "file-type";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

import { redactSensitiveText } from "@/lib/security/pii-redaction";
import { createDocumentScanner, DocumentScannerError } from "@/lib/security/document-scanner";

export const MAX_TRANSCRIPT_BYTES = 20 * 1024 * 1024;
const MAX_EXTRACTED_CHARACTERS = 200_000;
const allowedTypes = new Map([
  ["text/plain", ["txt"]],
  ["application/pdf", ["pdf"]],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ["docx"]],
]);

export class TranscriptFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranscriptFileError";
  }
}

function extension(name: string) {
  return name.toLowerCase().split(".").pop() ?? "";
}

export async function parseTranscriptFile(file: File) {
  if (!file.size || file.size > MAX_TRANSCRIPT_BYTES) throw new TranscriptFileError("Transcript files must be between 1 byte and 20 MB.");
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const ext = extension(file.name);
  const detected = await fileTypeFromBuffer(bytes);
  const mime = detected?.mime ?? (ext === "txt" ? "text/plain" : "");
  const extensions = allowedTypes.get(mime);
  if (!extensions || !extensions.includes(ext)) throw new TranscriptFileError("The file extension and detected document type do not match an allowed TXT, DOCX, or PDF transcript.");
  let scan;
  try {
    scan = await createDocumentScanner().scan({ buffer, fileName: file.name, mime });
  } catch (error) {
    if (error instanceof DocumentScannerError && error.reason === "quarantined") throw new TranscriptFileError(error.message);
    throw error;
  }

  let rawText = "";
  if (mime === "text/plain") rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    rawText = (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value;
  }
  if (mime === "application/pdf") {
    const parser = new PDFParse({ data: bytes });
    try {
      rawText = (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  }
  rawText = rawText.replace(/\u0000/g, "").trim();
  if (rawText.length < 120) throw new TranscriptFileError("The document did not contain enough extractable transcript text.");
  if (rawText.length > MAX_EXTRACTED_CHARACTERS) throw new TranscriptFileError("The extracted transcript exceeds the 200,000 character processing limit.");
  const redacted = redactSensitiveText(rawText);
  return { name: file.name, mime, text: redacted.text, piiFindings: redacted.findings, redactedCount: redacted.redactedCount, scan };
}
