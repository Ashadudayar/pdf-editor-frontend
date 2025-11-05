'use client';

import { useState } from 'react';
import { Scissors, Upload, Download, Package, FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface SplitDocument {
  id: string;
  title: string;
  pages: string;
}

export default function SplitPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [error, setError] = useState('');
  
  const [splitMode, setSplitMode] = useState<'all' | 'range' | 'interval'>('all');
  const [interval, setInterval] = useState<number>(1);
  const [ranges, setRanges] = useState<string>('1-3, 4-6, 7-10');
  
  const [splitResults, setSplitResults] = useState<SplitDocument[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setDocumentId(data.id);
    } catch (err) {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSplit = async () => {
    if (!documentId) {
      setError('Please upload a PDF first');
      return;
    }

    setSplitting(true);
    setError('');

    try {
      let requestData: any = { mode: splitMode };

      if (splitMode === 'interval') {
        requestData.interval = interval;
      } else if (splitMode === 'range') {
        const parsedRanges = ranges
          .split(',')
          .map(r => r.trim())
          .filter(r => r)
          .map(r => {
            const [start, end] = r.split('-').map(n => parseInt(n.trim()));
            return [start, end];
          });
        
        if (parsedRanges.length === 0) {
          setError('Please enter valid ranges (e.g., 1-3, 4-6)');
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
    } catch (err) {
      setError('Failed to split PDF');
    } finally {
      setSplitting(false);
    }
  };

  const handleDownloadSingle = (docId: string) => {
    window.open(`${API_URL}/documents/${docId}/download/`, '_blank');
  };

  const handleDownloadAll = async () => {
    if (splitResults.length === 0) return;

    try {
      const documentIds = splitResults.map(doc => doc.id);

      const response = await fetch(`${API_URL}/documents/download-multiple/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: documentIds }),
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `split_pdfs_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Download failed');
    }
  };

  const reset = () => {
    setFile(null);
    setDocumentId('');
    setSplitResults([]);
    setError('');
    setSplitMode('all');
    setInterval(1);
    setRanges('1-3, 4-6, 7-10');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Scissors className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Split PDF</h1>
          <p className="text-gray-600">Separate PDF into multiple files</p>
        </div>

        {splitResults.length === 0 ? (
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl p-12 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition"
              >
                <Upload className="w-16 h-16 text-purple-500 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {file ? file.name : 'Upload PDF'}
                </p>
                <p className="text-sm text-gray-500">PDF files only</p>
              </label>
            </div>

            {/* Split Options */}
            {file && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Split Options</h3>
                
                <div className="space-y-4">
                  {/* All Pages */}
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 transition">
                    <input
                      type="radio"
                      name="splitMode"
                      value="all"
                      checked={splitMode === 'all'}
                      onChange={(e) => setSplitMode(e.target.value as any)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Split into individual pages</p>
                      <p className="text-sm text-gray-600">Each page becomes a separate PDF</p>
                    </div>
                  </label>

                  {/* Ranges */}
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 transition">
                    <input
                      type="radio"
                      name="splitMode"
                      value="range"
                      checked={splitMode === 'range'}
                      onChange={(e) => setSplitMode(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Split by page ranges</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Specify custom ranges (e.g., 1-3, 4-6, 7-10)
                      </p>
                      {splitMode === 'range' && (
                        <input
                          type="text"
                          value={ranges}
                          onChange={(e) => setRanges(e.target.value)}
                          placeholder="1-3, 4-6, 7-10"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
                        />
                      )}
                    </div>
                  </label>

                  {/* Interval */}
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-purple-500 transition">
                    <input
                      type="radio"
                      name="splitMode"
                      value="interval"
                      checked={splitMode === 'interval'}
                      onChange={(e) => setSplitMode(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Split every N pages</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Split into chunks of equal size
                      </p>
                      {splitMode === 'interval' && (
                        <input
                          type="number"
                          min="1"
                          value={interval}
                          onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                          className="w-32 border border-gray-300 rounded-lg px-4 py-2"
                        />
                      )}
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleSplit}
                  disabled={splitting || uploading}
                  className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition mt-6"
                >
                  {splitting ? 'Splitting...' : 'Split PDF'}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">PDF Split!</h3>
                <p className="text-gray-600">Created {splitResults.length} separate PDFs</p>
              </div>
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
              >
                <Package className="w-5 h-5" />
                Download All as ZIP
              </button>
            </div>

            {/* Results List */}
            <div className="space-y-3 mb-6">
              {splitResults.map((doc, index) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold">{index + 1}</span>
                    </div>
                    <FileText className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.title}</p>
                      <p className="text-sm text-gray-600">Pages: {doc.pages}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadSingle(doc.id)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button onClick={reset} className="text-purple-600 hover:underline font-medium">
                Split Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}