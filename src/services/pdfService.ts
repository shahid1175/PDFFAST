import { PDFDocument, rgb, StandardFonts, degrees, PDFDict, PDFName } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import DOMPurify from 'dompurify';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import JSZip from 'jszip';

// Set worker source for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface Annotation {
  type: 'text' | 'image' | 'rect';
  text?: string;
  image?: string; // data URL
  fontSize?: number;
  color?: string;
  fontStyle?: 'normal' | 'bold' | 'italic';
  x: number;
  y: number;
  width?: number; // for img/rect
  height?: number; // for img/rect
  pageIndex: number;
  opacity?: number;
}

export class PDFService {
  /**
   * OCR Fallback using Gemini for scanned PDFs
   */
  static async extractTextViaOCR(file: File): Promise<string> {
    console.log("Standard extraction failed. Attempting OCR fallback via Gemini...");
    
    const jpgs = await this.pdfToJpg(file);
    if (jpgs.length === 0) return "";

    try {
      const response = await fetch('/api/gemini/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: jpgs })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract text via OCR');
      }

      const data = await response.json();
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('AI could not identify any readable text in the document images.');
      }
      return data.text;
    } catch (err: any) {
      console.error("OCR fallback failed:", err);
      throw new Error(`OCR fallback failed: ${err.message}`);
    }
  }

  /**
   * Converts PDF pages to JPG data URLs with configurable scale and quality
   */
  static async pdfToJpg(file: File, password?: string, scale: number = 2.0, quality: number = 0.8): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const loadingTask = pdfjs.getDocument({ 
        data: arrayBuffer,
        password: password
      });
      const pdf = await loadingTask.promise;
      const jpgs: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
         const page = await pdf.getPage(i);
         const viewport = page.getViewport({ scale });
         const canvas = document.createElement('canvas');
         const context = canvas.getContext('2d');
         
         if (!context) continue;
         
         canvas.height = viewport.height;
         canvas.width = viewport.width;

         // @ts-ignore
         await page.render({ canvasContext: context, viewport: viewport }).promise;
         jpgs.push(canvas.toDataURL('image/jpeg', quality));
      }

      return jpgs;
    } catch (error: any) {
      if (error.name === 'PasswordException') {
        throw new Error("This PDF is password protected. Please provide the correct password.");
      }
      throw error;
    }
  }

  /**
   * Merges multiple PDF files into a single PDF
   */
  static async mergePDFs(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();
    
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    return await mergedPdf.save({ useObjectStreams: true });
  }

  /**
   * Rotates all pages in a PDF
   */
  static async rotatePDF(file: File, rotationDegrees: number): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    
    pages.forEach((page) => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees(currentRotation + rotationDegrees));
    });
    
    return await pdfDoc.save({ useObjectStreams: true });
  }

  /**
   * Parses a page range string like "1, 3-5" into an array of 0-indexed page numbers
   */
  private static parseRange(rangeStr: string, totalPages: number): number[] {
    const pages = new Set<number>();
    const cleaned = rangeStr.replace(/\s+/g, '');
    if (!cleaned || cleaned.toLowerCase() === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const parts = cleaned.split(',');
    
    parts.forEach(part => {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) {
            pages.add(i - 1);
          }
        }
      } else {
        const page = parseInt(part);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
          pages.add(page - 1);
        }
      }
    });
    
    return Array.from(pages).sort((a, b) => a - b);
  }

  /**
   * Splits a PDF into individual pages or extracts a range
   */
  static async splitPDF(file: File, range: string = 'all', mode: 'extract' | 'split' = 'split'): Promise<Blob> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();
    const indices = this.parseRange(range, totalPages);

    if (indices.length === 0) {
      throw new Error("Invalid page range specified.");
    }

    if (mode === 'extract') {
      // Extract specific pages into ONE new PDF
      const subDoc = await PDFDocument.create();
      const copiedPages = await subDoc.copyPages(pdfDoc, indices);
      copiedPages.forEach(page => subDoc.addPage(page));
      const pdfBytes = await subDoc.save();
      return new Blob([pdfBytes], { type: 'application/pdf' });
    } else {
      // Split each individual page into its own PDF and zip them
      const zip = new JSZip();
      
      for (const index of indices) {
        const subDoc = await PDFDocument.create();
        const [copiedPage] = await subDoc.copyPages(pdfDoc, [index]);
        subDoc.addPage(copiedPage);
        const pdfBytes = await subDoc.save();
        zip.file(`page-${index + 1}.pdf`, pdfBytes);
      }

      return await zip.generateAsync({ type: 'blob' });
    }
  }

  /**
   * Adds a text or image watermark to a PDF
   */
  static async addWatermark(
    file: File, 
    text: string, 
    opacity: number = 0.3,
    position: 'center' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom' = 'center',
    type: 'text' | 'image' = 'text',
    imageUrl?: string | null,
    rotation: number = 45,
    customX: number = 0,
    customY: number = 0,
    scale: number = 0.5
  ): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let watermarkImage: any = null;
    if (type === 'image' && imageUrl) {
      try {
        const imgData = imageUrl.split(',')[1];
        const imgBytes = Uint8Array.from(atob(imgData), c => c.charCodeAt(0));
        if (imageUrl.includes('image/png')) {
          watermarkImage = await pdfDoc.embedPng(imgBytes);
        } else {
          watermarkImage = await pdfDoc.embedJpg(imgBytes);
        }
      } catch (err) {
        console.error("Failed to embed watermark image:", err);
      }
    }

    pages.forEach((page) => {
      const { width, height } = page.getSize();
      
      const getBaseCoords = (w: number, h: number, rotationDeg: number) => {
        const rad = (rotationDeg * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // For center, we want the rotated rectangle's center to be at the page center
        if (position === 'center') {
          return {
            x: width / 2 - (w / 2) * cos + (h / 2) * sin,
            y: height / 2 - (w / 2) * sin - (h / 2) * cos
          };
        }

        switch (position) {
          case 'top': return { x: width / 2 - w / 2, y: height - h - 50 };
          case 'bottom': return { x: width / 2 - w / 2, y: 50 };
          case 'top-left': return { x: 50, y: height - h - 50 };
          case 'top-right': return { x: width - w - 50, y: height - h - 50 };
          case 'bottom-left': return { x: 50, y: 50 };
          case 'bottom-right': return { x: width - w - 50, y: 50 };
          case 'custom': return { x: customX, y: customY };
          default: return { x: width / 2, y: height / 2 };
        }
      };

      if (type === 'text') {
        const fontSize = 50;
        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
        const textHeight = helveticaFont.heightAtSize(fontSize);
        
        const rotationDegrees = degrees(rotation);
        const coords = getBaseCoords(textWidth, textHeight, rotation);
        
        page.drawText(text, {
          x: coords.x,
          y: coords.y,
          size: fontSize,
          font: helveticaFont,
          color: rgb(0.7, 0.7, 0.7),
          opacity: opacity,
          rotate: rotationDegrees,
        });
      } else if (watermarkImage) {
        // Proportionate scaling: User scale is percentage of page width
        const originalDims = watermarkImage.size();
        
        // If user scale is 0.5, we want image width to be 50% of page width
        const targetWidth = width * scale;
        const autoScale = targetWidth / originalDims.width;
        
        const imgDims = watermarkImage.scale(autoScale);
        const rotationDegrees = degrees(rotation);
        const coords = getBaseCoords(imgDims.width, imgDims.height, rotation);

        page.drawImage(watermarkImage, {
          x: coords.x,
          y: coords.y,
          width: imgDims.width,
          height: imgDims.height,
          opacity: opacity,
          rotate: rotationDegrees,
        });
      }
    });

    return await pdfDoc.save();
  }

  /**
   * Enhanced Compression logic
   */
  static async compressPDF(file: File, level: 'low' | 'medium' | 'high' = 'medium'): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    
    if (level === 'high') {
      // High compression: Flatten whole document to lower quality JPEGs
      return await this.flattenAndCompress(file, 1.0, 0.4); 
    }

    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    // Optimization: Strip metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    
    // Strip OCG (Layers) and extra structures
    try {
      if (pdfDoc.catalog.has(PDFName.of('OCProperties'))) {
        pdfDoc.catalog.delete(PDFName.of('OCProperties'));
      }
      if (pdfDoc.catalog.has(PDFName.of('PieceInfo'))) {
        pdfDoc.catalog.delete(PDFName.of('PieceInfo'));
      }
    } catch (e) {}

    // Iterate through pages and strip some resources if medium
    if (level === 'medium') {
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        try {
          const res = page.node.Resources();
          if (res) {
            // Stripping metadata from resources often saves space
            if (res.has(PDFName.of('Metadata'))) res.delete(PDFName.of('Metadata'));
            if (res.has(PDFName.of('PieceInfo'))) res.delete(PDFName.of('PieceInfo'));
          }
        } catch (e) {}
      });
    }

    // Re-saving with object streams is the main thing pdf-lib can do to compress internal structures
    return await pdfDoc.save({ 
      useObjectStreams: true, 
      addDefaultPage: false,
      updateFieldAppearances: false
    });
  }

  /**
   * Flattens a PDF by converting all pages to images and re-saving them.
   * Very effective for compression, but loses text selectability.
   */
  private static async flattenAndCompress(file: File, scale: number, quality: number): Promise<Uint8Array> {
    const images = await this.pdfToJpg(file, undefined, scale, quality);
    const outPdf = new jsPDF('p', 'mm', 'a4');
    
    for (let i = 0; i < images.length; i++) {
      if (i > 0) outPdf.addPage();
      const pdfWidth = outPdf.internal.pageSize.getWidth();
      const pdfHeight = outPdf.internal.pageSize.getHeight();
      
      outPdf.addImage(images[i], 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }
    return new Uint8Array(outPdf.output('arraybuffer'));
  }

  /**
   * Remove password from a PDF (requires the password to read it)
   */
  static async removePassword(file: File, password?: string): Promise<Uint8Array> {
    try {
      const images = await this.pdfToJpg(file, password);
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
      });

      for (let i = 0; i < images.length; i++) {
          if (i > 0) pdf.addPage();
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          pdf.addImage(images[i], 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      return new Uint8Array(pdf.output('arraybuffer'));
    } catch (error: any) {
      if (error.message.includes('password') || error.name === 'PasswordException') {
        throw new Error('Could not unlock PDF. Please double-check the password.');
      }
      throw error;
    }
  }

  /**
   * Basic "Watermark Removal" - Heuristic approach removing suspected watermark layers/text
   * We'll try to find any transparent overlays, annotations, and Optional Content Groups.
   */
  static async removeWatermark(file: File, deepClean: boolean = false): Promise<Uint8Array> {
    if (deepClean) {
      // Deep clean flattens the document and attempts to filter out light colors (common in watermarks)
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const outPdf = new jsPDF('p', 'mm', 'a4');
      
      for (let i = 1; i <= pdf.numPages; i++) {
        if (i > 1) outPdf.addPage();
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // @ts-ignore
        await page.render({ canvasContext: context, viewport: viewport }).promise;

        // NEW: Color Bleaching Filter
        // Most watermarks are light gray or very faint. We'll push very light colors to pure white.
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let j = 0; j < data.length; j += 4) {
          const r = data[j];
          const g = data[j+1];
          const b = data[j+2];
          // If the color is very light (high values across RGB), push it to white
          const brightness = (r + g + b) / 3;
          if (brightness > 220) { // 220-240 is usually where watermarks live
            data[j] = 255;
            data[j+1] = 255;
            data[j+2] = 255;
          }
        }
        context.putImageData(imageData, 0, 0);

        const imgData = canvas.toDataURL('image/jpeg', 0.8);
        const pdfWidth = outPdf.internal.pageSize.getWidth();
        const pdfHeight = outPdf.internal.pageSize.getHeight();
        outPdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
      return new Uint8Array(outPdf.output('arraybuffer'));
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    // 1. Heavy OCG (Optional Content Group) removal
    try {
      if (pdfDoc.catalog.has(PDFName.of('OCProperties'))) {
        pdfDoc.catalog.delete(PDFName.of('OCProperties'));
      }
    } catch (e) {
      console.warn("OCG sweep failed", e);
    }

    const pages = pdfDoc.getPages();

    // COMMUNAL DETECTION: Count how often XObjects appear across pages
    const xObjectOccurrence = new Map<string, number>();
    pages.forEach(page => {
      try {
        const res = page.node.Resources();
        if (!res) return;
        const xObjs = res.get(PDFName.of('XObject'));
        if (xObjs instanceof PDFDict) {
          xObjs.keys().forEach(k => {
            const val = xObjs.get(k);
            if (val) {
              const refString = val.toString();
              xObjectOccurrence.set(refString, (xObjectOccurrence.get(refString) || 0) + 1);
            }
          });
        }
      } catch (e) {}
    });

    pages.forEach((page) => {
      try {
        // 2. Clear Annots
        const annots = page.node.Annots();
        if (annots) {
          for (let i = annots.size() - 1; i >= 0; i--) {
            annots.remove(i);
          }
        }

        // 3. Clear PieceInfo and Metadata
        if (page.node.has(PDFName.of('PieceInfo'))) page.node.delete(PDFName.of('PieceInfo'));
        if (page.node.has(PDFName.of('Metadata'))) page.node.delete(PDFName.of('Metadata'));

        // 4. Resources sweep
        const resources = page.node.Resources();
        if (resources) {
          // Clear ExtGState (transparency)
          if (resources.has(PDFName.of('ExtGState'))) resources.delete(PDFName.of('ExtGState'));

          // Inspect XObjects
          const xObjects = resources.get(PDFName.of('XObject'));
          if (xObjects instanceof PDFDict) {
            const keys = xObjects.keys();
            keys.forEach(key => {
              const name = key.asString().toLowerCase();
              const xObj = xObjects.get(key);
              
              let deleteThis = false;
              if (
                name.includes('watermark') || 
                name.includes('stamp') || 
                name.includes('background') || 
                name.includes('overlay') ||
                name.includes('artifact') ||
                name.includes('draft') ||
                name.includes('header') ||
                name.includes('footer')
              ) {
                deleteThis = true;
              }

              // Communal detection logic: if this object appears on more than 30% of pages, it's likely boilerplate/watermark
              if (!deleteThis && xObj) {
                const occurrence = xObjectOccurrence.get(xObj.toString()) || 0;
                if (pages.length > 2 && occurrence > pages.length * 0.3) {
                  deleteThis = true;
                }
              }

              // Check if it's a transparency group/form often used for watermarks
              if (!deleteThis && xObj instanceof PDFDict) {
                if (xObj.has(PDFName.of('Group'))) deleteThis = true;
                if (xObj.has(PDFName.of('Metadata'))) deleteThis = true;
              }

              if (deleteThis) {
                xObjects.delete(key);
              }
            });
          }
        }
      } catch (err) {
        console.warn("Page sweep error", err);
      }
    });

    // 5. Metadata Wipe
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');

    return await pdfDoc.save({ useObjectStreams: true });
  }

  /**
   * PDF Locking (Password Protection)
   * Using jsPDF for client-side encryption.
   */
  static async lockPDF(file: File, password?: string): Promise<Uint8Array> {
    if (!password) return new Uint8Array(await file.arrayBuffer());

    console.log("Locking PDF using jsPDF encryption...");
    // For more reliable protection that preserves vector data, we'd normally use a server-side tool.
    // Client-side, we continue with the flattening strategy as it's the most compatible with encrypted jsPDF output.
    const images = await this.pdfToJpg(file);
    
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      encryption: {
        userPassword: password,
        ownerPassword: password,
        userPermissions: ['print', 'copy']
      }
    });

    for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(images[i], 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    return new Uint8Array(pdf.output('arraybuffer'));
  }

  /**
   * Signs the last page of the PDF with a text-based signature
   */
  static async signPDF(file: File, signature: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    const { width } = lastPage.getSize();

    lastPage.drawText(signature, {
      x: width - 200,
      y: 50,
      size: 20,
      font,
      color: rgb(0, 0, 0.5),
    });

    return await pdfDoc.save();
  }

  /**
   * Helper to convert hex color to RGB for pdf-lib (0-1 range)
   */
  private static hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Basic "Editor" implementation - prepends a summary page if provided, and adds annotations
   */
  static async editPDF(file: File, summary?: string, annotations?: Annotation[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    // Embed fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    if (summary) {
      const firstPage = pdfDoc.insertPage(0);
      const { width, height } = firstPage.getSize();
      
      firstPage.drawText("AI Summary & Edits", {
        x: 50,
        y: height - 50,
        size: 24,
        font: helveticaBold,
        color: rgb(0.3, 0.3, 0.9),
      });

      const lines = summary.split('\n');
      let yOffset = height - 100;
      for (const line of lines) {
        firstPage.drawText(line, {
          x: 50,
          y: yOffset,
          size: 12,
          font: helvetica,
        });
        yOffset -= 20;
      }
    }

    if (annotations && annotations.length > 0) {
      const pages = pdfDoc.getPages();
      for (const ann of annotations) {
        if (ann.pageIndex >= 0 && ann.pageIndex < pages.length) {
          const page = pages[ann.pageIndex];
          const color = this.hexToRgb(ann.color || '#000000');
          const opacity = ann.opacity ?? 1;

          if (ann.type === 'text' && ann.text) {
            let font = helvetica;
            if (ann.fontStyle === 'bold') font = helveticaBold;
            if (ann.fontStyle === 'italic') font = helveticaItalic;

            page.drawText(ann.text, {
              x: ann.x,
              y: ann.y,
              size: ann.fontSize || 12,
              font: font,
              color: rgb(color.r, color.g, color.b),
              opacity,
            });
          } else if (ann.type === 'rect') {
            page.drawRectangle({
              x: ann.x,
              y: ann.y,
              width: ann.width || 100,
              height: ann.height || 20,
              color: rgb(color.r, color.g, color.b),
              opacity,
            });
          } else if (ann.type === 'image' && ann.image) {
            try {
              const imgData = ann.image.split(',')[1];
              const imgBytes = Uint8Array.from(atob(imgData), c => c.charCodeAt(0));
              const embed = ann.image.includes('image/png') ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
              
              page.drawImage(embed, {
                x: ann.x,
                y: ann.y,
                width: ann.width || embed.width,
                height: ann.height || embed.height,
                opacity,
              });
            } catch (e) {
              console.error("Failed to embed annotation image:", e);
            }
          }
        }
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Text extraction for "PDF to Word"
   */
  static async extractText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ 
      data: arrayBuffer,
      disableFontFace: false,
      useSystemFonts: true,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/cmaps/',
      cMapPacked: true
    });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
       const page = await pdf.getPage(i);
       const content = await page.getTextContent();
       
       // Sort items: Y decreasing (top to bottom), then X increasing (left to right)
       const items = [...content.items] as any[];
       items.sort((a, b) => {
         const yA = a.transform[5];
         const yB = b.transform[5];
         if (Math.abs(yA - yB) > 5) { // Significant vertical difference
           return yB - yA;
         }
         return a.transform[4] - b.transform[4]; // horizontal flow
       });

       let lastY: number | null = null;
       let lastX: number | null = null;
       let pageText = "";

       items.forEach((item: any) => {
         const x = item.transform[4];
         const y = item.transform[5];
         const itemStr = (item.str || "").normalize('NFKC');

         // Line break detection
         if (lastY !== null && Math.abs(y - lastY) > 8) {
           pageText += "\n";
           lastX = null;
         } else if (lastX !== null && lastY !== null && Math.abs(y - lastY) < 5) {
           // Horizontal spacing detection
           const gap = x - lastX;
           if (gap > 2 && !itemStr.startsWith(" ") && !pageText.endsWith(" ")) {
             pageText += " ";
           }
         }
         
         pageText += itemStr;
         lastY = y;
         // Use the predicted end of the string if width is available
         lastX = x + (item.width || 0);
       });

       fullText += pageText + "\n\n";
    }

    // Clean text: keep valid Unicode including Bengali and other ranges
    const result = fullText
      .replace(/\u0000/g, '')
      .replace(/[\uE000-\uF8FF]/g, '') // Remove Private Use Area characters
      .trim();

    if (result.length < 10) {
      return await this.extractTextViaOCR(file);
    }

    return result;
  }

  /**
   * Converts PDF to a DOCX file
   */
  static async convertToWord(file: File): Promise<Blob> {
    console.log("Starting PDF to Word conversion...");
    const text = await this.extractText(file);
    
    if (!text || text.trim().length === 0) {
      throw new Error("Could not extract any readable text from the PDF.");
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: text.split('\n').map(line => {
          const trimmedLine = line.trim();
          return new Paragraph({
            children: [new TextRun({
              text: trimmedLine || " ",
              size: 24, // 12pt
              font: {
                ascii: "Arial",
                cs: "Siyam Rupali", // Fallback for complex scripts like Bengali
                hint: "eastAsia",
              },
            })],
          });
        }),
      }],
    });

    console.log("Word document generated, packing to blob...");
    return await Packer.toBlob(doc);
  }
}

