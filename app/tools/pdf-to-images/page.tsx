'use client';

import { useState } from 'react';
import { Image as ImageIcon, Upload, Download, Package } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function PDFToImagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Settings
  const [dpi, setDpi] = useState<150 | 200 | 300>(150);
  const [format, setFormat] = useState<'jpg' | 'png'>('jpg');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setResult(null); // Clear previous results

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
      const response = await fetch(`${API_URL}/documents/${documentId}/pdf-to-images/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dpi: dpi,
          format: format,
          pages: 'all'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to convert PDF to images');
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
    setDpi(150);
    setFormat('jpg');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <ImageIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF to Images</h1>
          <p className="text-gray-600">Convert PDF pages to high-quality images</p>
        </div>

        {!result ? (
          // BEFORE CONVERSION - Show upload and settings
          <div className="space-y-6">
            {/* Upload */}
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
              <>
                {/* Settings */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Settings</h3>
                  
                  {/* Quality */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Image Quality
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setDpi(150)}
                        className={`p-3 rounded-lg border-2 transition ${
                          dpi === 150
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <p className="font-semibold">Low</p>
                        <p className="text-xs text-gray-500">150 DPI</p>
                      </button>
                      <button
                        onClick={() => setDpi(200)}
                        className={`p-3 rounded-lg border-2 transition ${
                          dpi === 200
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <p className="font-semibold">Medium</p>
                        <p className="text-xs text-gray-500">200 DPI</p>
                      </button>
                      <button
                        onClick={() => setDpi(300)}
                        className={`p-3 rounded-lg border-2 transition ${
                          dpi === 300
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <p className="font-semibold">High</p>
                        <p className="text-xs text-gray-500">300 DPI</p>
                      </button>
                    </div>
                  </div>

                  {/* Format */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Image Format
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setFormat('png')}
                        className={`p-3 rounded-lg border-2 transition ${
                          format === 'png'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <p className="font-semibold">PNG</p>
                        <p className="text-xs text-gray-500">Better quality</p>
                      </button>
                      <button
                        onClick={() => setFormat('jpg')}
                        className={`p-3 rounded-lg border-2 transition ${
                          format === 'jpg'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <p className="font-semibold">JPG</p>
                        <p className="text-xs text-gray-500">Smaller size</p>
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      📦 All pages will be converted and packed in a ZIP file for easy download
                    </p>
                  </div>

                  {/* Convert Button - THIS IS THE ONLY BUTTON BEFORE CONVERSION */}
                  <button
                    onClick={handleConvert}
                    disabled={processing}
                    className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition"
                  >
                    {processing ? 'Converting Pages...' : 'Convert to Images'}
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 font-semibold">Error:</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}
          </div>
        ) : (
          // AFTER CONVERSION - Show results and download
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Images Ready!</h3>
            <p className="text-gray-600 mb-2">{result.message}</p>
            
            <div className="flex justify-center gap-4 mb-6 text-sm text-gray-600">
              <span>📊 {result.images_count} image(s)</span>
              <span>📄 {format.toUpperCase()} format</span>
              <span>🎨 {dpi} DPI</span>
              {result.file_size && (
                <span>💾 {(result.file_size / 1024 / 1024).toFixed(2)} MB</span>
              )}
            </div>
            
            {/* Download Button - ONLY button after conversion */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download ZIP File
            </button>

            <div>
              <button onClick={reset} className="text-purple-600 hover:underline">
                Convert Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
