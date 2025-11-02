'use client';

import { useState } from 'react';
import { Upload, Download, FileText, Scissors, Package } from 'lucide-react';

// VERSION 3.1 - SPLIT PDFs TOOL
const VERSION = '3.1';
const API_URL = 'https://positive-creativity-production.up.railway.app/api';

// Google Analytics tracking
const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
};

interface SplitDocument {
  id: string;
  title: string;
  pages: string;
}

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [message, setMessage] = useState('');
  
  // Split mode: 'all', 'range', 'interval'
  const [splitMode, setSplitMode] = useState<'all' | 'range' | 'interval'>('all');
  const [interval, setInterval] = useState<number>(1);
  const [ranges, setRanges] = useState<string>('1-3, 4-6, 7-10');
  
  const [splitResults, setSplitResults] = useState<SplitDocument[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setUploading(true);
    setMessage('Uploading...');

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setDocumentId(data.id);
      setMessage('✅ PDF uploaded! Choose split options below.');

      // Track upload
      trackEvent('pdf_upload', {
        event_category: 'engagement',
        event_label: 'split_tool',
        value: 1
      });
    } catch (error) {
      setMessage('❌ Upload failed: ' + (error as Error).message);
      
      trackEvent('exception', {
        description: 'PDF upload failed in split tool',
        fatal: false,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSplit = async () => {
    if (!documentId) {
      setMessage('⚠️ Please upload a PDF first');
      return;
    }

    setSplitting(true);
    setMessage('Splitting PDF...');

    try {
      let requestData: any = { mode: splitMode };

      if (splitMode === 'interval') {
        requestData.interval = interval;
      } else if (splitMode === 'range') {
        // Parse ranges like "1-3, 4-6, 7-10" into [[1,3], [4,6], [7,10]]
        const parsedRanges = ranges
          .split(',')
          .map(r => r.trim())
          .filter(r => r)
          .map(r => {
            const [start, end] = r.split('-').map(n => parseInt(n.trim()));
            return [start, end];
          });
        
        if (parsedRanges.length === 0) {
          setMessage('⚠️ Please enter valid ranges (e.g., 1-3, 4-6)');
          setSplitting(false);
          return;
        }
        
        requestData.ranges = parsedRanges;
      }

      const response = await fetch(`${API_URL}/documents/${documentId}/split/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) throw new Error('Split failed');

      const data = await response.json();
      setSplitResults(data.files || []);
      setTotalPages(data.original_pages || 0);
      setMessage(`✅ Successfully split into ${data.count} PDFs!`);

      // Track split
      trackEvent('tool_used', {
        event_category: 'tools',
        event_label: 'split_pdfs',
        value: data.count
      });
    } catch (error) {
      setMessage('❌ Split failed: ' + (error as Error).message);
      
      trackEvent('exception', {
        description: 'PDF split failed',
        fatal: false,
      });
    } finally {
      setSplitting(false);
    }
  };

  const handleDownloadSingle = (docId: string) => {
    window.open(`${API_URL}/documents/${docId}/download/`, '_blank');
    
    trackEvent('pdf_download', {
      event_category: 'engagement',
      event_label: 'split_single',
      value: 1
    });
  };

  const handleDownloadAll = async () => {
    if (splitResults.length === 0) {
      console.log('❌ No split results to download');
      return;
    }

    try {
      const documentIds = splitResults.map(doc => doc.id);
      console.log('🔍 Document IDs to download:', documentIds);
      console.log('📦 API URL:', `${API_URL}/documents/download-multiple/`);

      const response = await fetch(`${API_URL}/documents/download-multiple/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: documentIds }),
    });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      console.log('📦 Blob size:', blob.size, 'bytes');
      console.log('📦 Blob type:', blob.type);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `split_pdfs_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage('📥 Downloaded all PDFs as ZIP!');
      
      trackEvent('pdf_download', {
        event_category: 'engagement',
        event_label: 'split_all_zip',
        value: splitResults.length
      });
    } catch (error) {
      console.error('💥 Download error:', error);
      setMessage('❌ Download failed: ' + (error as Error).message);
    }
  };
  const handleReset = () => {
    setFile(null);
    setDocumentId('');
    setSplitResults([]);
    setMessage('');
    setSplitMode('all');
    setInterval(1);
    setRanges('1-3, 4-6, 7-10');
    
    trackEvent('user_action', {
      event_category: 'interaction',
      event_label: 'reset_split',
      value: 1
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Split PDF</h1>
              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                v{VERSION}
              </span>
            </div>
            <a
              href="/"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Instructions */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-white font-semibold mb-3">📋 How to Split PDF:</h2>
            <ol className="text-purple-300 space-y-2 text-sm">
              <li>1. Upload a PDF file</li>
              <li>2. Choose split mode (all pages, ranges, or interval)</li>
              <li>3. Click "Split PDF" to process</li>
              <li>4. Download individual files or all as ZIP</li>
            </ol>
          </div>

          {/* Status Message */}
          {message && (
            <div className="mb-6 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
              <p className="text-white text-center">{message}</p>
            </div>
          )}

          {/* Upload Area */}
          {!file ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border-2 border-dashed border-purple-400/50 hover:border-purple-400 transition-all mb-8">
              <input
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="w-20 h-20 text-purple-400 mx-auto mb-4" />
                <p className="text-white text-xl text-center font-semibold mb-2">
                  Upload PDF to Split
                </p>
                <p className="text-purple-300 text-center text-sm">
                  Click to select a PDF file
                </p>
              </label>
            </div>
          ) : (
            <>
              {/* File Info */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-purple-400" />
                  <div>
                    <p className="text-white font-semibold text-lg">{file.name}</p>
                    <p className="text-purple-300">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                      {totalPages > 0 && ` • ${totalPages} pages`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Split Options */}
              {!splitResults.length && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
                  <h3 className="text-white font-semibold mb-4">Split Options:</h3>
                  
                  <div className="space-y-4">
                    {/* Mode: All Pages */}
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="splitMode"
                        value="all"
                        checked={splitMode === 'all'}
                        onChange={(e) => setSplitMode(e.target.value as any)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-white font-medium">Split into individual pages</p>
                        <p className="text-purple-300 text-sm">Each page becomes a separate PDF</p>
                      </div>
                    </label>

                    {/* Mode: Ranges */}
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="splitMode"
                        value="range"
                        checked={splitMode === 'range'}
                        onChange={(e) => setSplitMode(e.target.value as any)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">Split by page ranges</p>
                        <p className="text-purple-300 text-sm mb-2">
                          Specify custom ranges (e.g., 1-3, 4-6, 7-10)
                        </p>
                        {splitMode === 'range' && (
                          <input
                            type="text"
                            value={ranges}
                            onChange={(e) => setRanges(e.target.value)}
                            placeholder="1-3, 4-6, 7-10"
                            className="w-full bg-white/10 border border-purple-400/50 rounded-lg px-4 py-2 text-white"
                          />
                        )}
                      </div>
                    </label>

                    {/* Mode: Interval */}
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="splitMode"
                        value="interval"
                        checked={splitMode === 'interval'}
                        onChange={(e) => setSplitMode(e.target.value as any)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">Split every N pages</p>
                        <p className="text-purple-300 text-sm mb-2">
                          Split into chunks of equal size
                        </p>
                        {splitMode === 'interval' && (
                          <input
                            type="number"
                            min="1"
                            value={interval}
                            onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                            className="w-32 bg-white/10 border border-purple-400/50 rounded-lg px-4 py-2 text-white"
                          />
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Split Results */}
              {splitResults.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">
                      Split Results ({splitResults.length} PDFs)
                    </h3>
                    <button
                      onClick={handleDownloadAll}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      Download All as ZIP
                    </button>
                  </div>

                  <div className="space-y-3">
                    {splitResults.map((doc, index) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between bg-white/5 p-4 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-white font-bold text-lg w-8">
                            {index + 1}
                          </div>
                          <FileText className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-white font-medium">{doc.title}</p>
                            <p className="text-purple-300 text-sm">Pages: {doc.pages}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadSingle(doc.id)}
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!splitResults.length ? (
                  <button
                    onClick={handleSplit}
                    disabled={splitting || uploading}
                    className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-4 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:hover:scale-100"
                  >
                    <Scissors className="w-5 h-5" />
                    {splitting ? 'Splitting...' : 'Split PDF'}
                  </button>
                ) : null}

                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white p-4 rounded-xl font-semibold transition-all transform hover:scale-105"
                >
                  <Upload className="w-5 h-5" />
                  Start Over
                </button>
              </div>

              {/* Loading */}
              {(splitting || uploading) && (
                <div className="mt-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-lg mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-purple-300 text-sm">
            🚀 Built with Next.js & Django | v{VERSION} | 📊 Analytics Enabled
          </p>
        </div>
      </footer>
    </div>
  );
}