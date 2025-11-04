'use client';

import { useState } from 'react';
import { Code, Upload, Download, Link as LinkIcon } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function HTMLToPDFTool() {
  const [mode, setMode] = useState<'html' | 'url'>('html');
  const [htmlContent, setHtmlContent] = useState('');
  const [url, setUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleConvert = async () => {
    if (!htmlContent && !url) {
      setError('Please provide HTML content or URL');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/html-to-pdf/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: mode === 'html' ? htmlContent : '',
          url: mode === 'url' ? url : ''
        }),
      });

      if (!response.ok) throw new Error('Conversion failed');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to convert HTML');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.pdf_url) return;
    window.open(`${API_URL.replace('/api', '')}${result.pdf_url}`, '_blank');
  };

  const reset = () => {
    setHtmlContent('');
    setUrl('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Code className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">HTML to PDF</h1>
          <p className="text-gray-600">Convert HTML code or web pages to PDF</p>
        </div>

        {!result ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setMode('html')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                    mode === 'html'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Code className="w-5 h-5 inline mr-2" />
                  HTML Code
                </button>
                <button
                  onClick={() => setMode('url')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                    mode === 'url'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <LinkIcon className="w-5 h-5 inline mr-2" />
                  Web URL
                </button>
              </div>

              {mode === 'html' ? (
                <div>
                  <label className="block text-sm font-medium mb-2">HTML Content</label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="Paste your HTML code here..."
                    className="w-full border rounded-lg p-4 h-64 font-mono text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Website URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full border rounded-lg p-4"
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <button
                onClick={handleConvert}
                disabled={processing || (!htmlContent && !url)}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 transition"
              >
                {processing ? 'Converting...' : 'Convert to PDF'}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">PDF Created!</h3>
            <p className="text-gray-600 mb-6">Your HTML has been converted</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>

            <div>
              <button onClick={reset} className="text-indigo-600 hover:underline">
                Convert More HTML
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}