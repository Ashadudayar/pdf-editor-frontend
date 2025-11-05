'use client';

import { useState } from 'react';
import { PenTool, Upload, Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function SignPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [signature, setSignature] = useState('');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');

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

  const handleSign = async () => {
    if (!documentId || !signature) return;

    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/sign/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, position }),
      });

      if (!response.ok) throw new Error('Signing failed');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to sign PDF');
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
    setSignature('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <PenTool className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sign PDF</h1>
          <p className="text-gray-600">Add your digital signature to documents</p>
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
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Signature</label>
                    <input
                      type="text"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Type your full name..."
                      className="w-full border rounded-lg p-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Signature Position</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setPosition(pos)}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition ${
                            position === pos
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      ✍️ Your signature will be added to all pages at the selected position.
                    </p>
                  </div>

                  <button
                    onClick={handleSign}
                    disabled={processing || !signature}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition"
                  >
                    {processing ? 'Signing...' : 'Sign PDF'}
                  </button>
                </div>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">PDF Signed!</h3>
            <p className="text-gray-600 mb-6">{result.message}</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download Signed PDF
            </button>

            <div>
              <button onClick={reset} className="text-blue-600 hover:underline">
                Sign Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}