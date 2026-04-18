import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Search, Loader2, User, Building2, Hash, FileText, Link as LinkIcon, Award, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import Matter from 'matter-js';

function EditorWorkspace() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zenodoUrl, setZenodoUrl] = useState('');
  const [template, setTemplate] = useState('classic');
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const { clientWidth, clientHeight } = previewContainerRef.current;
        const scaleX = (clientWidth - 80) / 1123;
        const scaleY = (clientHeight - 80) / 794;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const [certData, setCertData] = useState({
    title: '',
    date: '',
    doi: '',
    recordId: '',
    name: '',
    enrollment: '',
    affiliation: ''
  });

  const handleFetch = async () => {
    if (!zenodoUrl) return;
    setError('');
    const match = zenodoUrl.match(/records?\/(\d+)/);
    if (!match) {
      setError('Invalid URL. Use format: https://zenodo.org/records/1234567');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch(`https://zenodo.org/api/records/${match[1]}`);
      if (!res.ok) throw new Error('Record not found');
      const data = await res.json();
      
      const pubDate = new Date(data.metadata.publication_date);
      const formattedDate = pubDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      const firstAuthor = data.metadata.creators?.[0]?.name || '';
      const parsedName = firstAuthor.includes(',') 
        ? firstAuthor.split(',').map((s: string) => s.trim()).reverse().join(' ') 
        : firstAuthor;
        
      setCertData(prev => ({
        ...prev,
        title: data.metadata.title,
        date: formattedDate,
        doi: data.doi || `10.5281/zenodo.${match[1]}`,
        recordId: match[1],
        name: parsedName || prev.name,
        affiliation: data.metadata.creators?.[0]?.affiliation || prev.affiliation
      }));
    } catch (err) {
      setError('Failed to fetch record. Please check the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const element = document.getElementById('certificate-node');
    if (!element) return;
    
    setIsDownloading(true);
    
    // Temporarily remove scale for high-res capture
    const originalTransform = element.parentElement?.style.transform;
    if (element.parentElement) {
      element.parentElement.style.transform = 'scale(1)';
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 3, // High resolution for crisp text
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      // Restore scale
      if (element.parentElement && originalTransform) {
        element.parentElement.style.transform = originalTransform;
      }
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
      
      // Calculate exact dimensions to prevent stretching
      const imgRatio = canvas.width / canvas.height;
      const pdfRatio = pdfWidth / pdfHeight;
      
      let renderWidth = pdfWidth;
      let renderHeight = pdfWidth / imgRatio;
      
      if (renderHeight > pdfHeight) {
        renderHeight = pdfHeight;
        renderWidth = pdfHeight * imgRatio;
      }
      
      // Center the image on the PDF page
      const x = (pdfWidth - renderWidth) / 2;
      const y = (pdfHeight - renderHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);
      pdf.save(`Zenodo_Certificate_${certData.recordId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-mono selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b-2 border-white/20 h-16 px-6 flex justify-between items-center sticky top-0 z-20 shrink-0 print:hidden bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tighter">ZENODO_CERT_MAKER</span>
          <span className="text-white/40 text-xs hidden sm:block">SYS.VER.1.0.4</span>
        </div>
        <div className="text-xs flex items-center gap-6 hidden sm:flex font-bold">
          <div className="flex items-center gap-2">
            <span className="text-white/50">USER:</span>
            <span className="text-white">{certData.name ? certData.name.toUpperCase() : 'GUEST'}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-64px)] print:h-auto print:overflow-visible">
        
        {/* Left Panel - Controls */}
        <aside className="w-full lg:w-[450px] border-r-2 border-white/20 flex flex-col z-10 shrink-0 overflow-y-auto print:hidden bg-[#0a0a0a]">
          <div className="p-6 space-y-10">
            
            {/* Section 1: Import */}
            <section>
              <h2 className="text-lg font-bold mb-6 tracking-tight border-b-2 border-white/20 pb-2">:: DATA_IMPORT</h2>
              <div className="space-y-4">
                <label className="block text-xs text-white/60">{'>'} TARGET_URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="https://zenodo.org/records/..." 
                    value={zenodoUrl}
                    onChange={(e) => setZenodoUrl(e.target.value)}
                    className="flex-1 bg-transparent border-2 border-white/20 focus:border-white p-3 text-sm outline-none placeholder:text-white/30 transition-colors"
                  />
                  <button 
                    onClick={handleFetch}
                    disabled={isLoading || !zenodoUrl}
                    className="bg-white text-black px-6 py-3 font-bold hover:bg-transparent hover:text-white border-2 border-white disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'FETCH'}
                  </button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2">! ERROR: {error}</p>}
              </div>
            </section>

            {/* Section 1.5: Template */}
            <section>
              <h2 className="text-lg font-bold mb-6 tracking-tight border-b-2 border-white/20 pb-2">:: TEMPLATE</h2>
              <div className="flex gap-2">
                {['classic', 'modern', 'minimal'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`flex-1 py-3 text-xs font-bold border-2 transition-colors ${template === t ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:border-white/60'}`}
                  >
                    [ {t.toUpperCase()} ]
                  </button>
                ))}
              </div>
            </section>

            {/* Section 2: Details */}
            <section>
              <div className="flex items-center justify-between mb-6 border-b-2 border-white/20 pb-2">
                <h2 className="text-lg font-bold tracking-tight">:: PARAMETERS</h2>
                <span className="text-[10px] bg-white text-black px-2 py-0.5 font-bold">R/W</span>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-white/60 mb-2">{'>'} AUTHOR_NAME</label>
                  <input type="text" value={certData.name} onChange={(e) => setCertData({...certData, name: e.target.value})} className="w-full bg-transparent border-2 border-white/20 focus:border-white p-3 text-sm outline-none transition-colors" />
                </div>
                
                <div>
                  <label className="block text-xs text-white/60 mb-2">{'>'} ENROLLMENT_ID</label>
                  <input type="text" value={certData.enrollment} onChange={(e) => setCertData({...certData, enrollment: e.target.value})} className="w-full bg-transparent border-2 border-white/20 focus:border-white p-3 text-sm outline-none transition-colors" />
                </div>
                
                <div>
                  <label className="block text-xs text-white/60 mb-2">{'>'} AFFILIATION</label>
                  <input type="text" value={certData.affiliation} onChange={(e) => setCertData({...certData, affiliation: e.target.value})} className="w-full bg-transparent border-2 border-white/20 focus:border-white p-3 text-sm outline-none transition-colors" />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-2">{'>'} DATE_OF_ISSUANCE</label>
                  <input type="text" value={certData.date} onChange={(e) => setCertData({...certData, date: e.target.value})} className="w-full bg-transparent border-2 border-white/20 focus:border-white p-3 text-sm outline-none transition-colors" />
                </div>
                
                <div>
                  <label className="block text-xs text-white/60 mb-2">{'>'} PAPER_TITLE</label>
                  <textarea value={certData.title} onChange={(e) => setCertData({...certData, title: e.target.value})} className="w-full bg-transparent border-2 border-white/20 focus:border-white p-3 text-sm outline-none transition-colors min-h-[100px] resize-y leading-relaxed" />
                </div>
              </div>
            </section>
          </div>
        </aside>

        {/* Right Panel - Preview Area */}
        <section className="flex-1 flex flex-col relative bg-[#111] overflow-hidden print:bg-white print:overflow-visible">
          
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

          {/* Toolbar */}
          <div className="h-16 border-b-2 border-white/20 px-6 flex justify-between items-center sticky top-0 z-10 shrink-0 print:hidden bg-[#0a0a0a]/90 backdrop-blur-sm">
             <div className="flex items-center gap-3 text-xs font-bold text-white/70">
               <div className="w-2 h-2 bg-green-500 animate-pulse"></div>
               OUTPUT_PREVIEW
             </div>
             <div className="flex gap-4">
               <button 
                 onClick={handlePrint} 
                 className="px-4 py-2 border-2 border-white/20 hover:border-white bg-transparent text-white text-xs font-bold transition-colors"
               >
                 [ PRINT ]
               </button>
               <button 
                 onClick={handleDownload} 
                 disabled={isDownloading}
                 className="px-4 py-2 border-2 border-white bg-white text-black hover:bg-transparent hover:text-white text-xs font-bold transition-colors disabled:opacity-50"
               >
                 {isDownloading ? 'PROCESSING...' : '[ EXPORT_PDF ]'}
               </button>
             </div>
          </div>

          {/* Canvas Area */}
          <div ref={previewContainerRef} className="flex-1 overflow-hidden flex justify-center items-center print:p-0 print:overflow-visible relative z-0">
            
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'center', transition: 'transform 0.2s ease-out' }} className="print:!transform-none">
              {/* Certificate Container - Fixed A4 Pixel Dimensions (1123x794) */}
              <div 
                id="certificate-node"
                className="certificate-print-wrapper bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative flex flex-col shrink-0 box-border print:shadow-none print:outline-none overflow-hidden"
                style={{ width: '1123px', height: '794px' }}
              >
                {template === 'classic' && (
                  <div className="w-full h-full p-10 border-[16px] border-white outline outline-1 outline-slate-200 flex flex-col items-center text-center relative">
                    {/* Inner Border */}
                    <div className="absolute inset-[8px] border-2 border-[#007cb2] pointer-events-none print:inset-[8px]"></div>
                    
                    {/* Enrollment Tag */}
                    <div className="absolute top-8 right-8 text-[11px] text-[#aaa] font-mono">REF: {certData.recordId ? `ZN-${certData.recordId}` : 'ZN-XXXXXXX'}</div>

                    {/* Header */}
                    <div className="mb-4 mt-4">
                      <div className="uppercase tracking-[4px] text-[11px] text-[#888] mb-2">Official Certification of Record</div>
                      <h1 className="font-serif text-[40px] text-[#2c3e50] font-normal">Certificate of Publication</h1>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full">
                      <p className="text-[16px] text-[#888] italic font-serif mb-3">This is to certify that</p>
                      
                      <h2 className="font-serif text-[48px] text-[#007cb2] my-2 border-b border-[#eee] px-16 pb-2 inline-block">
                        {certData.name || 'Author Name'}
                      </h2>
                      
                      <div className="text-[15px] text-[#666] mb-5 flex flex-col items-center gap-1">
                        {certData.enrollment && <span>Enrollment Number: {certData.enrollment}</span>}
                        {certData.affiliation && <span>{certData.affiliation}</span>}
                      </div>

                      <p className="text-[16px] text-[#555] leading-[1.6] max-w-[700px] mt-2">
                        has successfully published the paper entitled:<br/>
                        <span className="font-bold italic text-[#333] block my-3 text-[20px] leading-snug">
                          "{certData.title}"
                        </span>
                        This research has been permanently archived and made publicly accessible on Zenodo, contributing to the open science community.
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="w-full flex justify-between items-end mt-4">
                      <div className="text-left flex gap-4 items-end">
                        <div className="mix-blend-multiply opacity-90">
                          <QRCodeSVG 
                            value={certData.doi ? `https://doi.org/${certData.doi}` : 'https://zenodo.org'} 
                            size={72}
                            level="M"
                            includeMargin={false}
                            fgColor="#2c3e50"
                            bgColor="transparent"
                          />
                        </div>
                        <div className="pb-1">
                          {certData.enrollment && (
                            <>
                              <div className="text-[10px] uppercase text-[#999] mb-[2px]">Enrollment Number</div>
                              <div className="text-[14px] font-semibold text-[#333] mb-2">{certData.enrollment}</div>
                            </>
                          )}
                          
                          <div className="text-[10px] uppercase text-[#999] mb-[2px]">Digital Object Identifier (DOI)</div>
                          <div className="text-[14px] font-semibold text-[#333]">
                            <a href={`https://doi.org/${certData.doi}`} target="_blank" rel="noreferrer" className="text-[#007cb2] no-underline">{certData.doi}</a>
                          </div>
                        </div>
                      </div>

                      {/* Realistic SVG Stamp */}
                      <div className="w-[110px] h-[110px] -rotate-[15deg] opacity-85 text-[#007cb2] flex items-center justify-center relative mix-blend-multiply mb-2">
                        <svg viewBox="0 0 120 120" className="w-full h-full absolute inset-0">
                          {/* Outer thick border */}
                          <circle cx="60" cy="60" r="58" fill="none" stroke="currentColor" strokeWidth="2.5" />
                          {/* Inner thin border */}
                          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="1" />
                          
                          {/* Circular text path */}
                          <path id="stampPath" d="M 60 16 A 44 44 0 1 1 59.99 16" fill="none" />
                          <text fill="currentColor" fontSize="10.5" fontWeight="bold" letterSpacing="1.5">
                            <textPath href="#stampPath" startOffset="0%">
                              VERIFIED DIGITAL ARCHIVE • ZENODO • 
                            </textPath>
                          </text>

                          {/* Center Checkmark */}
                          <circle cx="60" cy="60" r="26" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
                          <path d="M50 60 L57 67 L72 52" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="text-right pb-1">
                        <div className="text-[10px] uppercase text-[#999] mb-[2px]">Date of Issuance</div>
                        <div className="text-[14px] font-semibold text-[#333]">{certData.date}</div>
                        
                        <div className="mt-4 border-t border-[#333] w-[160px] pt-1.5 ml-auto">
                          <div className="text-[10px] uppercase text-[#999]">Repository Registry</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {template === 'modern' && (
                  <div className="w-full h-full bg-[#f8f9fa] flex text-left text-slate-800">
                    {/* Left Accent Bar */}
                    <div className="w-[300px] bg-[#007cb2] text-white p-12 flex flex-col justify-between shrink-0 relative overflow-hidden">
                      <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                      <div className="relative z-10">
                        <div className="w-16 h-16 bg-white text-[#007cb2] rounded-xl flex items-center justify-center text-3xl font-bold mb-8 shadow-lg">Z</div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">ZENODO</h2>
                        <p className="text-white/70 text-sm leading-relaxed">Open Science Infrastructure</p>
                      </div>
                      
                      <div className="space-y-6 relative z-10">
                        <div>
                          <div className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Record ID</div>
                          <div className="font-mono text-sm">{certData.recordId || 'XXXXXXX'}</div>
                        </div>
                        <div>
                          <div className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Date</div>
                          <div className="text-sm">{certData.date}</div>
                        </div>
                        <div className="mt-6">
                          <QRCodeSVG 
                            value={certData.doi ? `https://doi.org/${certData.doi}` : 'https://zenodo.org'} 
                            size={80} 
                            level="M" 
                            includeMargin={false} 
                            fgColor="#ffffff" 
                            bgColor="transparent" 
                            className="opacity-90"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Content */}
                    <div className="flex-1 p-16 flex flex-col justify-center relative">
                      <div className="absolute top-16 right-16 text-[#007cb2] opacity-5">
                        <Award size={160} />
                      </div>
                      
                      <div className="uppercase tracking-[4px] text-[#007cb2] font-bold text-sm mb-4">Certificate of Publication</div>
                      <h1 className="text-5xl font-bold text-slate-900 mb-12 tracking-tight">Official Record</h1>
                      
                      <p className="text-slate-500 text-lg mb-2">Presented to</p>
                      <h2 className="text-4xl font-bold text-slate-800 mb-4">{certData.name || 'Author Name'}</h2>
                      
                      <div className="flex gap-6 text-slate-600 mb-10 text-sm">
                        {certData.enrollment && <div className="flex items-center gap-2"><Hash size={16}/> {certData.enrollment}</div>}
                        {certData.affiliation && <div className="flex items-center gap-2"><Building2 size={16}/> {certData.affiliation}</div>}
                      </div>
                      
                      <p className="text-slate-600 text-lg leading-relaxed max-w-[600px] mb-12">
                        For the successful publication and permanent archiving of the research paper:
                        <br/>
                        <span className="font-bold text-slate-900 block mt-4 text-xl">"{certData.title}"</span>
                      </p>
                      
                      <div className="mt-auto border-t-2 border-slate-200 pt-6 flex justify-between items-center">
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Digital Object Identifier</div>
                          <div className="text-[#007cb2] font-medium">{certData.doi}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-800 font-bold text-lg">Verified Archive</div>
                          <div className="text-slate-400 text-xs">CERN & Zenodo</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {template === 'minimal' && (
                  <div className="w-full h-full bg-white p-16 flex flex-col items-center justify-center text-center text-black relative">
                    <div className="absolute inset-8 border-[1px] border-black pointer-events-none"></div>
                    
                    <div className="w-full flex justify-between items-start mb-16 px-8">
                      <div className="text-left">
                        <div className="font-serif text-2xl font-bold tracking-widest">ZENODO</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] mt-1 text-gray-500">Open Science</div>
                      </div>
                      <div className="text-right font-mono text-xs text-gray-400">
                        NO. {certData.recordId || 'XXXXXXX'}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[800px]">
                      <h1 className="font-serif text-6xl text-black mb-12 tracking-tight">Certificate of Publication</h1>
                      
                      <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-6">This acknowledges that</p>
                      
                      <h2 className="font-serif text-5xl text-black mb-6 border-b border-black pb-4 px-12">
                        {certData.name || 'Author Name'}
                      </h2>
                      
                      <div className="text-sm text-gray-600 mb-12 uppercase tracking-widest">
                        {certData.affiliation} {certData.enrollment && `// ${certData.enrollment}`}
                      </div>

                      <p className="font-serif text-2xl text-black leading-relaxed italic mb-16">
                        "{certData.title}"
                      </p>
                    </div>

                    <div className="w-full flex justify-between items-end border-t border-black pt-8 px-8">
                      <div className="flex items-center gap-6">
                        <QRCodeSVG 
                          value={certData.doi ? `https://doi.org/${certData.doi}` : 'https://zenodo.org'} 
                          size={64} 
                          level="M" 
                          includeMargin={false} 
                          fgColor="#000000" 
                          bgColor="transparent" 
                          className="mix-blend-multiply opacity-90"
                        />
                        <div className="text-left">
                          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">DOI</div>
                          <div className="font-mono text-sm">{certData.doi}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Date</div>
                        <div className="font-serif text-lg">{certData.date}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Hilarious Footer & Branding */}
      <footer className="shrink-0 border-t-2 border-white/20 bg-[#0a0a0a] p-4 text-center text-[10px] sm:text-xs text-white/50 print:hidden font-mono z-20 flex flex-col gap-2">
        <div>[ DISCLAIMER ]: This extremely official-looking portal is absolutely NOT associated with, endorsed by, or known to Zenodo or CERN. I just built this because my college literally demands a certificate for every damn thing I do to prove I didn't just hallucinate my research. Plz don't sue me.</div>
        <div>[ CRAFTED BY ]: <a href="https://rishishah.in" target="_blank" rel="noreferrer" className="text-white hover:underline transition-all">Rishi Shah</a></div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .certificate-print-wrapper {
            width: 297mm !important;
            height: 210mm !important;
            max-width: none !important;
            aspect-ratio: auto !important;
            margin: 0 !important;
            box-shadow: none !important;
            padding: 40px !important;
          }
        }
        
        /* Custom Scrollbar for brutalist theme */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #0a0a0a;
          border-left: 2px solid rgba(255,255,255,0.2);
        }
        ::-webkit-scrollbar-thumb {
          background: white;
        }
        ::-webkit-scrollbar-corner {
          background: #0a0a0a;
        }
      `}} />
    </div>
  );
}

const ScrambleButton = ({ onClick }: { onClick: () => void }) => {
  const [text, setText] = useState('INITIALIZE_WORKSPACE');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  
  const scramble = () => {
    let iteration = 0;
    const target = 'ENTER_WORKSPACE_//';
    const interval = setInterval(() => {
      setText(target.split('').map((letter, index) => {
        if(index < iteration) return target[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(''));
      if(iteration >= target.length) clearInterval(interval);
      iteration += 1 / 2;
    }, 30);
  };

  useEffect(() => {
    scramble();
  }, []);

  return (
    <button 
      onClick={onClick}
      onMouseEnter={scramble}
      className="px-8 py-4 bg-white text-black font-mono font-bold text-xl hover:bg-transparent hover:text-white border-2 border-white transition-colors duration-300"
    >
      {text}
    </button>
  );
};

const PhysicsLanding = ({ onEnter }: { onEnter: () => void }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const [bodiesData, setBodiesData] = useState<{body: Matter.Body, word: string, width: number, height: number}[]>([]);

  useEffect(() => {
    const Engine = Matter.Engine,
          Runner = Matter.Runner,
          MouseConstraint = Matter.MouseConstraint,
          Mouse = Matter.Mouse,
          World = Matter.World,
          Bodies = Matter.Bodies;

    const engine = Engine.create();
    engineRef.current = engine;
    const world = engine.world;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Walls
    const ground = Bodies.rectangle(width / 2, height + 50, width * 2, 100, { isStatic: true });
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height * 2, { isStatic: true });
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height * 2, { isStatic: true });
    const ceiling = Bodies.rectangle(width / 2, -1000, width * 2, 100, { isStatic: true });
    World.add(world, [ground, leftWall, rightWall, ceiling]);

    const words = ['ZENODO', 'CERTIFICATE', 'OPEN', 'SCIENCE', 'VERIFIED', 'RECORD', 'DOI', 'RESEARCH', 'ARCHIVE', 'PUBLICATION', 'DATA', 'CERN', 'PHYSICS', 'ASCII', 'MORPH'];
    
    const newBodies = words.map((word, i) => {
      const x = Math.random() * (width - 200) + 100;
      const y = -200 - (i * 150);
      const bodyWidth = word.length * 20 + 40; // Approximate width
      const bodyHeight = 60;
      const body = Bodies.rectangle(x, y, bodyWidth, bodyHeight, {
        restitution: 0.6,
        friction: 0.1,
        density: 0.001,
      });
      return { body, word, width: bodyWidth, height: bodyHeight };
    });

    World.add(world, newBodies.map(b => b.body));
    setBodiesData(newBodies);

    // Mouse control
    const mouse = Mouse.create(document.body);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    World.add(world, mouseConstraint);

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    let animationFrame: number;
    const update = () => {
      setBodiesData([...newBodies]);
      animationFrame = requestAnimationFrame(update);
    };
    update();

    const handleResize = () => {
      Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + 50 });
      Matter.Body.setPosition(rightWall, { x: window.innerWidth + 50, y: window.innerHeight / 2 });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
      Runner.stop(runner);
      Engine.clear(engine);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 bg-[#0a0a0a] overflow-hidden font-mono text-white selection:bg-white selection:text-black z-50" 
      ref={sceneRef}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Physics Bodies */}
      {bodiesData.map((item, i) => (
        <div
          key={i}
          className="absolute top-0 left-0 text-xl md:text-2xl font-bold uppercase tracking-tighter cursor-grab active:cursor-grabbing border-2 border-white bg-[#0a0a0a] text-white flex items-center justify-center select-none hover:bg-white hover:text-black transition-colors duration-300"
          style={{
            width: item.width,
            height: item.height,
            transform: 'translate(' + (item.body.position.x - item.width / 2) + 'px, ' + (item.body.position.y - item.height / 2) + 'px) rotate(' + item.body.angle + 'rad)',
          }}
        >
          {item.word}
        </div>
      ))}

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 mix-blend-difference">
         <pre className="text-white font-mono text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs leading-[1.1] text-center font-bold mb-12">
{`███████╗███████╗███╗   ██╗██████╗ ██████╗  ██████╗ 
╚══███╔╝██╔════╝████╗  ██║██╔═══██╗██╔══██╗██╔═══██╗
  ███╔╝ █████╗  ██╔██╗ ██║██║   ██║██║  ██║██║   ██║
 ███╔╝  ██╔══╝  ██║╚██╗██║██║   ██║██║  ██║██║   ██║
███████╗███████╗██║ ╚████║╚██████╔╝██████╔╝╚██████╔╝
╚══════╝╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝  ╚═════╝`}
         </pre>
         <div className="pointer-events-auto">
           <ScrambleButton onClick={onEnter} />
         </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [view, setView] = useState<'landing' | 'editor'>('landing');

  return (
    <AnimatePresence mode="wait">
      {view === 'landing' ? (
        <PhysicsLanding key="landing" onEnter={() => setView('editor')} />
      ) : (
        <motion.div 
          key="editor"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="min-h-screen"
        >
          <EditorWorkspace />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
