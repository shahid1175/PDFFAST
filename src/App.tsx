import React, { useState } from 'react';
import { 
  FileText, 
  Merge, 
  Split, 
  Minimize2, 
  RotateCw, 
  FileImage, 
  Type, 
  Lock, 
  PenTool, 
  Layers, 
  ArrowRightLeft,
  ChevronLeft,
  Upload,
  Download,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Types
type ToolId = 
  | 'compress' | 'merge' | 'pdf-to-word' | 'word-to-pdf' 
  | 'split' | 'pdf-to-jpg' | 'rotate' | 'editor' 
  | 'unlock' | 'sign' | 'watermark';

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

const TOOLS: Tool[] = [
  { id: 'compress', name: 'Compress PDF', description: 'Reduce file size while keeping best quality', traffic: 'popular', difficulty: 'easy', stats: '269M USERS/MO', icon: Minimize2, keywords: ['compress pdf free'], color: 'bg-orange-600', hoverBorder: 'hover:border-orange-400', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { id: 'merge', name: 'Merge PDF', description: 'Combine multiple PDFs into one easily', traffic: 'popular', difficulty: 'easy', stats: '180M USERS/MO', icon: Merge, keywords: ['merge pdf'], color: 'bg-blue-600', hoverBorder: 'hover:border-blue-400', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF files to editable Word docs', traffic: 'popular', difficulty: 'normal', stats: '120M USERS/MO', icon: FileText, keywords: ['pdf to word'], color: 'bg-indigo-600', hoverBorder: 'hover:border-indigo-400', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { id: 'editor', name: 'PDF Editor', description: 'Edit text, add images, and annotate online', traffic: 'popular', stats: '80M USERS/MO', icon: Type, keywords: ['edit pdf'], color: 'bg-purple-600', hoverBorder: 'hover:border-purple-400', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { id: 'word-to-pdf', name: 'Word to PDF', description: 'Make DOC files easy to read by converting', difficulty: 'easy', stats: '95M USERS/MO', icon: ArrowRightLeft, keywords: ['word to pdf'], color: 'bg-emerald-600', hoverBorder: 'hover:border-emerald-400', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { id: 'split', name: 'Split PDF', description: 'Extract one or multiple pages from PDF', difficulty: 'easy', stats: '60M USERS/MO', icon: Split, keywords: ['split pdf'], color: 'bg-cyan-600', hoverBorder: 'hover:border-cyan-400', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { id: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Convert each PDF page into an image', difficulty: 'easy', stats: '55M USERS/MO', icon: FileImage, keywords: ['pdf to jpg'], color: 'bg-pink-600', hoverBorder: 'hover:border-pink-400', iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { id: 'unlock', name: 'Unlock PDF', description: 'Remove passwords from protected files', traffic: 'niche', stats: '25M USERS/MO', icon: Lock, keywords: ['remove password'], color: 'bg-rose-600', hoverBorder: 'hover:border-rose-400', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  { id: 'sign', name: 'Sign PDF', description: 'Add your e-signature or request signatures', traffic: 'rising', stats: '40M USERS/MO', icon: PenTool, keywords: ['sign pdf'], color: 'bg-amber-600', hoverBorder: 'hover:border-amber-400', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { id: 'rotate', name: 'Rotate PDF', description: 'Fix orientation of PDF pages easily', difficulty: 'easy', stats: '30M USERS/MO', icon: RotateCw, keywords: ['rotate pdf'], color: 'bg-slate-600', hoverBorder: 'hover:border-slate-400', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  { id: 'watermark', name: 'Watermark', description: 'Stamp image or text over your PDF', stats: '15M USERS/MO', icon: Layers, keywords: ['watermark'], color: 'bg-red-600', hoverBorder: 'hover:border-red-400', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
];

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  const selectedTool = TOOLS.find(t => t.id === activeTool);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-indigo-100 px-8 py-4 flex items-center justify-between shadow-sm">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => setActiveTool(null)}
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl italic group-hover:scale-105 transition-transform">
            P
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">PDF<span className="text-indigo-600 italic">FAST</span></span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Products</a>
          <a href="#" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Solutions</a>
          <a href="#" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
          <button className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
            Get Started Free
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-32 pb-12">
        <AnimatePresence mode="wait">
          {!activeTool ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-8"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">
                  The World's Favorite PDF Tool
                </h1>
                <p className="text-slate-500 font-medium text-lg">
                  Quick, secure, and completely online. Join over 800 million users monthly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {TOOLS.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => setActiveTool(tool.id)} />
                ))}
                
                {/* Promotional Card */}
                <div className="bg-indigo-600 p-5 rounded-2xl shadow-sm flex flex-col justify-between text-white transition-transform hover:-translate-y-1">
                  <div>
                    <h3 className="font-bold text-xl mb-1">Pro Version</h3>
                    <p className="text-xs text-indigo-100 leading-relaxed">Batch processing, OCR, and no file limits.</p>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center gap-2 text-[10px] font-bold">
                        <Download size={14} className="text-indigo-300" />
                        UNLIMITED FILES
                      </li>
                      <li className="flex items-center gap-2 text-[10px] font-bold">
                        <Lock size={14} className="text-indigo-300" />
                        256-BIT ENCRYPTION
                      </li>
                    </ul>
                  </div>
                  <button className="w-full py-2 bg-white text-indigo-600 rounded-lg text-sm font-black mt-4 uppercase hover:bg-indigo-50 transition-colors">Go Premium</button>
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
                className="flex items-center gap-2 text-slate-500 hover:text-brand-600 transition-colors mb-6 group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to all tools
              </button>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                <div className={cn("px-8 py-6 flex items-center justify-between text-white", selectedTool?.color)}>
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      {selectedTool?.icon && <selectedTool.icon size={28} />}
                      {selectedTool?.name}
                    </h2>
                    <p className="opacity-90">{selectedTool?.description}</p>
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
      <footer className="px-8 py-4 bg-white border-t border-indigo-100 flex items-center justify-between">
        <div className="flex gap-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Traffic: 850M+ Monthly</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trusted by 10k+ Teams</span>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-5 h-5 bg-slate-100 rounded"></div>
          ))}
        </div>
      </footer>
    </div>
  );
}

