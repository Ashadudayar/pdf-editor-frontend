'use client';

import { useState } from 'react';
import { Upload, Scissors, Download, ArrowLeft, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';

interface SplitFile {
  id: string;
  title: string;
  download_url: string;
}

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [splitMode, setSplitMode] = useState<'range' | 'extract' | 'all'>('range');
  const [startPage, setStartPage] = useState<string>('1');
  const [endPage, setEndPage] = useState<string>('');
  const [specificPages, setSpecificPages] = useState<string>('');
  const [splitFiles, setSplitFiles] = useState<SplitFile[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setFile(uploadedFile);
    setLoading(true);
    setSplitFiles([]);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch('http://localhost:8000/api/documents/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setDocumentId(data.id);
      setPageCount(data.page_count || 0);
      setEndPage(String(data.page_count || 1));
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Failed to upload PDF: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleSplit = async () => {
    if (!documentId) {
      alert('Please upload a PDF first');
      return;
    }

    // Validation
    if (splitMode === 'range') {
      const start = parseInt(startPage);
      const end = parseInt(endPage);
      if (!start || !end || start < 1 || end < start || end > pageCount) {
        alert('Please enter valid page range');
        return;
      }
    } else if (splitMode === 'extract' && !specificPages.trim()) {
      alert('Please enter page numbers');
      return;
    }

    setLoading(true);
    setSplitFiles([]);

    try {
      const requestData: any = { mode: splitMode };

      if (splitMode === 'range') {
        requestData.start_page = parseInt(startPage);
        requestData.end_page = parseInt(endPage);
      } else if (splitMode === 'extract') {
        requestData.pages = specificPages.trim();
      }

      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/split/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Split failed');
      }

      const data = await response.json();
      console.log('Split response:', data);
      
      setSplitFiles(data.files);
      alert('✅ ' + data.message);
    } catch (error) {
      console.error('Split error:', error);
      alert('❌ Failed to split PDF: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (downloadUrl: string) => {
    window.open(downloadUrl, '_blank');
  };

  const resetForm = () => {
    setFile(null);
    setDocumentId('');
    setPageCount(0);
    setSplitFiles([]);
    setStartPage('1');
    setEndPage('');
    setSpecificPages('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/tools"
              className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Link>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Scissors className="w-10 h-10 text-orange-400" />
              Split PDF
            </h1>
            <p className="text-purple-200 mt-2">
              Extract pages or split PDF into multiple files
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Upload Section */}
            {!file ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer block text-center"
                >
                  <Upload className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                  <p className="text-white text-xl mb-2">
                    Drop PDF here or click to upload
                  </p>
                  <p className="text-purple-300 text-sm">Maximum file size: 50MB</p>
                </label>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-purple-300 text-sm">
                        {pageCount > 0 && `${pageCount} pages • `}
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-purple-300 hover:text-white transition text-sm"
                  >
                    Change File
                  </button>
                </div>
              </div>
            )}

            {/* Split Options */}
            {file && documentId && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Split Mode</h2>

                {/* Mode Selection */}
                <div className="space-y-3 mb-6">
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/20 cursor-pointer hover:bg-white/10 transition">
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'range'}
                      onChange={() => setSplitMode('range')}
                      className="w-4 h-4 mt-1"
                    />
                    <div>
                      <span className="text-white font-medium">Page Range</span>
                      <p className="text-purple-300 text-sm">
                        Extract specific page range
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/20 cursor-pointer hover:bg-white/10 transition">
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'extract'}
                      onChange={() => setSplitMode('extract')}
                      className="w-4 h-4 mt-1"
                    />
                    <div>
                      <span className="text-white font-medium">Extract Pages</span>
                      <p className="text-purple-300 text-sm">
                        Select specific pages
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/20 cursor-pointer hover:bg-white/10 transition">
                    <input
                      type="radio"
                      name="splitMode"
                      checked={splitMode === 'all'}
                      onChange={() => setSplitMode('all')}
                      className="w-4 h-4 mt-1"
                    />
                    <div>
                      <span className="text-white font-medium">Split All Pages</span>
                      <p className="text-purple-300 text-sm">
                        One file per page
                      </p>
                    </div>
                  </label>
                </div>

                {/* Options based on mode */}
                {splitMode === 'range' && (
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Start Page
                        </label>
                        <input
                          type="number"
                          value={startPage}
                          onChange={(e) => setStartPage(e.target.value)}
                          min="1"
                          max={pageCount}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-medium mb-2">
                          End Page
                        </label>
                        <input
                          type="number"
                          value={endPage}
                          onChange={(e) => setEndPage(e.target.value)}
                          min="1"
                          max={pageCount}
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {splitMode === 'extract' && (
                  <div className="mb-6">
                    <label className="block text-white font-medium mb-2">
                      Page Numbers
                    </label>
                    <input
                      type="text"
                      value={specificPages}
                      onChange={(e) => setSpecificPages(e.target.value)}
                      placeholder="e.g., 1,3,5 or 1-5"
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                <button
                  onClick={handleSplit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
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

          {/* Right Column - Results */}
          <div className="space-y-6">
            {splitFiles.length > 0 ? (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Split Successful!
                  </h3>
                  <p className="text-green-200">
                    {splitFiles.length} file(s) ready to download
                  </p>
                </div>

                <div className="space-y-3">
                  {splitFiles.map((splitFile) => (
                    <div
                      key={splitFile.id}
                      className="bg-white/10 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-green-400" />
                        <span className="text-white font-medium">
                          {splitFile.title}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDownload(splitFile.download_url)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={resetForm}
                  className="w-full mt-6 bg-purple-500/30 text-purple-200 px-6 py-2 rounded-lg hover:bg-purple-500/40 transition-all"
                >
                  Split Another PDF
                </button>
              </div>
            ) : file ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
                <div className="text-center text-purple-300">
                  <Scissors className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Split results will appear here</p>
                  <p className="text-sm mt-2">
                    Choose a split mode and click "Split PDF"
                  </p>
                </div>
              </div>
            ) : null}

            {/* Instructions */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                💡 How to Use
              </h3>
              <ul className="space-y-2 text-purple-200 text-sm">
                <li>• Upload your PDF file</li>
                <li>• Choose split mode (range, extract, or all)</li>
                <li>• Enter page numbers if needed</li>
                <li>• Click "Split PDF" to process</li>
                <li>• Download individual files</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}