export async function convertWordToPdf(file: File): Promise<Uint8Array> {
  console.log("Starting Word to PDF conversion for:", file.name);
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Use convertToHtml to preserve formatting and better handle character encoding
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    
    if (!html || html.trim().length === 0) {
      throw new Error("The Word document appears to be empty or could not be read.");
    }

    // Create an iframe to isolate the rendering from the main document's Tailwind v4 CSS (which uses oklch)
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      position: 'absolute',
      left: '-9999px',
      top: '0',
      width: '210mm',
      height: '100%',
      border: 'none',
      visibility: 'hidden'
    });
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error("Could not create rendering iframe");

    // Write a clean HTML structure without the global Tailwind CSS
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              margin: 0; 
              padding: 20mm; 
              background-color: white; 
              color: black; 
              font-family: "Times New Roman", Times, serif, "Siyam Rupali", "SolaimanLipi", sans-serif;
              font-size: 12pt;
              line-height: 1.5;
              width: 210mm;
              box-sizing: border-box;
              word-wrap: break-word;
            }
            p { margin-bottom: 1em; }
            h1, h2 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: bold; }
          </style>
        </head>
        <body>
          <div id="content">${DOMPurify.sanitize(html)}</div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Wait slightly for any rendering to settle
    await new Promise(resolve => setTimeout(resolve, 300));

    const contentElement = iframeDoc.body;

    const canvas = await html2canvas(contentElement, {
      scale: 2, // High resolution for readability
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: contentElement.scrollWidth,
      height: contentElement.scrollHeight
    });

    // Cleanup
    document.body.removeChild(iframe);

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add subsequent pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    console.log("Word to PDF conversion successful (OCR-style for multilingual support)");
    return new Uint8Array(pdf.output('arraybuffer'));
  } catch (error: any) {
    console.error("Word to PDF error:", error);
    throw new Error(`Word to PDF conversion failed: ${error.message}`);
  }
}
