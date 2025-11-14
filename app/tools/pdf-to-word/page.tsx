'use client';

import { useState } from 'react';
import { FileText, Upload, Download, Edit, Image } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function PDFToWordTool() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'editable' | 'perfect'>('editable');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setDocumentId(data.id);
    } catch (err) {
      setError('Upload failed');
    }
  };

  const handleConvert = async () => {
    if (!documentId) return;

    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/pdf_to_word/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) throw new Error('Conversion failed');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to convert PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.download_url) return;
    window.open(`${API_URL.replace('/api', '')}${result.download_url}`, '_blank');
  };

  const reset = () => {
    setFile(null);
    setDocumentId('');
    setResult(null);
    setError('');
    setMode('editable');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF to WORD</h1>
          <p className="text-gray-600">Convert PDF documents to editable .docx</p>
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
                className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-12 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <Upload className="w-16 h-16 text-blue-500 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {file ? file.name : 'Upload PDF'}
                </p>
                <p className="text-sm text-gray-500">PDF files only</p>
              </label>
            </div>

            {file && (
              <>
                {/* Mode Selector */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Mode</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Editable Mode */}
                    <button
                      onClick={() => setMode('editable')}
                      className={`p-4 rounded-xl border-2 transition ${
                        mode === 'editable'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <Edit className={`w-8 h-8 mx-auto mb-2 ${
                        mode === 'editable' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <p className="font-semibold text-gray-900">Editable</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Fully editable text & tables
                      </p>
                      <p className="text-xs text-blue-600 mt-2">⚡ Fast • 📝 Editable</p>
                    </button>

                    {/* Perfect Mode */}
                    <button
                      onClick={() => setMode('perfect')}
                      className={`p-4 rounded-xl border-2 transition ${
                        mode === 'perfect'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <Image className={`w-8 h-8 mx-auto mb-2 ${
                        mode === 'perfect' ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <p className="font-semibold text-gray-900">Perfect Layout</p>
                      <p className="text-xs text-gray-600 mt-1">
                        100% accurate layout
                      </p>
                      <p className="text-xs text-purple-600 mt-2">✨ Perfect • 🖼️ Image-based</p>
                    </button>
                  </div>

                  {mode === 'perfect' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Perfect mode embeds pages as images. Layout is 100% accurate but text is not editable.
                      </p>
                    </div>
                  )}
                </div>

                {/* Convert Button */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <button
                    onClick={handleConvert}
                    disabled={processing}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition"
                  >
                    {processing ? 'Converting...' : `Convert to WORD (${mode === 'editable' ? 'Editable' : 'Perfect Layout'})`}
                  </button>
                </div>
              </>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">WORD Created!</h3>
            <p className="text-gray-600 mb-2">Mode: {result.mode === 'editable' ? 'Editable' : 'Perfect Layout'}</p>
            <p className="text-sm text-gray-500 mb-6">Your PDF has been converted to WORD</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download WORD
            </button>

            <div>
              <button onClick={reset} className="text-blue-600 hover:underline">
                Convert Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}