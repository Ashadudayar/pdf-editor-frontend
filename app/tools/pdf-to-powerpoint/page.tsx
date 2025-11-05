'use client';

import { useState } from 'react';
import { Presentation, Upload, Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function PDFToPowerPointTool() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

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
      const response = await fetch(`${API_URL}/documents/${documentId}/pdf-to-powerpoint/`, {
        method: 'POST',
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Presentation className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF to PowerPoint</h1>
          <p className="text-gray-600">Convert PDF to editable .pptx presentation</p>
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
                className="flex flex-col items-center justify-center border-2 border-dashed border-orange-300 rounded-xl p-12 cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition"
              >
                <Upload className="w-16 h-16 text-orange-500 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {file ? file.name : 'Upload PDF'}
                </p>
                <p className="text-sm text-gray-500">PDF files only</p>
              </label>
            </div>

            {file && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <button
                  onClick={handleConvert}
                  disabled={processing}
                  className="w-full bg-orange-600 text-white py-4 rounded-xl font-semibold hover:bg-orange-700 disabled:bg-gray-300 transition"
                >
                  {processing ? 'Converting...' : 'Convert to PowerPoint'}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">PowerPoint Created!</h3>
            <p className="text-gray-600 mb-6">Your PDF has been converted</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download PowerPoint
            </button>

            <div>
              <button onClick={reset} className="text-orange-600 hover:underline">
                Convert Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}