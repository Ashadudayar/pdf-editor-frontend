'use client';

import { useState } from 'react';
import { Upload, Download, Image as ImageIcon, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function ImagesToPDFTool() {
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      images.forEach(img => formData.append('files', img));

      const response = await fetch(`${API_URL}/documents/images-to-pdf/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Conversion failed');

      const data = await response.json();
      setResultId(data.id);
    } catch (err) {
      setError('Failed to convert images');
    } finally {
      setProcessing(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownload = () => {
    if (!resultId) return;
    window.open(`${API_URL}/documents/${resultId}/download/`, '_blank');
  };

  const reset = () => {
    setImages([]);
    setResultId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <ImageIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Images to PDF</h1>
          <p className="text-gray-600">Convert JPG, PNG images to PDF</p>
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
                <p className="text-lg font-semibold text-gray-700 mb-2">Upload Images</p>
                <p className="text-sm text-gray-500">JPG, PNG, etc.</p>
              </label>
            </div>

            {images.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Images ({images.length})</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={img.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-500 mt-1 truncate">{img.name}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleConvert}
                  disabled={processing}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition"
                >
                  {processing ? 'Converting...' : `Convert ${images.length} Images to PDF`}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">PDF Created!</h3>
            <p className="text-gray-600 mb-6">Your {images.length} images have been converted to PDF</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>

            <div>
              <button onClick={reset} className="text-blue-600 hover:underline">
                Convert More Images
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}