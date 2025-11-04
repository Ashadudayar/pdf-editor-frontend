'use client';

import { useState } from 'react';
import { Upload, Download, Camera, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function ScanToPDFTool() {
  const [scans, setScans] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [grayscale, setGrayscale] = useState(false);
  const [enhance, setEnhance] = useState(true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setScans(prev => [...prev, ...files]);
  };

  const handleConvert = async () => {
    if (scans.length === 0) return;

    setProcessing(true);

    try {
      const formData = new FormData();
      scans.forEach(scan => formData.append('files', scan));
      formData.append('grayscale', grayscale.toString());
      formData.append('enhance', enhance.toString());

      const response = await fetch(`${API_URL}/documents/scan-to-pdf/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Conversion failed');

      const data = await response.json();
      setResultId(data.id);
    } catch (err) {
      alert('Failed to create PDF from scans');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultId) return;
    window.open(`${API_URL}/documents/${resultId}/download/`, '_blank');
  };

  const reset = () => {
    setScans([]);
    setResultId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Scan to PDF</h1>
          <p className="text-gray-600">Convert scanned documents to PDF</p>
        </div>

        {!resultId ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-12 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <Upload className="w-16 h-16 text-blue-500 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">Upload Scanned Images</p>
                <p className="text-sm text-gray-500">JPG, PNG from scanner or camera</p>
              </label>
            </div>

            {scans.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Scans ({scans.length})</h3>
                
                <div className="mb-6 space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={grayscale}
                      onChange={(e) => setGrayscale(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Convert to Grayscale</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={enhance}
                      onChange={(e) => setEnhance(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Enhance Contrast</span>
                  </label>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={processing}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition"
                >
                  {processing ? 'Creating PDF...' : `Create PDF from ${scans.length} Scans`}
                </button>
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
            <p className="text-gray-600 mb-6">Your {scans.length} scans have been converted to PDF</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>

            <div>
              <button onClick={reset} className="text-blue-600 hover:underline">
                Scan More Documents
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}