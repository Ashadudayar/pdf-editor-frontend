'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, Search, Trash2, FileText } from 'lucide-react';

// VERSION 3.1 - WITH GOOGLE ANALYTICS
const VERSION = '3.1';
const API_URL = 'https://positive-creativity-production.up.railway.app/api';

// Google Analytics helper functions
const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
};

export default function EditorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('🔥🔥🔥 EDITOR VERSION ' + VERSION + ' LOADED 🔥🔥🔥');
    console.log('🌐 API URL:', API_URL);
    console.log('🕐 Loaded at:', new Date().toISOString());
    
    // Track page view
    trackEvent('page_view', {
      page_title: 'PDF Editor',
      page_location: window.location.href,
    });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const url = URL.createObjectURL(uploadedFile);
    setFile(uploadedFile);
    setFileUrl(url);
    setLoading(true);
    setMessage('Uploading...');

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      console.log('📤 Uploading to:', API_URL);
      
      const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setDocumentId(data.id);
      setMessage('✅ Uploaded successfully!');

      // Track successful PDF upload
      trackEvent('pdf_upload', {
        event_category: 'engagement',
        event_label: uploadedFile.name,
        file_size: uploadedFile.size,
        file_type: uploadedFile.type,
        value: 1
      });

      console.log('📊 Analytics: PDF upload tracked');
    } catch (error) {
      setMessage('❌ Upload failed: ' + (error as Error).message);
      console.error('Upload error:', error);

      // Track upload error
      trackEvent('exception', {
        description: 'PDF upload failed: ' + (error as Error).message,
        fatal: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFindReplace = async () => {
    if (!documentId) {
      setMessage('⚠️ Please upload a file first');
      return;
    }

    const findText = prompt('Text to find:');
    if (!findText) return;

    const replaceText = prompt('Replace with:');
    if (replaceText === null) return;

    setLoading(true);
    setMessage('Processing...');

    try {
      const response = await fetch(
        `${API_URL}/documents/${documentId}/find_replace/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ find_text: findText, replace_text: replaceText }),
        }
      );

      if (!response.ok) {
        throw new Error('Find & Replace failed');
      }

      setMessage('✅ Text replaced successfully!');

      // Track successful find & replace
      trackEvent('tool_used', {
        event_category: 'tools',
        event_label: 'find_replace',
        value: 1
      });

      console.log('📊 Analytics: Find & Replace tracked');
    } catch (error) {
      setMessage('❌ Failed: ' + (error as Error).message);
      console.error('Find/Replace error:', error);

      // Track error
      trackEvent('exception', {
        description: 'Find & Replace failed: ' + (error as Error).message,
        fatal: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!documentId) {
      setMessage('⚠️ Please upload a file first');
      return;
    }

    window.open(`${API_URL}/documents/${documentId}/download/`, '_blank');
    setMessage('📥 Downloading...');

    // Track PDF download
    trackEvent('pdf_download', {
      event_category: 'engagement',
      event_label: file?.name || 'unknown',
      value: 1
    });

    console.log('📊 Analytics: PDF download tracked');
  };

  const handleReset = () => {
    // Track reset action
    trackEvent('user_action', {
      event_category: 'interaction',
      event_label: 'reset_editor',
      value: 1
    });

    setFile(null);
    setFileUrl('');
    setDocumentId('');
    setMessage('');
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with VERSION NUMBER */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">PDF Editor</h1>
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
                disabled={loading}
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="w-20 h-20 text-purple-400 mx-auto mb-4" />
                <p className="text-white text-xl text-center font-semibold mb-2">
                  Drop PDF or Click to Upload
                </p>
                <p className="text-purple-300 text-center text-sm">
                  Maximum file size: 50MB
                </p>
              </label>
            </div>
          ) : (
            <>
              {/* File Info */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-purple-400" />
                    <div>
                      <p className="text-white font-semibold">{file.name}</p>
                      <p className="text-purple-300 text-sm">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>

              {/* PDF Preview */}
              {fileUrl && (
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6 border border-white/20">
                  <div className="bg-white rounded-lg overflow-hidden" style={{ height: '600px' }}>
                    <iframe
                      src={fileUrl}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  </div>
                </div>
              )}

              {/* Tools */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleFindReplace}
                  disabled={loading || !documentId}
                  className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-4 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  <Search className="w-5 h-5" />
                  Find & Replace
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!documentId}
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-4 rounded-xl font-semibold transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-xl font-semibold transition-all transform hover:scale-105"
                >
                  <Upload className="w-5 h-5" />
                  Upload New
                </button>
              </div>

              {/* Loading Indicator */}
              {loading && (
                <div className="mt-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-3">📋 How to Use:</h3>
                <ol className="text-purple-300 space-y-2 text-sm">
                  <li>1. Your PDF has been uploaded successfully</li>
                  <li>2. Click "Find & Replace" to edit text in the PDF</li>
                  <li>3. Click "Download PDF" to get your edited file</li>
                  <li>4. Click "Upload New" to start with a different file</li>
                </ol>
              </div>
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