function ToolCard({ tool, onClick }: { tool: Tool, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn("tool-card group", tool.hoverBorder)}
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
            {tool.difficulty === 'easy' && (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                ⚡ Easy
              </span>
            )}
            {tool.traffic === 'rising' && (
              <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                ↑ Rising
              </span>
            )}
            {tool.traffic === 'niche' && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase flex items-center gap-1">
                🎯 Niche
              </span>
            )}
            {tool.id === 'editor' && (
              <span className="px-2 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded uppercase flex items-center gap-1">
                ✦ AI Beta
              </span>
            )}
          </div>
        </div>
        
        <h3 className="font-bold text-slate-800 text-lg">{tool.name}</h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </div>

      <div className="text-[11px] font-bold text-slate-400 mt-4 uppercase tracking-tight">
        {tool.stats || 'FAVORITE TOOL'}
      </div>
    </motion.button>
  );
}

import { PDFService } from './services/pdfService';
import { downloadBlob } from './lib/utils';

import { GoogleGenAI } from '@google/genai';

function Workspace({ toolId }: { toolId: ToolId }) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [options, setOptions] = useState({
    rotation: 90,
    watermark: 'DocuFlow',
    password: '',
    signature: 'Digitally Signed',
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const summarizeDocument = async () => {
    if (files.length === 0) return;
    setLoadingAi(true);
    try {
      const text = await PDFService.extractText(files[0]);
      const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `Summarize the following document content in 3 key bullet points:\n\n${text.substring(0, 5000)}`;
      const result = await model.generateContent(prompt);
      setAiSummary(result.response.text());
    } catch (error) {
      console.error(error);
      setAiSummary("Could not generate summary using AI at this time.");
    } finally {
      setLoadingAi(false);
    }
  };

  const processFile = async () => {
    if (files.length === 0) return;
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
          output = await PDFService.addWatermark(files[0], options.watermark);
          break;
        case 'compress':
          output = await PDFService.compressPDF(files[0]);
          break;
        case 'split':
          output = await PDFService.splitPDF(files[0]);
          output = output[0];
          fileName = `docuflow-page-1.pdf`;
          break;
        case 'pdf-to-jpg':
          const images = await PDFService.pdfToJpg(files[0]);
          const link = document.createElement('a');
          link.href = images[0];
          link.download = 'docuflow-page-1.jpg';
          link.click();
          setResult(`Converted ${images.length} pages to JPG! Downloaded page 1.`);
          return;
        case 'sign':
          output = await PDFService.signPDF(files[0], options.signature);
          break;
        case 'pdf-to-word':
          const text = await PDFService.extractText(files[0]);
          const textBlob = new Blob([text], { type: 'text/plain' });
          const textUrl = URL.createObjectURL(textBlob);
          const textLink = document.createElement('a');
          textLink.href = textUrl;
          textLink.download = 'docuflow-extracted-text.txt';
          textLink.click();
          setResult("Extracted text successfully! Downloaded as .txt.");
          return;
        case 'unlock':
          output = await PDFService.removePassword(files[0], options.password);
          break;
        default:
          throw new Error('This tool is currently in maintenance or coming soon!');
      }

      const blob = new Blob([output], { type: 'application/pdf' });
      downloadBlob(blob, fileName);
      setResult("Successfully processed! Your download should have started.");
    } catch (error: any) {
      console.error(error);
      setResult(`Error: ${error.message || 'Something went wrong.'}`);
    } finally {
      setProcessing(false);
    }
  };

  const isMultiFile = toolId === 'merge';

  return (
    <div className="w-full max-w-lg mx-auto">
      {files.length === 0 ? (
        <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-slate-300 rounded-3xl hover:border-brand-500 hover:bg-brand-50 transition-all cursor-pointer group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <p className="mb-2 text-lg font-medium text-slate-700">Choose {isMultiFile ? 'Files' : 'File'}</p>
            <p className="text-sm text-slate-500">or drop PDF here</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf" 
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
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase block tracking-wider">AI Document Intelligence</label>
                {!aiSummary ? (
                  <button 
                    onClick={summarizeDocument}
                    disabled={loadingAi}
                    className="w-full py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-200 transition-colors"
                  >
                    {loadingAi ? 'Analyzing...' : 'Summarize with AI'}
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-emerald-800 animate-in fade-in slide-in-from-top-1">
                    <p className="font-bold mb-2 flex items-center gap-2">
                       <Type size={14} /> AI Summary:
                    </p>
                    <div className="whitespace-pre-wrap">{aiSummary}</div>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 italic">Full editing tools are coming soon. Use AI to understand your document instantly.</p>
              </div>
            )}
            
            {toolId === 'watermark' && (
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
            <span>Files auto-deleted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
