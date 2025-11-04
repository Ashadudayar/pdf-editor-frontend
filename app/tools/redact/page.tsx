'use client';

import { useState } from 'react';
import { EyeOff, Upload, Download, Shield } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function RedactPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [searchTerms, setSearchTerms] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleRedact = async () => {
    if (!file) return;
    if (mode === 'manual' && !searchTerms.trim()) {
      setError('Please enter text to redact');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      if (mode === 'manual') {
        formData.append('terms', searchTerms);
      }

      const response = await fetch(`${API_URL}/redact/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Redaction failed');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to redact PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.pdf_url) return;
    window.open(`${API_URL.replace('/api', '')}${result.pdf_url}`, '_blank');
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setSearchTerms('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <EyeOff className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Redact PDF</h1>
          <p className="text-gray-600">Remove sensitive information permanently</p>
        </div>

        {!result ? (
          <div className="space-y-6">
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

            {file && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Redaction Mode</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => setMode('auto')}
                      className={`p-4 rounded-lg border-2 transition ${
                        mode === 'auto'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <p className="font-semibold mb-1">Auto-Redact</p>
                      <p className="text-xs text-gray-600">SSN, emails, phones</p>
                    </button>
                    
                    <button
                      onClick={() => setMode('manual')}
                      className={`p-4 rounded-lg border-2 transition ${
                        mode === 'manual'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <p className="font-semibold mb-1">Manual Redact</p>
                      <p className="text-xs text-gray-600">Specify text</p>
                    </button>
                  </div>

                  {mode === 'manual' && (
                    <input
                      type="text"
                      value={searchTerms}
                      onChange={(e) => setSearchTerms(e.target.value)}
                      placeholder="Enter text to redact (comma-separated)"
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                    />
                  )}
                </div>

                <button
                  onClick={handleRedact}
                  disabled={processing}
                  className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition"
                >
                  {processing ? 'Redacting...' : 'Redact PDF'}
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
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">PDF Redacted!</h3>
            <p className="text-gray-600 mb-6">{result.message}</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download Redacted PDF
            </button>

            {result.redaction_count !== undefined && (
              <p className="text-sm text-gray-500 mb-4">Items redacted: {result.redaction_count}</p>
            )}

            <div>
              <button onClick={reset} className="text-purple-600 hover:underline">
                Redact Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}