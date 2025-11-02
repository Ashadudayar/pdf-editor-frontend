'use client';

import { useState } from 'react';
import { Upload, Download, Trash2, FileText, ArrowUp, ArrowDown, Combine } from 'lucide-react';

// VERSION 3.1 - MERGE PDFs TOOL
const VERSION = '3.1';
const API_URL = 'https://positive-creativity-production.up.railway.app/api';

// Google Analytics tracking
const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
};

interface UploadedFile {
  file: File;
  id: string;
  documentId?: string;
  uploading: boolean;
  uploaded: boolean;
}

export default function MergePage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergedDocId, setMergedDocId] = useState<string>('');
  const [message, setMessage] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;

    // Add files to list
    const newFiles: UploadedFile[] = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      uploading: true,
      uploaded: false,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    setMessage(`Uploading ${selectedFiles.length} file(s)...`);

    // Upload each file
    for (const fileObj of newFiles) {
      await uploadFile(fileObj);
    }

    setMessage(`${selectedFiles.length} file(s) uploaded successfully!`);
    
    // Track upload
    trackEvent('pdf_upload', {
      event_category: 'engagement',
      event_label: 'merge_tool',
      value: selectedFiles.length
    });
  };

  const uploadFile = async (fileObj: UploadedFile) => {
    const formData = new FormData();
    formData.append('file', fileObj.file);

    try {
      const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id
            ? { ...f, documentId: data.id, uploading: false, uploaded: true }
            : f
        )
      );
    } catch (error) {
      console.error('Upload error:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, uploading: false, uploaded: false } : f
        )
      );
      
      trackEvent('exception', {
        description: 'PDF upload failed in merge tool',
        fatal: false,
      });
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setMessage('File removed');
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    const uploadedFiles = files.filter((f) => f.uploaded && f.documentId);

    if (uploadedFiles.length < 2) {
      setMessage('⚠️ Please upload at least 2 PDFs to merge');
      return;
    }

    setMerging(true);
    setMessage('Merging PDFs...');

    try {
      const documentIds = uploadedFiles.map((f) => f.documentId);

      const response = await fetch(`${API_URL}/documents/merge/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: documentIds }),
      });

      if (!response.ok) throw new Error('Merge failed');

      const data = await response.json();
      setMergedDocId(data.document_id);
      setMessage(`✅ Successfully merged ${uploadedFiles.length} PDFs!`);
      
      // Track merge
      trackEvent('tool_used', {
        event_category: 'tools',
        event_label: 'merge_pdfs',
        value: uploadedFiles.length
      });
    } catch (error) {
      setMessage('❌ Merge failed: ' + (error as Error).message);
      
      trackEvent('exception', {
        description: 'PDF merge failed',
        fatal: false,
      });
    } finally {
      setMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedDocId) return;
    
    window.open(`${API_URL}/documents/${mergedDocId}/download/`, '_blank');
    setMessage('📥 Downloading merged PDF...');
    
    // Track download
    trackEvent('pdf_download', {
      event_category: 'engagement',
      event_label: 'merged_pdf',
      value: 1
    });
  };

  const handleReset = () => {
    setFiles([]);
    setMergedDocId('');
    setMessage('');
    
    trackEvent('user_action', {
      event_category: 'interaction',
      event_label: 'reset_merge',
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
              <Combine className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Merge PDFs</h1>
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
            <h2 className="text-white font-semibold mb-3">📋 How to Merge PDFs:</h2>
            <ol className="text-purple-300 space-y-2 text-sm">
              <li>1. Upload 2 or more PDF files</li>
              <li>2. Reorder files if needed (use ↑↓ buttons)</li>
              <li>3. Click "Merge PDFs" to combine them</li>
              <li>4. Download your merged PDF</li>
            </ol>
          </div>

          {/* Status Message */}
          {message && (
            <div className="mb-6 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
              <p className="text-white text-center">{message}</p>
            </div>
          )}

          {/* Upload Area */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border-2 border-dashed border-purple-400/50 hover:border-purple-400 transition-all mb-8">
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={merging}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-20 h-20 text-purple-400 mx-auto mb-4" />
              <p className="text-white text-xl text-center font-semibold mb-2">
                Upload PDFs to Merge
              </p>
              <p className="text-purple-300 text-center text-sm">
                Select multiple files (2 or more)
              </p>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">
                Uploaded Files ({files.length})
              </h3>
              <div className="space-y-3">
                {files.map((fileObj, index) => (
                  <div
                    key={fileObj.id}
                    className="flex items-center gap-3 bg-white/5 p-4 rounded-lg"
                  >
                    <div className="text-white font-bold text-lg w-8">
                      {index + 1}
                    </div>
                    <FileText className="w-6 h-6 text-purple-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {fileObj.file.name}
                      </p>
                      <p className="text-purple-300 text-sm">
                        {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                        {fileObj.uploading && ' - Uploading...'}
                        {fileObj.uploaded && ' - ✓ Ready'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0 || merging}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        <ArrowUp className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === files.length - 1 || merging}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        <ArrowDown className="w-4 h-4 text-blue-400" />
                      </button>
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        disabled={merging}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {files.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleMerge}
                disabled={
                  merging ||
                  files.filter((f) => f.uploaded).length < 2
                }
                className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-4 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:hover:scale-100"
              >
                <Combine className="w-5 h-5" />
                {merging ? 'Merging...' : 'Merge PDFs'}
              </button>

              {mergedDocId && (
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl font-semibold transition-all transform hover:scale-105"
                >
                  <Download className="w-5 h-5" />
                  Download Merged PDF
                </button>
              )}

              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white p-4 rounded-xl font-semibold transition-all transform hover:scale-105"
              >
                <Trash2 className="w-5 h-5" />
                Start Over
              </button>
            </div>
          )}

          {/* Loading */}
          {merging && (
            <div className="mt-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
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