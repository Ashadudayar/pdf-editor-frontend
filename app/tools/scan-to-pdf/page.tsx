'use client';

import { useState, useRef } from 'react';
import { Upload, Download, Camera, Trash2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
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

export default function ScanToPDFTool() {
  const [scans, setScans] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  
  // Options
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [pageSize, setPageSize] = useState('A4');
  const [margin, setMargin] = useState<Margin>('none');
  const [convertToGrayscale, setConvertToGrayscale] = useState(false);
  const [enhanceContrast, setEnhanceContrast] = useState(true);
  const [autoDeskew, setAutoDeskew] = useState(false);
  const [autoCrop, setAutoCrop] = useState(false);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setScans(prev => [...prev, ...files]);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (err) {
      alert('Camera access denied. Please allow camera permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setScans(prev => [...prev, file]);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleConvert = async () => {
    if (scans.length === 0) return;

    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      scans.forEach(scan => formData.append('files', scan));
      formData.append('orientation', orientation);
      formData.append('page_size', pageSize);
      formData.append('margin', margin);
      formData.append('grayscale', convertToGrayscale.toString());
      formData.append('enhance_contrast', enhanceContrast.toString());
      formData.append('auto_deskew', autoDeskew.toString());
      formData.append('auto_crop', autoCrop.toString());

      const response = await fetch(`${API_URL}/documents/scan-to-pdf/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Conversion failed');
      }

      const data = await response.json();
      setResultId(data.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create PDF from scans');
    } finally {
      setProcessing(false);
    }
  };

  const removeScan = (index: number) => {
    setScans(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownload = () => {
    if (!resultId) return;
    window.open(`${API_URL}/documents/${resultId}/download/`, '_blank');
  };

  const reset = () => {
    setScans([]);
    setResultId(null);
    setError('');
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Scan to PDF</h1>
              <p className="text-sm text-gray-500">Convert scanned documents to PDF</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!resultId ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Upload/Camera Area */}
            <div className="lg:col-span-2 space-y-6">
              {!showCamera ? (
                <>
                  {/* Upload & Camera Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Upload Button */}
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
                        className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 rounded-xl p-8 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition"
                      >
                        <Upload className="w-12 h-12 text-indigo-500 mb-3" />
                        <p className="text-base font-semibold text-gray-700 mb-1">Upload Scanned Images</p>
                        <p className="text-sm text-gray-500">JPG, PNG from scanner or camera</p>
                      </label>
                    </div>

                    {/* Camera Button */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                      <button
                        onClick={startCamera}
                        className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition w-full"
                      >
                        <Camera className="w-12 h-12 text-blue-500 mb-3" />
                        <p className="text-base font-semibold text-gray-700 mb-1">Take Photo</p>
                        <p className="text-sm text-gray-500">Use your camera</p>
                      </button>
                    </div>
                  </div>

                  {/* Scanned Images Preview */}
                  {scans.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Scans ({scans.length})</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {scans.map((scan, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(scan)}
                              alt={scan.name}
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                              onClick={() => removeScan(index)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <p className="text-xs text-gray-500 mt-1 truncate">{scan.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Camera View */
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                      <button
                        onClick={capturePhoto}
                        className="bg-indigo-600 text-white p-4 rounded-full hover:bg-indigo-700 transition shadow-lg"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                      <button
                        onClick={stopCamera}
                        className="bg-gray-600 text-white px-6 py-3 rounded-full hover:bg-gray-700 transition shadow-lg"
                      >
                        Cancel
                      </button>
                    </div>
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
                <h2 className="text-xl font-bold text-gray-900 mb-6">Scan options</h2>

                {/* Enhancement Options */}
                <div className="mb-6 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={convertToGrayscale}
                      onChange={(e) => setConvertToGrayscale(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Convert to Grayscale</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enhanceContrast}
                      onChange={(e) => setEnhanceContrast(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Enhance Contrast</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDeskew}
                      onChange={(e) => setAutoDeskew(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Auto Deskew (Rotate)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCrop}
                      onChange={(e) => setAutoCrop(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Auto Crop Borders</span>
                  </label>
                </div>

                <hr className="my-6" />

                {/* Page Orientation */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Page orientation
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setOrientation('portrait')}
                      className={`p-3 rounded-xl border-2 transition ${
                        orientation === 'portrait'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-6 h-10 rounded border-2 ${
                          orientation === 'portrait' ? 'border-indigo-500' : 'border-gray-400'
                        }`}></div>
                        <span className={`text-xs font-medium ${
                          orientation === 'portrait' ? 'text-indigo-600' : 'text-gray-700'
                        }`}>Portrait</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setOrientation('landscape')}
                      className={`p-3 rounded-xl border-2 transition ${
                        orientation === 'landscape'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-6 rounded border-2 ${
                          orientation === 'landscape' ? 'border-indigo-500' : 'border-gray-400'
                        }`}></div>
                        <span className={`text-xs font-medium ${
                          orientation === 'landscape' ? 'text-indigo-600' : 'text-gray-700'
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm"
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
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setMargin('none')}
                      className={`p-3 rounded-xl border-2 transition ${
                        margin === 'none'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon className={`w-6 h-6 ${
                          margin === 'none' ? 'text-indigo-500' : 'text-gray-400'
                        }`} />
                        <span className={`text-xs font-medium ${
                          margin === 'none' ? 'text-indigo-600' : 'text-gray-700'
                        }`}>None</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setMargin('small')}
                      className={`p-3 rounded-xl border-2 transition ${
                        margin === 'small'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-6 h-6 border-2 border-dashed ${
                          margin === 'small' ? 'border-indigo-500' : 'border-gray-400'
                        } rounded flex items-center justify-center`}>
                          <div className={`w-4 h-4 ${
                            margin === 'small' ? 'bg-indigo-200' : 'bg-gray-300'
                          } rounded`}></div>
                        </div>
                        <span className={`text-xs font-medium ${
                          margin === 'small' ? 'text-indigo-600' : 'text-gray-700'
                        }`}>Small</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setMargin('big')}
                      className={`p-3 rounded-xl border-2 transition ${
                        margin === 'big'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-6 h-6 border-2 border-dashed ${
                          margin === 'big' ? 'border-indigo-500' : 'border-gray-400'
                        } rounded flex items-center justify-center`}>
                          <div className={`w-3 h-3 ${
                            margin === 'big' ? 'bg-indigo-200' : 'bg-gray-300'
                          } rounded`}></div>
                        </div>
                        <span className={`text-xs font-medium ${
                          margin === 'big' ? 'text-indigo-600' : 'text-gray-700'
                        }`}>Big</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Convert Button */}
                <button
                  onClick={handleConvert}
                  disabled={processing || scans.length === 0}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating PDF...</span>
                    </>
                  ) : (
                    <>
                      <span>Create PDF</span>
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
          /* Success Screen */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">PDF Created!</h3>
              <p className="text-gray-600 mb-6">
                Your {scans.length} scan{scans.length > 1 ? 's have' : ' has'} been converted to PDF
              </p>
              
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>

              <div>
                <button onClick={reset} className="text-indigo-600 hover:underline">
                  Scan More Documents
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}