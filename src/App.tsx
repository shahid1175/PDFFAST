import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Merge, 
  Split, 
  Minimize2, 
  RotateCw, 
  FileImage, 
  Image as ImageIcon,
  Type as TypeIcon, 
  Lock, 
  PenTool, 
  Layers, 
  ArrowRightLeft,
  ChevronLeft,
  Upload,
  Download,
  AlertCircle,
  Square,
  Trash2,
  Palette,
  Maximize,
  Move,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Types
type ToolId = 
  | 'compress' | 'merge' | 'pdf-to-word' | 'word-to-pdf' 
  | 'split' | 'pdf-to-jpg' | 'rotate' | 'editor' 
  | 'unlock' | 'lock' | 'remove-watermark' | 'sign' | 'watermark' | 'pdf-to-text';

interface Tool {
  id: ToolId;
  name: string;
  description: string;
  traffic?: 'popular' | 'niche' | 'rising';
  difficulty?: 'easy' | 'normal';
  stats?: string;
  icon: React.ElementType;
  keywords: string[];
  color: string;
  hoverBorder: string;
  iconBg: string;
  iconColor: string;
}

interface SiteConfig {
  brandName: string;
  brandAccent: string;
  primaryColor: string;
  borderRadius: string; // 'none', 'md', 'xl', '3xl'
  shadowStrength: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  fontScale: number; // multiplier
  headerSticky: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroButton: string;
  headerButton: string;
  tools: Record<ToolId, { name: string; description: string; stats?: string }>;
  footerTraffic: string;
  footerTeams: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  brandName: '',
  brandAccent: '',
  primaryColor: '#4f46e5', // indigo-600
  borderRadius: '1.5rem', // 24px/3xl
  shadowStrength: 'xl',
  fontScale: 1,
  headerSticky: true,
  heroTitle: "The World's Favorite PDF Tool",
  heroSubtitle: 'Quick, secure, and completely online. Join over 800 million users monthly.',
  heroButton: '',
  headerButton: '',
  footerTraffic: '',
  footerTeams: '',
  tools: {
    compress: { name: 'Compress PDF', description: 'Reduce file size while keeping best quality' },
    merge: { name: 'Merge PDF', description: 'Combine multiple PDFs into one easily' },
    'pdf-to-word': { name: 'PDF to Word', description: 'Convert PDF files to editable Word docs' },
    editor: { name: 'PDF Editor', description: 'Edit text, add images, and annotate online' },
    'word-to-pdf': { name: 'Word to PDF', description: 'Convert DOCX files to PDF instantly' },
    split: { name: 'Split PDF', description: 'Extract one or multiple pages from PDF' },
    'pdf-to-jpg': { name: 'PDF to JPG', description: 'Convert each PDF page into an image' },
    unlock: { name: 'Unlock PDF', description: 'Remove passwords from protected files' },
    sign: { name: 'Sign PDF', description: 'Add your e-signature or request signatures' },
    rotate: { name: 'Rotate PDF', description: 'Fix orientation of PDF pages easily' },
    watermark: { name: 'Watermark', description: 'Stamp image or text over your PDF' },
    lock: { name: 'Lock PDF', description: 'Protect PDF with a password' },
    'remove-watermark': { name: 'Remove Watermark', description: 'Remove transparent text or images' },
    'pdf-to-text': { name: 'PDF to Text', description: 'Extract all text content from PDF to a TXT file' },
  }
};

