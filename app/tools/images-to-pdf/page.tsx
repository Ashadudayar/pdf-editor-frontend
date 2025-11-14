'use client';

import { useState } from 'react';
import { Upload, Download, Image as ImageIcon, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

type Orientation = 'portrait' | 'landscape';
type Margin = 'none' | 'small' | 'big';

const PAGE_SIZES = [
  { label: 'A4 (297x210 mm)', value: 'A4', width: 210, height: 297 },
  { label: 'Letter (279x216 mm)', value: 'Letter', width: 216, height: 279 },
  { label: 'Legal (356x216 mm)', value: 'Legal', width: 216, height: 356 },
  { label: 'A3 (420x297 mm)', value: 'A3', width: 297, height: 420 },
  { label: 'A5 (210x148 mm)', value: 'A5', width: 148, height: 210 },
];

export default function ImagesToPDFTool() {
  const [images, setImages] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  // Options
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [pageSize, setPageSize] = useState('A4');
  const [margin, setMargin] = useState<Margin>('none');
  const [mergeAll, setMergeAll] = useState(true);

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
      formData.append('orientation', orientation);
      formData.append('page_size', pageSize);
      formData.append('margin', margin);
      formData.append('merge_all', mergeAll.toString());

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Image to PDF</h1>
              <p className="text-sm text-gray-500">Convert images to PDF with custom settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!resultId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Upload Area */}
            <div className="lg:col-span-2 space-y-6">
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
                  <p className="text-sm text-gray-500">JPG, PNG, JPEG, etc.</p>
                </label>
              </div>

              {images.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Images ({images.length})</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={img.name}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">{img.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Right: Options Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Image to PDF options</h2>

                {/* Page Orientation */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Page orientation
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOrientation('portrait')}
                      className={`p-4 rounded-xl border-2 transition ${
                        orientation === 'portrait'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-12 rounded border-2 ${
                          orientation === 'portrait' ? 'border-red-500' : 'border-gray-400'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          orientation === 'portrait' ? 'text-red-600' : 'text-gray-700'
                        }`}>Portrait</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setOrientation('landscape')}
                      className={`p-4 rounded-xl border-2 transition ${
                        orientation === 'landscape'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-8 rounded border-2 ${
                          orientation === 'landscape' ? 'border-red-500' : 'border-gray-400'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          orientation === 'landscape' ? 'text-red-600' : 'text-gray-700'
                        }`}>Landscape</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Page Size */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Page size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none"
                  >
                    {PAGE_SIZES.map(size => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Margin */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Margin
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setMargin('none')}
                      className={`p-4 rounded-xl border-2 transition ${
                        margin === 'none'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className={`w-8 h-8 ${
                          margin === 'none' ? 'text-red-500' : 'text-gray-400'
                        }`} />
                        <span className={`text-xs font-medium ${
                          margin === 'none' ? 'text-red-600' : 'text-gray-700'
                        }`}>No margin</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setMargin('small')}
                      className={`p-4 rounded-xl border-2 transition ${
                        margin === 'small'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 border-2 border-dashed ${
                          margin === 'small' ? 'border-red-500' : 'border-gray-400'
                        } rounded flex items-center justify-center`}>
                          <div className={`w-5 h-5 ${
                            margin === 'small' ? 'bg-red-200' : 'bg-gray-300'
                          } rounded`}></div>
                        </div>
                        <span className={`text-xs font-medium ${
                          margin === 'small' ? 'text-red-600' : 'text-gray-700'
                        }`}>Small</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setMargin('big')}
                      className={`p-4 rounded-xl border-2 transition ${
                        margin === 'big'
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-8 h-8 border-2 border-dashed ${
                          margin === 'big' ? 'border-red-500' : 'border-gray-400'
                        } rounded flex items-center justify-center`}>
                          <div className={`w-4 h-4 ${
                            margin === 'big' ? 'bg-red-200' : 'bg-gray-300'
                          } rounded`}></div>
                        </div>
                        <span className={`text-xs font-medium ${
                          margin === 'big' ? 'text-red-600' : 'text-gray-700'
                        }`}>Big</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Merge Option */}
                <div className="mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mergeAll}
                      onChange={(e) => setMergeAll(e.target.checked)}
                      className="w-5 h-5 text-red-600 border-2 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">
                      Merge all images in one PDF file
                    </span>
                  </label>
                </div>

                {/* Convert Button */}
                <button
                  onClick={handleConvert}
                  disabled={processing || images.length === 0}
                  className="w-full bg-red-600 text-white py-4 rounded-xl font-semibold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <span>Convert to PDF</span>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">PDF Created!</h3>
              <p className="text-gray-600 mb-6">
                Your {images.length} image{images.length > 1 ? 's have' : ' has'} been converted to PDF
              </p>
              
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
          </div>
        )}
      </div>
    </div>
  );
}