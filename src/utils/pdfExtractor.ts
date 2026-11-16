import * as pdfjsLib from 'pdfjs-dist';

const PRIMARY_WORKER_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const FALLBACK_WORKER_CDN =
  'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = PRIMARY_WORKER_CDN;

export const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface ExtractedPdfResult {
  text: string;
  pageCount: number;
  wordCount: number;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validatePdfFile(file: File): string | null {
  const isPdfMime = file.type === 'application/pdf';
  const isPdfExt = file.name.toLowerCase().endsWith('.pdf');

  if (!isPdfMime && !isPdfExt) {
    return 'Only PDF files are supported. Please upload a valid .pdf resume.';
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return `File size (${formatFileSize(file.size)}) exceeds the 5 MB limit.`;
  }

  if (file.size === 0) {
    return 'The selected PDF file appears to be empty.';
  }

  return null;
}

async function openPdfWithFallback(arrayBuffer: ArrayBuffer) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PRIMARY_WORKER_CDN;
    return await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  } catch (primaryErr) {
    const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    const isWorkerError =
      msg.toLowerCase().includes('worker') ||
      msg.toLowerCase().includes('importscripts') ||
      msg.toLowerCase().includes('network') ||
      msg.toLowerCase().includes('fetch');

    if (!isWorkerError) {
      throw primaryErr;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = FALLBACK_WORKER_CDN;
    return await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  }
}

export async function extractTextFromPdf(file: File): Promise<ExtractedPdfResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await openPdfWithFallback(arrayBuffer);

  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    let currentLineY: number | null = null;
    let lineBuffer: string[] = [];
    const lines: string[] = [];

    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const textItem = item as { str: string; transform?: number[] };
      const str = textItem.str;
      const y = Array.isArray(textItem.transform) ? Math.round(textItem.transform[5]) : null;

      if (currentLineY !== null && y !== null && Math.abs(y - currentLineY) > 4) {
        if (lineBuffer.length > 0) {
          lines.push(lineBuffer.join(' ').replace(/\s+/g, ' ').trim());
          lineBuffer = [];
        }
      }

      if (str.trim().length > 0) {
        lineBuffer.push(str.trim());
      }
      if (y !== null) {
        currentLineY = y;
      }
    }

    if (lineBuffer.length > 0) {
      lines.push(lineBuffer.join(' ').replace(/\s+/g, ' ').trim());
    }

    pageTexts.push(lines.filter(Boolean).join('\n'));
  }

  const fullText = pageTexts.join('\n\n').trim();
  if (!fullText) {
    throw new Error(
      'No readable text could be extracted from this PDF. It may be a scanned image without an embedded text layer.'
    );
  }

  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  return {
    text: fullText,
    pageCount: pdf.numPages,
    wordCount,
  };
}
