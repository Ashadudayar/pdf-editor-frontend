'use client';

import { useState } from 'react';
import { Upload, Download, Scissors, Home, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SplitMode = 'range' | 'extract' | 'individual';

export default function PDFSplit() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<SplitMode>('range');
  
  // Range mode
  const [rangeStart, setRangeStart] = useState<string>('1');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  
  // Extract mode
  const [extractPages, setExtractPages] = useState<string>('');
  
  // Split results
  const [splitFiles, setSplitFiles] = useState<Array<{name: string; url: string}>>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      console.log('📤 Uploading PDF...');
      
      const response = await fetch('http://localhost:8000/api/documents/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setDocumentId(data.id);
      
      const pdfUrl = `http://localhost:8000${data.original_file}`;
      setFileUrl(pdfUrl);
      
      // Get page count
      const countResponse = await fetch(`http://localhost:8000/api/documents/${data.id}/page_count/`);
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setNumPages(countData.page_count);
        setRangeEnd(countData.page_count.toString());
      }
      
      alert('✅ PDF uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleSplit = async () => {
    if (!documentId) {
      alert('Please upload a PDF first');
      return;
    }

    setLoading(true);
    setSplitFiles([]);

    try {
      let endpoint = '';
      let body: any = {};

      if (splitMode === 'range') {
        const start = parseInt(rangeStart);
        const end = parseInt(rangeEnd);
        
        if (isNaN(start) || isNaN(end) || start < 1 || end > numPages || start > end) {
          alert('Invalid page range');
          setLoading(false);
          return;
        }
        
        endpoint = `http://localhost:8000/api/documents/${documentId}/split_range/`;
        body = { start_page: start, end_page: end };
      } else if (splitMode === 'extract') {
        const pages = extractPages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p >= 1 && p <= numPages);
        
        if (pages.length === 0) {
          alert('Please enter valid page numbers');
          setLoading(false);
          return;
        }
        
        endpoint = `http://localhost:8000/api/documents/${documentId}/extract_pages/`;
        body = { pages: pages };
      } else if (splitMode === 'individual') {
        endpoint = `http://localhost:8000/api/documents/${documentId}/split_all/`;
        body = {};
      }

      console.log(`🔄 Splitting PDF (${splitMode} mode)...`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Split failed');
      }

      const data = await response.json();
      
      // Handle response based on mode
      if (data.files) {
        // Multiple files
        const files = data.files.map((filePath: string, index: number) => ({
          name: `page_${index + 1}.pdf`,
          url: `http://localhost:8000${filePath}`
        }));
        setSplitFiles(files);
      } else if (data.split_file) {
        // Single file
        setSplitFiles([{
          name: `pages_${rangeStart}-${rangeEnd}.pdf`,
          url: `http://localhost:8000${data.split_file}`
        }]);
      } else if (data.extracted_file) {
        // Extracted pages
        setSplitFiles([{
          name: `extracted_pages.pdf`,
          url: `http://localhost:8000${data.extracted_file}`
        }]);
      }
      
      alert('✅ PDF split successfully!');
    } catch (error) {
      console.error('Split error:', error);
      alert('Failed to split PDF: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = () => {
    splitFiles.forEach((file, index) => {
      setTimeout(() => {
        window.open(file.url, '_blank');
      }, index * 500);
    });
  };

  const handleReset = () => {
    setFile(null);
    setFileUrl('');
    setDocumentId('');
    setNumPages(0);
    setSplitFiles([]);
    setRangeStart('1');
    setRangeEnd('');
    setExtractPages('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 rounded-t-2xl p-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Split PDF</h1>
            <p className="text-white/70 mt-2">Divide your PDF into multiple files</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Tools
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: Upload & Preview */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload Area */}
            {!fileUrl ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
                  className="hidden"
                  id="file-upload-split"
                  disabled={loading}
                />
                <label htmlFor="file-upload-split" className="cursor-pointer block">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <Upload className="w-10 h-10 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {loading ? 'Uploading...' : 'Upload PDF to Split'}
                    </h3>
                    <p className="text-white/70 text-center">
                      Click to browse or drag your PDF file here
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <>
                {/* PDF Info */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-green-400" />
                      <div>
                        <p className="text-white font-semibold">{file?.name}</p>
                        <p className="text-white/60 text-sm">{numPages} pages</p>
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-white/70 hover:text-white text-sm"
                    >
                      Change File
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
                  <div className="bg-white rounded-lg overflow-hidden" style={{ height: '500px' }}>
                    <iframe
                      src={fileUrl}
                      className="w-full h-full border-0"
                      title="PDF Preview"
                    />
                  </div>
                </div>

                {/* Split Results */}
                {splitFiles.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Split Files ({splitFiles.length})
                      </h3>
                      {splitFiles.length > 1 && (
                        <button
                          onClick={handleDownloadAll}
                          className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all"
                        >
                          Download All
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {splitFiles.map((file, index) => (
                        <div
                          key={index}
                          className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-green-400" />
                            <span className="text-white">{file.name}</span>
                          </div>
                          <button
                            onClick={() => window.open(file.url, '_blank')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Split Options */}
          <div className="space-y-4">
            {/* Split Mode Selector */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Split Mode</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setSplitMode('range')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    splitMode === 'range'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <p className="text-white font-semibold">Page Range</p>
                  <p className="text-white/60 text-sm">Extract specific page range</p>
                </button>

                <button
                  onClick={() => setSplitMode('extract')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    splitMode === 'extract'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <p className="text-white font-semibold">Extract Pages</p>
                  <p className="text-white/60 text-sm">Select specific pages</p>
                </button>

                <button
                  onClick={() => setSplitMode('individual')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    splitMode === 'individual'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-white/20 bg-white/5 hover:border-white/40'
                  }`}
                >
                  <p className="text-white font-semibold">Split All Pages</p>
                  <p className="text-white/60 text-sm">One file per page</p>
                </button>
              </div>
            </div>

            {/* Options based on mode */}
            {fileUrl && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Options</h3>

                {splitMode === 'range' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-white/80 text-sm mb-2 block">Start Page</label>
                      <input
                        type="number"
                        min="1"
                        max={numPages}
                        value={rangeStart}
                        onChange={(e) => setRangeStart(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-green-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/80 text-sm mb-2 block">End Page</label>
                      <input
                        type="number"
                        min="1"
                        max={numPages}
                        value={rangeEnd}
                        onChange={(e) => setRangeEnd(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-green-400 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {splitMode === 'extract' && (
                  <div>
                    <label className="text-white/80 text-sm mb-2 block">
                      Page Numbers (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 1, 3, 5, 7-10"
                      value={extractPages}
                      onChange={(e) => setExtractPages(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-green-400 focus:outline-none placeholder-white/40"
                    />
                    <p className="text-white/50 text-xs mt-2">
                      Total pages: {numPages}
                    </p>
                  </div>
                )}

                {splitMode === 'individual' && (
                  <div className="text-center py-4">
                    <Scissors className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-white/70 text-sm">
                      This will split the PDF into {numPages} separate files
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSplit}
                  disabled={loading || !documentId}
                  className="w-full mt-6 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Splitting...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-5 h-5" />
                      Split PDF
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}