const TOOLS: Tool[] = [
  { id: 'compress', name: 'Compress PDF', description: 'Reduce file size while keeping best quality', traffic: 'popular', icon: Minimize2, keywords: ['compress pdf free'], color: 'bg-orange-600', hoverBorder: 'hover:border-orange-400', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { id: 'merge', name: 'Merge PDF', description: 'Combine multiple PDFs into one easily', traffic: 'popular', icon: Merge, keywords: ['merge pdf'], color: 'bg-blue-600', hoverBorder: 'hover:border-blue-400', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF files to editable Word docs', traffic: 'popular', icon: FileText, keywords: ['pdf to word'], color: 'bg-indigo-600', hoverBorder: 'hover:border-indigo-400', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { id: 'editor', name: 'PDF Editor', description: 'Edit text, add images, and annotate online', traffic: 'popular', icon: TypeIcon, keywords: ['edit pdf'], color: 'bg-purple-600', hoverBorder: 'hover:border-purple-400', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { id: 'word-to-pdf', name: 'Word to PDF', description: 'Convert DOCX files to PDF instantly', icon: ArrowRightLeft, keywords: ['word to pdf'], color: 'bg-emerald-600', hoverBorder: 'hover:border-emerald-400', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { id: 'split', name: 'Split PDF', description: 'Extract one or multiple pages from PDF', icon: Split, keywords: ['split pdf'], color: 'bg-cyan-600', hoverBorder: 'hover:border-cyan-400', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { id: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Convert each PDF page into an image', icon: FileImage, keywords: ['pdf to jpg'], color: 'bg-pink-600', hoverBorder: 'hover:border-pink-400', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { id: 'unlock', name: 'Unlock PDF', description: 'Remove passwords from protected files', icon: Lock, keywords: ['remove password'], color: 'bg-rose-600', hoverBorder: 'hover:border-rose-400', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  { id: 'sign', name: 'Sign PDF', description: 'Add your e-signature or request signatures', icon: PenTool, keywords: ['sign pdf'], color: 'bg-amber-600', hoverBorder: 'hover:border-amber-400', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { id: 'rotate', name: 'Rotate PDF', description: 'Fix orientation of PDF pages easily', icon: RotateCw, keywords: ['rotate pdf'], color: 'bg-slate-600', hoverBorder: 'hover:border-slate-400', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  { id: 'watermark', name: 'Watermark', description: 'Stamp image or text over your PDF', icon: Layers, keywords: ['watermark'], color: 'bg-red-600', hoverBorder: 'hover:border-red-400', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  { id: 'lock', name: 'Lock PDF', description: 'Protect PDF with a password', icon: Lock, keywords: ['secure pdf'], color: 'bg-slate-800', hoverBorder: 'hover:border-slate-600', iconBg: 'bg-slate-200', iconColor: 'text-slate-800' },
  { id: 'remove-watermark', name: 'Remove Watermark', description: 'Remove transparent text or images', icon: Minimize2, keywords: ['clean watermark'], color: 'bg-cyan-700', hoverBorder: 'hover:border-cyan-500', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-700' },
  { id: 'pdf-to-text', name: 'PDF to Text', description: 'Extract all text content from PDF to a TXT file', traffic: 'rising', icon: FileText, keywords: ['pdf to text', 'extract text'], color: 'bg-teal-600', hoverBorder: 'hover:border-teal-400', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
];

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [premiumComingSoon, setPremiumComingSoon] = useState(false);
  const [siteConfig] = useState<SiteConfig>(() => {
    const saved = localStorage.getItem('siteConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const selectedToolData = activeTool ? siteConfig.tools[activeTool] : null;
  const toolBaseInfo = TOOLS.find(t => t.id === activeTool);

  const shadowClasses: Record<string, string> = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  return (
    <div 
      className="min-h-screen flex transition-all duration-300"
      style={{ 
        '--primary': siteConfig.primaryColor,
        '--radius': siteConfig.borderRadius,
        '--font-scale': siteConfig.fontScale,
      } as React.CSSProperties}
    >
      <div className="flex-1 flex flex-col min-w-0" style={{ '--primary': siteConfig.primaryColor } as React.CSSProperties}>
        {/* Header */}
        <header className={cn(
          "right-0 z-50 bg-white/90 backdrop-blur-md border-b border-indigo-100 px-8 py-4 flex items-center justify-between transition-all duration-300",
          siteConfig.headerSticky ? "fixed" : "relative",
          shadowClasses[siteConfig.shadowStrength]
        )}>
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => setActiveTool(null)}
          >
            {siteConfig.brandName && (
              <div 
                style={{ backgroundColor: siteConfig.primaryColor, borderRadius: siteConfig.borderRadius }}
                className="w-10 h-10 flex items-center justify-center text-white font-black text-xl italic group-hover:scale-105 transition-transform"
              >
                {siteConfig.brandName.charAt(0)}
              </div>
            )}
            <span className={cn("text-2xl font-black text-slate-900 tracking-tight transition-all")} style={{ fontSize: `calc(1.5rem * var(--font-scale))` }}>
              {siteConfig.brandName}<span style={{ color: siteConfig.primaryColor }} className="italic">{siteConfig.brandAccent}</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            {siteConfig.headerButton && (
              <button 
                style={{ backgroundColor: siteConfig.primaryColor, borderRadius: siteConfig.borderRadius }}
                className={cn("px-5 py-2 text-white text-sm font-bold shadow-indigo-100 hover:opacity-90 transition-all active:scale-95", shadowClasses[siteConfig.shadowStrength])}
              >
                {siteConfig.headerButton}
              </button>
            )}
          </nav>
        </header>

        {/* Main Content */}
        <main className={cn("flex-1 pb-12 overflow-x-hidden", siteConfig.headerSticky ? "pt-32" : "pt-12")}>
          <AnimatePresence mode="wait">
            {!activeTool ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-7xl mx-auto px-8"
              >
                <div className="text-center mb-12 relative group">
                  <h1 
                    className="font-black text-slate-900 mb-2 tracking-tight transition-all"
                    style={{ fontSize: `calc(3rem * var(--font-scale))` }}
                  >
                    {siteConfig.heroTitle}
                  </h1>
                  <p 
                    className="text-slate-500 font-medium transition-all"
                    style={{ fontSize: `calc(1.125rem * var(--font-scale))` }}
                  >
                    {siteConfig.heroSubtitle}
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3 flex-wrap text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] transition-all">
                    <span className="inline-flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-indigo-500" />100% Free</span>
                    <span className="inline-flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-indigo-500" />No Signup Required</span>
                    <span className="inline-flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-indigo-500" />No GitHub Required</span>
                    <span className="inline-flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-indigo-500" />Secure & Fast</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {TOOLS.map((tool) => (
                    <ToolCard 
                      key={tool.id} 
                      tool={tool} 
                      toolOverride={siteConfig.tools[tool.id]}
                      onClick={() => setActiveTool(tool.id)}
                      borderRadius={siteConfig.borderRadius}
                      shadowWeight={shadowClasses[siteConfig.shadowStrength]}
                    />
                  ))}
                  
                  {/* Promotional Card */}
                  <div 
                    style={{ backgroundColor: siteConfig.primaryColor, borderRadius: siteConfig.borderRadius }}
                    className={cn("p-5 flex flex-col justify-between text-white transition-transform hover:-translate-y-1 shadow-indigo-100", shadowClasses[siteConfig.shadowStrength])}
                  >
                    <div>
                      <h3 className="font-bold text-xl mb-1">Pro Version</h3>
                      <p className="text-xs text-white/80 leading-relaxed">Batch processing, OCR, and no file limits.</p>
                      <ul className="mt-4 space-y-2">
                        <li className="flex items-center gap-2 text-[10px] font-bold">
                          <Download size={14} className="opacity-60" />
                          UNLIMITED FILES
                        </li>
                        <li className="flex items-center gap-2 text-[10px] font-bold">
                          <Lock size={14} className="opacity-60" />
                          256-BIT ENCRYPTION
                        </li>
                      </ul>
                    </div>
                    <button 
                      onClick={() => {
                        setPremiumComingSoon(true);
                        setTimeout(() => setPremiumComingSoon(false), 2000);
                      }}
                      className="w-full py-2 bg-white text-slate-900 rounded-lg text-sm font-black mt-4 uppercase hover:bg-white/90 transition-colors"
                    >
                      {premiumComingSoon ? 'Coming Soon' : 'Go Premium'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="workspace"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-4xl mx-auto px-4"
              >
                <button 
                  onClick={() => setActiveTool(null)}
                  className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 group"
                >
                  <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                  Back to all tools
                </button>

                <div 
                  style={{ borderRadius: siteConfig.borderRadius }}
                  className={cn("bg-white border border-slate-100 overflow-hidden min-h-[500px] flex flex-col", shadowClasses[siteConfig.shadowStrength])}
                >
                  <div 
                    style={{ backgroundColor: toolBaseInfo?.color.includes('bg-') ? undefined : siteConfig.primaryColor }}
                    className={cn("px-8 py-6 flex items-center justify-between text-white transition-colors duration-500", toolBaseInfo?.color)}
                  >
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-3">
                        {toolBaseInfo?.icon && <toolBaseInfo.icon size={28} />}
                        {selectedToolData?.name || toolBaseInfo?.name}
                      </h2>
                      <p className="opacity-90">{selectedToolData?.description || toolBaseInfo?.description}</p>
                    </div>
                  </div>

                  <div className="flex-1 p-8 flex flex-col items-center justify-center">
                    <Workspace toolId={activeTool} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="px-8 py-6 bg-white border-t border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col gap-1">
            <div className="flex gap-6 justify-center md:justify-start">
              {siteConfig.footerTraffic && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{siteConfig.footerTraffic}</span>}
              {siteConfig.footerTeams && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{siteConfig.footerTeams}</span>}
            </div>
            <p className="text-[10px] font-medium text-slate-400 max-w-md">
              Powered by <span className="text-brand-600 font-bold">CleverUtils Free API</span> - 1000 free conversions per day! Files auto-deleted after 2 hours.
            </p>
          </div>
          <div className="flex gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-5 h-5 bg-slate-100 rounded"></div>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}

const ToolCard: React.FC<{ 
  tool: Tool; 
  toolOverride?: { name: string; description: string; stats?: string }; 
  onClick: () => void; 
  borderRadius: string; 
  shadowWeight: string; 
}> = ({ tool, toolOverride, onClick, borderRadius, shadowWeight }) => {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      style={{ borderRadius }}
      className={cn(
        "tool-card group p-5 pt-7 text-left transition-all border border-slate-100 bg-white min-h-[160px] flex flex-col justify-between",
        tool.hoverBorder,
        shadowWeight
      )}
    >
      <div className="w-full">
        <div className="flex justify-between items-start mb-3">
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", tool.iconBg, tool.iconColor)}>
            <tool.icon size={24} />
          </div>
          
          <div className="flex flex-col items-end gap-1">
            {tool.traffic === 'popular' && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                🔥 Popular
              </span>
            )}
            {tool.id === 'editor' && (
              <span className="px-2 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded uppercase flex items-center gap-1">
                ✦ AI Beta
              </span>
            )}
          </div>
        </div>
        
        <h3 className="font-bold text-slate-800 text-lg">{toolOverride?.name || tool.name}</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
          {toolOverride?.description || tool.description}
        </p>
      </div>

      <div className="text-[11px] font-bold text-slate-400 mt-4 uppercase tracking-tight">
        FREE PDF TOOL
      </div>
    </motion.button>
  );
}

import { PDFService, convertWordToPdf, Annotation } from './services/pdfService';
import { downloadBlob } from './lib/utils';
import JSZip from 'jszip';



function Workspace({ toolId }: { toolId: ToolId }) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [options, setOptions] = useState({
    rotation: 90,
    watermark: 'DocuFlow',
    watermarkType: 'text' as 'text' | 'image',
    watermarkOpacity: 0.3,
    watermarkPosition: 'center' as 'center' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom',
    watermarkX: 0,
    watermarkY: 0,
    watermarkRotation: 45,
    watermarkScale: 0.5,
    watermarkImage: null as string | null,
    password: '',
    newPassword: '',
    signature: 'Digitally Signed',
    splitRange: 'all',
    splitMode: 'split' as 'extract' | 'split',
    removeWatermarkDeep: false,
    compressionLevel: 'medium' as 'low' | 'medium' | 'high',
    annotations: [] as Annotation[],
  });

  const addAnnotation = (type: 'text' | 'image' | 'rect' = 'text') => {
    const newAnn: Annotation = {
      type,
      text: type === 'text' ? 'New Text' : undefined,
      fontSize: 24,
      color: type === 'rect' ? '#ffffff' : '#4f46e5',
      fontStyle: 'bold',
      x: 50,
      y: 500,
      width: type === 'rect' || type === 'image' ? 100 : undefined,
      height: type === 'rect' || type === 'image' ? 50 : undefined,
      pageIndex: 0,
      opacity: 1
    };
    setOptions({ ...options, annotations: [...options.annotations, newAnn] });
  };

  const updateAnnotation = (index: number, updates: Partial<Annotation>) => {
    const newAnns = [...options.annotations];
    newAnns[index] = { ...newAnns[index], ...updates };
    setOptions({ ...options, annotations: newAnns });
  };

  const removeAnnotation = (index: number) => {
    setOptions({ ...options, annotations: options.annotations.filter((_, i) => i !== index) });
  };

  const [previewPage, setPreviewPage] = useState<number>(0);
  const [pageThumb, setPageThumb] = useState<string | null>(null);

  useEffect(() => {
    if (toolId === 'editor' && files.length > 0) {
      const loadThumb = async () => {
        try {
          const thumbs = await PDFService.pdfToJpg(files[0], undefined, 1.0, 0.6);
          if (thumbs[previewPage]) {
            setPageThumb(thumbs[previewPage]);
          }
        } catch (e) {
          console.error("Thumb load failed", e);
        }
      };
      loadThumb();
    }
  }, [toolId, files, previewPage]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setResult(null);
    }
  };

  const processFile = async () => {
    if (files.length === 0) return;

    // Prerequisite: Input Validation
    try {
      if (toolId === 'rotate' && (options.rotation % 90 !== 0 || options.rotation === 0)) {
        throw new Error("Please select a standard rotation (90, 180, or 270 degrees).");
      }
      if (toolId === 'watermark') {
        if (options.watermarkType === 'text' && options.watermark.trim().length === 0) {
          throw new Error("Please enter the text you want to use as a watermark.");
        }
        if (options.watermarkType === 'image' && !options.watermarkImage) {
          throw new Error("Please upload an image to use as your watermark.");
        }
      }
      if (toolId === 'split' && !options.splitRange.trim()) {
        throw new Error("Page range cannot be empty. Use 'all' or specific pages like '1, 2-5'.");
      }
      if (toolId === 'sign' && options.signature.trim().length === 0) {
        throw new Error("Signature text is required to sign the document.");
      }
      if (toolId === 'unlock' && !options.password) {
        throw new Error("Password is required to unlock this document.");
      }
      if (toolId === 'lock' && !options.newPassword) {
        throw new Error("Please set a password to lock this PDF.");
      }
      if (toolId === 'editor' && options.annotations.length === 0) {
        throw new Error("Please add at least one annotation (text, image, or shape) before saving.");
      }
    } catch (validationError: any) {
      setResult(`Setup needed: ${validationError.message}`);
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      let output: any;
      let fileName = `docuflow-${toolId}.pdf`;

      switch (toolId) {
        case 'merge':
          output = await PDFService.mergePDFs(files);
          break;
        case 'rotate':
          output = await PDFService.rotatePDF(files[0], options.rotation);
          break;
        case 'watermark':
          output = await PDFService.addWatermark(
            files[0], 
            options.watermark,
            options.watermarkOpacity,
            options.watermarkPosition,
            options.watermarkType,
            options.watermarkImage,
            options.watermarkRotation,
            options.watermarkX,
            options.watermarkY,
            options.watermarkScale
          );
          break;
        case 'compress':
          output = await PDFService.compressPDF(files[0], options.compressionLevel);
          break;
         case 'split':
          output = await PDFService.splitPDF(files[0], options.splitRange, options.splitMode);
          fileName = options.splitMode === 'split' ? `docuflow-split-${files[0].name.replace('.pdf', '')}.zip` : `docuflow-extracted-${files[0].name}`;
          break;
        case 'pdf-to-jpg':
          const images = await PDFService.pdfToJpg(files[0]);
          if (images.length === 1) {
            const link = document.createElement('a');
            link.href = images[0];
            link.download = 'docuflow-page-1.jpg';
            link.click();
            setResult(`Converted 1 page to JPG!`);
          } else {
            const zip = new JSZip();
            images.forEach((img, idx) => {
              const base64Data = img.split(',')[1];
              zip.file(`page-${idx + 1}.jpg`, base64Data, { base64: true });
            });
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            downloadBlob(zipBlob, `docuflow-images-${files[0].name.replace('.pdf', '')}.zip`);
            setResult(`Converted ${images.length} pages to JPG! Downloaded as .zip.`);
          }
          setProcessing(false);
          return;
        case 'sign':
          output = await PDFService.signPDF(files[0], options.signature);
          break;
        case 'pdf-to-word':
          output = await PDFService.convertToWord(files[0]);
          fileName = files[0].name.replace(/\.[^/.]+$/, "") + ".docx";
          downloadBlob(output as Blob, fileName);
          setResult("Converted PDF to Word successfully! Downloaded as .docx.");
          setProcessing(false);
          return;
        case 'word-to-pdf':
          output = await convertWordToPdf(files[0]);
          fileName = files[0].name.replace(/\.[^/.]+$/, "") + ".pdf";
          break;
        case 'editor':
          output = await PDFService.editPDF(files[0], undefined, options.annotations);
          break;
        case 'unlock':
          output = await PDFService.removePassword(files[0], options.password);
          break;
        case 'lock':
          output = await PDFService.lockPDF(files[0], options.newPassword);
          break;
        case 'remove-watermark':
          output = await PDFService.removeWatermark(files[0], options.removeWatermarkDeep);
          break;
        case 'pdf-to-text':
          const text = await PDFService.extractText(files[0]);
          if (!text || text.trim().length < 2) {
            throw new Error("We couldn't extract any text from this PDF. It might be an empty document or have structural issues. If it's a scanned document, our OCR might have failed to recognize the characters.");
          }
          output = new Blob([text], { type: 'text/plain' });
          fileName = files[0].name.replace(/\.[^/.]+$/, "") + ".txt";
          downloadBlob(output as Blob, fileName);
          setResult("Extracted text successfully! Powered by CleverUtils Free API.");
          setProcessing(false);
          return;
        default:
          throw new Error('This tool is currently in maintenance or coming soon!');
      }

      const blob = new Blob([output], { type: 'application/pdf' });
      downloadBlob(blob, fileName);
      setResult("Successfully processed! Your download should have started.");
    } catch (error: any) {
      console.error(error);
      let userMessage = error.message || 'Something went wrong.';
      
      // Proactive error messaging as requested
      if (userMessage.includes('Missing or insufficient permissions')) {
        userMessage = "Access denied: The server refused the request. Please try again later.";
      } else if (userMessage.includes('Quota exceeded') || userMessage.includes('429')) {
        userMessage = "Service limit reached: The free extraction API is currently busy or at capacity. Please try again in a few minutes or with a smaller file.";
      } else if (userMessage.includes('password') || userMessage.includes('encrypted')) {
        userMessage = "Protected File: This PDF is encrypted. Use our 'Unlock PDF' tool to remove the password before processing.";
      } else if (userMessage.includes('fetch') || userMessage.includes('network')) {
        userMessage = "Network error: Connection to our processing server failed. Please check your internet or try again later.";
      }
      
      setResult(`Unable to process: ${userMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  const isMultiFile = toolId === 'merge';
  const acceptedTypes = toolId === 'word-to-pdf' ? '.docx' : '.pdf';

  return (
    <div className="w-full max-w-lg mx-auto">
      {files.length === 0 ? (
        <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-slate-300 rounded-3xl hover:border-brand-500 hover:bg-brand-50 transition-all cursor-pointer group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <p className="mb-2 text-lg font-medium text-slate-700">Choose {isMultiFile ? 'Files' : 'File'}</p>
            <p className="text-sm text-slate-500">or drop {toolId === 'word-to-pdf' ? 'DOCX' : 'PDF'} here</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept={acceptedTypes} 
            multiple={isMultiFile}
            onChange={onFileChange} 
          />
        </label>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {files.map((file, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <FileText size={18} className="text-brand-500" />
                <span className="flex-1 text-sm font-medium text-slate-900 truncate">{file.name}</span>
                <span className="text-[10px] text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            ))}
          </div>

          {/* Tool specific options */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 gap-4">
            {toolId === 'compress' && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Compression Level</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'low' as const, label: 'Low Compression', desc: 'Slight reduction, high fidelity' },
                    { id: 'medium' as const, label: 'Recommended', desc: 'Best balance of size vs quality' },
                    { id: 'high' as const, label: 'Extreme (Lossy)', desc: 'Smallest size, flattens PDF' }
                  ].map(level => (
                    <button 
                      key={level.id}
                      onClick={() => setOptions({ ...options, compressionLevel: level.id })}
                      className={cn(
                        "w-full p-4 rounded-xl text-left transition-all border flex items-center justify-between",
                        options.compressionLevel === level.id 
                          ? "bg-brand-600 border-brand-600 text-white shadow-md ring-2 ring-brand-100" 
                          : "bg-white border-slate-200 text-slate-600 hover:border-brand-300"
                      )}
                    >
                      <div>
                        <div className="text-sm font-bold">{level.label}</div>
                        <div className={cn("text-[10px] opacity-80", options.compressionLevel === level.id ? "text-white" : "text-slate-400")}>{level.desc}</div>
                      </div>
                      {options.compressionLevel === level.id && (
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                          <Download size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {options.compressionLevel === 'high' && (
                  <div className="p-3 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 text-[10px] flex gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Extreme compression flattens the PDF into images. This results in the smallest file size but text will no longer be selectable.</span>
                  </div>
                )}
              </div>
            )}

            {toolId === 'rotate' && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Rotation Angle</label>
                <div className="flex gap-2">
                  {[90, 180, 270].map(deg => (
                    <button 
                      key={deg}
                      onClick={() => setOptions({ ...options, rotation: deg })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                        options.rotation === deg ? "bg-brand-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
                      )}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {toolId === 'editor' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Controls */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Edits & Overlays</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => addAnnotation('text')}
                          className="p-1 px-2 bg-brand-600 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 hover:bg-brand-700 transition-colors shadow-sm"
                        >
                          <Plus size={10} /> Text
                        </button>
                        <button 
                          onClick={() => addAnnotation('image')}
                          className="p-1 px-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <Plus size={10} /> Image
                        </button>
                        <button 
                          onClick={() => addAnnotation('rect')}
                          className="p-1 px-2 bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 hover:bg-slate-900 transition-colors shadow-sm"
                        >
                          <Plus size={10} /> White-out
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {options.annotations.length === 0 ? (
                        <div className="text-center py-12 bg-slate-100/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[11px] flex flex-col items-center gap-2">
                          < PenTool size={24} className="opacity-20" />
                          <span>No edits added yet.<br/>Use buttons above to add text, images, or boxes.</span>
                        </div>
                      ) : (
                        options.annotations.map((ann, idx) => (
                          <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-sm hover:border-brand-200 transition-colors relative group">
                            <div className="flex gap-2">
                               {ann.type === 'text' && (
                                 <div className="flex-1 space-y-1">
                                  <input 
                                    value={ann.text}
                                    onChange={(e) => updateAnnotation(idx, { text: e.target.value })}
                                    className="w-full text-sm font-bold text-slate-800 border-none p-0 focus:ring-0 placeholder:text-slate-300"
                                    placeholder="Enter text..."
                                  />
                                </div>
                               )}
                               {ann.type === 'image' && (
                                 <div className="flex-1 space-y-2">
                                   <div 
                                    onClick={() => document.getElementById(`ann-img-${idx}`)?.click()}
                                    className="w-full h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                                   >
                                     {ann.image ? (
                                       <img src={ann.image} className="h-full object-contain p-1" alt="Embed" />
                                     ) : (
                                       <div className="flex flex-col items-center gap-1">
                                          <ImageIcon size={16} className="text-slate-300" />
                                          <span className="text-[9px] font-bold text-slate-400 uppercase">Upload Image</span>
                                       </div>
                                     )}
                                   </div>
                                   <input 
                                    id={`ann-img-${idx}`}
                                    type="file" 
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => updateAnnotation(idx, { image: ev.target?.result as string });
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                 </div>
                               )}
                               {ann.type === 'rect' && (
                                 <div className="flex-1 flex items-center gap-2">
                                   <Square size={14} className="text-slate-400" />
                                   <span className="text-[10px] font-bold text-slate-500 uppercase">Shape Overlay / Box</span>
                                 </div>
                               )}
                              <button 
                                onClick={() => removeAnnotation(idx)}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                <Palette size={12} className="text-slate-400" />
                                <input 
                                  type="color"
                                  value={ann.color}
                                  onChange={(e) => updateAnnotation(idx, { color: e.target.value })}
                                  className="w-6 h-6 rounded-md border-none p-0 bg-transparent cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{ann.color}</span>
                              </div>
                              
                              {ann.type === 'text' && (
                                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                  <TypeIcon size={12} className="text-slate-400" />
                                  <select 
                                    value={ann.fontSize}
                                    onChange={(e) => updateAnnotation(idx, { fontSize: parseInt(e.target.value) })}
                                    className="bg-transparent border-none p-0 text-[10px] font-bold text-slate-600 focus:ring-0 w-full"
                                  >
                                    {[8, 10, 12, 14, 16, 18, 20, 24, 32, 48, 64].map(size => (
                                      <option key={size} value={size}>{size}px</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              {(ann.type === 'rect' || ann.type === 'image') && (
                                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                  <Maximize size={12} className="text-slate-400" />
                                  <div className="flex gap-1">
                                    <input 
                                      type="number"
                                      value={ann.width}
                                      onChange={(e) => updateAnnotation(idx, { width: parseInt(e.target.value) })}
                                      className="w-8 bg-transparent border-none p-0 text-[10px] font-bold text-slate-600 focus:ring-0"
                                    />
                                    <span className="text-[10px] text-slate-300">×</span>
                                    <input 
                                      type="number"
                                      value={ann.height}
                                      onChange={(e) => updateAnnotation(idx, { height: parseInt(e.target.value) })}
                                      className="w-8 bg-transparent border-none p-0 text-[10px] font-bold text-slate-600 focus:ring-0"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 bg-slate-50 p-2 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <Move size={12} />
                                <span>X:</span>
                                <input 
                                  type="number"
                                  value={ann.x}
                                  onChange={(e) => updateAnnotation(idx, { x: parseInt(e.target.value) })}
                                  className="w-10 bg-transparent border-none p-0 text-slate-700 focus:ring-0"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Move size={12} className="rotate-90" />
                                <span>Y:</span>
                                <input 
                                  type="number"
                                  value={ann.y}
                                  onChange={(e) => updateAnnotation(idx, { y: parseInt(e.target.value) })}
                                  className="w-10 bg-transparent border-none p-0 text-slate-700 focus:ring-0"
                                />
                              </div>
                              <div className="flex items-center gap-1.5 ml-auto">
                                <span>Page:</span>
                                <input 
                                  type="number"
                                  min="1"
                                  value={ann.pageIndex + 1}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) - 1);
                                    updateAnnotation(idx, { pageIndex: val });
                                    setPreviewPage(val);
                                  }}
                                  className="w-8 bg-transparent border-none p-0 text-slate-700 focus:ring-0 text-center"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Preview */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Visual Guide (Page {previewPage+1})</label>
                    <div className="relative aspect-[1/1.4] bg-slate-200 rounded-2xl overflow-hidden border border-slate-300 shadow-inner group">
                      {pageThumb ? (
                        <div className="w-full h-full relative">
                          <img src={pageThumb} className="w-full h-full object-contain" alt="Page preview" />
                          <div className="absolute inset-0 pointer-events-none">
                            {options.annotations.filter(a => a.pageIndex === previewPage).map((ann, i) => (
                              <div 
                                key={i}
                                className="absolute border border-brand-500 bg-brand-500/20 text-[6px] text-brand-600 flex items-center justify-center font-bold"
                                style={{ 
                                  // Simplified mapping from PDF pts to percentage. 
                                  // Standard A4 is 595x842 pts.
                                  left: `${(ann.x / 595) * 100}%`,
                                  bottom: `${(ann.y / 842) * 100}%`,
                                  width: ann.type === 'text' ? 'auto' : `${((ann.width || 50) / 595) * 100}%`,
                                  height: ann.type === 'text' ? 'auto' : `${((ann.height || 20) / 842) * 100}%`,
                                  minWidth: '4px',
                                  minHeight: '4px',
                                  transform: 'translateY(100%)' // PDF (0,0) is bottom-left, CSS is top-left.
                                }}
                              >
                                {ann.type === 'text' ? ann.text?.slice(0, 5) : ann.type}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-brand-500 rounded-full mb-4" />
                          <p className="text-xs font-bold">Rendering Preview...</p>
                        </div>
                      )}
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur p-1 rounded-lg border border-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                          disabled={previewPage === 0}
                          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-[10px] font-bold px-2">Page {previewPage + 1}</span>
                        <button 
                          onClick={() => setPreviewPage(previewPage + 1)}
                          className="p-1 hover:bg-slate-100 rounded"
                        >
                          <ChevronLeft size={16} className="rotate-180" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                      Coordinates are in points (pt). Page bottom-left is (0,0).<br/>
                      A standard A4 page is approx 595 x 842 pts.
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic bg-brand-50 p-3 rounded-xl border border-brand-100">
                  <span className="font-bold text-brand-600 block mb-1">Editor Notice:</span>
                  Edits are layered on top of the original PDF. Text in rectangles or under images may still be "present" in the data, but obscured visually.
                </p>
              </div>
            )}
            
            {toolId === 'split' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Split Mode</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'split' as const, label: 'Split All', desc: 'Separate PDFs for all pages' },
                      { id: 'extract' as const, label: 'Extract Range', desc: 'One PDF with specific pages' }
                    ].map(mode => (
                      <button 
                        key={mode.id}
                        onClick={() => setOptions({ ...options, splitMode: mode.id })}
                        className={cn(
                          "flex-1 p-3 rounded-xl text-left transition-all border",
                          options.splitMode === mode.id 
                            ? "bg-brand-600 border-brand-600 text-white shadow-md ring-2 ring-brand-100" 
                            : "bg-white border-slate-200 text-slate-600 hover:border-brand-300"
                        )}
                      >
                        <div className="text-sm font-bold">{mode.label}</div>
                        <div className={cn("text-[10px] opacity-80", options.splitMode === mode.id ? "text-white" : "text-slate-400")}>{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Page Range</label>
                    <span className="text-[10px] text-slate-400">e.g. 1, 3-5 or 'all'</span>
                  </div>
                  <input 
                    type="text"
                    value={options.splitRange}
                    onChange={(e) => setOptions({ ...options, splitRange: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="all, 1, 2-5..."
                  />
                </div>
              </div>
            )}

            {toolId === 'watermark' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Watermark Type</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'text', label: 'Text', icon: TypeIcon },
                      { id: 'image', label: 'Image', icon: ImageIcon }
                    ].map(type => (
                      <button 
                        key={type.id}
                        onClick={() => setOptions({ ...options, watermarkType: type.id as any })}
                        className={cn(
                          "flex-1 p-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 border transition-all",
                          options.watermarkType === type.id 
                            ? "bg-brand-50 border-brand-200 text-brand-700 ring-1 ring-brand-200" 
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        )}
                      >
                        <type.icon size={14} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {options.watermarkType === 'text' ? (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Watermark Text</label>
                    <input 
                      type="text"
                      value={options.watermark}
                      onChange={(e) => setOptions({ ...options, watermark: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Enter text..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Watermark Image</label>
                    <div 
                      onClick={() => document.getElementById('watermark-img-upload')?.click()}
                      className="w-full p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-brand-400 transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      {options.watermarkImage ? (
                        <img src={options.watermarkImage} className="h-12 object-contain" alt="Watermark preview" />
                      ) : (
                        <>
                          <ImageIcon className="text-slate-300" size={24} />
                          <span className="text-[10px] text-slate-400">Click to upload image</span>
                        </>
                      )}
                    </div>
                    <input 
                      id="watermark-img-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setOptions({ ...options, watermarkImage: ev.target?.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Opacity ({Math.round(options.watermarkOpacity * 100)}%)</label>
                    <input 
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={options.watermarkOpacity}
                      onChange={(e) => setOptions({ ...options, watermarkOpacity: parseFloat(e.target.value) })}
                      className="w-full accent-brand-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Position</label>
                    <select 
                      value={options.watermarkPosition}
                      onChange={(e) => setOptions({ ...options, watermarkPosition: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="custom">Custom (X/Y)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider text-left">Rotation ({options.watermarkRotation}°)</label>
                    <input 
                      type="range"
                      min="-180"
                      max="180"
                      step="5"
                      value={options.watermarkRotation}
                      onChange={(e) => setOptions({ ...options, watermarkRotation: parseInt(e.target.value) })}
                      className="w-full accent-brand-600"
                    />
                  </div>
                  {options.watermarkType === 'image' && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider text-left">Scale ({Math.round(options.watermarkScale * 100)}%)</label>
                      <input 
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.05"
                        value={options.watermarkScale}
                        onChange={(e) => setOptions({ ...options, watermarkScale: parseFloat(e.target.value) })}
                        className="w-full accent-brand-600"
                      />
                    </div>
                  )}
                </div>

                {options.watermarkPosition === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider text-left">X Coordinate (pt)</label>
                      <input 
                        type="number"
                        value={options.watermarkX}
                        onChange={(e) => setOptions({ ...options, watermarkX: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider text-left">Y Coordinate (pt)</label>
                      <input 
                        type="number"
                        value={options.watermarkY}
                        onChange={(e) => setOptions({ ...options, watermarkY: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {toolId === 'sign' && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Your Signature Name</label>
                <input 
                  type="text"
                  value={options.signature}
                  onChange={(e) => setOptions({ ...options, signature: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. John Doe"
                />
              </div>
            )}

            {toolId === 'unlock' && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">PDF Password (if any)</label>
                <input 
                  type="password"
                  value={options.password}
                  onChange={(e) => setOptions({ ...options, password: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Enter original password"
                />
              </div>
            )}

            {toolId === 'lock' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Set New PDF Password</label>
                  <input 
                    type="password"
                    value={options.newPassword}
                    onChange={(e) => setOptions({ ...options, newPassword: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Enter secure password"
                  />
                </div>
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-[10px]">
                  <p className="font-bold mb-1 italic flex items-center gap-1">
                    <AlertCircle size={12} /> Note on Security:
                  </p>
                  <p>To ensure robust client-side encryption, the PDF will be protected as a set of high-resolution images. Original text selection may be limited, but your content will be securely locked.</p>
                </div>
              </div>
            )}

            {toolId === 'remove-watermark' && (
              <div className="space-y-4">
                <div className="p-4 bg-sky-50 text-sky-700 rounded-xl border border-sky-100 text-xs">
                  <p className="font-bold mb-1">How it works:</p>
                  <p>We analyze the document structure and attempt to identify and remove common watermark patterns, transparent layers, and low-opacity stamps.</p>
                </div>
                
                <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-brand-300 transition-all">
                  <input 
                    type="checkbox"
                    checked={options.removeWatermarkDeep}
                    onChange={(e) => setOptions({...options, removeWatermarkDeep: e.target.checked})}
                    className="w-5 h-5 accent-brand-600 rounded"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-700 block">Deep Clean (Aggressive)</span>
                    <span className="text-[10px] text-slate-400">Try this if standard removal fails. Note: Flattens the PDF.</span>
                  </div>
                </label>
              </div>
            )}
          </div>

          <AnimatePresence>
            {!result || (result.startsWith('Error')) ? (
              <div className="space-y-4">
                {result && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle size={14} /> {result}
                  </div>
                )}
                <button
                  disabled={processing}
                  onClick={processFile}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                    "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                  )}
                >
                  {processing ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
                  ) : (
                    <>Process & Download <Download size={20} /></>
                  )}
                </button>
                <button onClick={() => setFiles([])} className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl flex flex-col items-center gap-3 border border-emerald-100 text-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                    <Download size={24} />
                  </div>
                  <span className="font-bold text-lg">Task Complete</span>
                  <p className="text-sm opacity-80">{result}</p>
                </div>
                <button
                  onClick={() => { setFiles([]); setResult(null); }}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Back to Tools
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">Trust & Security</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
            <Lock size={14} className="text-brand-500" />
            <span>Encrypted Connection</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
            <AlertCircle size={14} className="text-brand-500" />
            <span>Deleted after 2 hours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
