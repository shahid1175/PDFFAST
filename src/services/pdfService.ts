import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';

// Set worker source for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export class PDFService {
  /**
   * Converts PDF pages to JPG data URLs
   */
  static async pdfToJpg(file: File): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const jpgs: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
       const page = await pdf.getPage(i);
       const viewport = page.getViewport({ scale: 2.0 });
       const canvas = document.createElement('canvas');
       const context = canvas.getContext('2d');
       
       if (!context) continue;
       
       canvas.height = viewport.height;
       canvas.width = viewport.width;

       await page.render({ canvasContext: context, viewport: viewport }).promise;
       jpgs.push(canvas.toDataURL('image/jpeg', 0.8));
    }

    return jpgs;
  }
  /**
   * Merges multiple PDF files into a single PDF
   */
  static async mergePDFs(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();
    
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    return await mergedPdf.save();
  }

  /**
   * Rotates all pages in a PDF
   */
  static async rotatePDF(file: File, rotationDegrees: number): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    pages.forEach((page) => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + rotationDegrees));
    });
    
    return await pdfDoc.save();
  }

  /**
   * Splits a PDF into individual pages or a range (simplified to all pages as separate files)
   * This is a mocked multi-file return for the demonstration
   */
  static async splitPDF(file: File): Promise<Uint8Array[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    const results: Uint8Array[] = [];

    for (let i = 0; i < pageCount; i++) {
      const subDoc = await PDFDocument.create();
      const [copiedPage] = await subDoc.copyPages(pdfDoc, [i]);
      subDoc.addPage(copiedPage);
      results.push(await subDoc.save());
    }

    return results;
  }

  /**
   * Adds a watermark text to each page
   */
  static async addWatermark(file: File, text: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      page.drawText(text, {
        x: width / 4,
        y: height / 2,
        size: 50,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.3,
        rotate: degrees(45),
      });
    });

    return await pdfDoc.save();
  }

  /**
   * Simple "Compression" by stripping metadata (real compression is complex)
   */
  static async compressPDF(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    // Loading and re-saving with pdf-lib often results in smaller files if the original was messy
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    
    // We can't do heavy optimization easily in JS, but re-saving often helps
    return await pdfDoc.save({ useObjectStreams: true });
  }

  /**
   * Signs the last page of the PDF with a text-based signature
   */
  static async signPDF(file: File, signature: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    lastPage.drawText(signature, {
      x: 50,
      y: 50,
      size: 30,
      font,
      color: rgb(0, 0, 0),
    });

    return await pdfDoc.save();
  }

  /**
   * Basic text extraction for "PDF to Word" (actually returns a Text file)
   */
  static async extractText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
       const page = await pdf.getPage(i);
       const content = await page.getTextContent();
       const strings = content.items.map((item: any) => item.str);
       fullText += strings.join(" ") + "\n\n";
    }

    return fullText;
  }
}
