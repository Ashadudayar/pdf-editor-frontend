'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, ArrowLeft, Download, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker setup
if (typeof window !== 'undefined') {
  const pdfjsVersion = pdfjsLib.version || '4.10.38';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
}

type CropMode = 'all' | 'current';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function CropPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [cropMode, setCropMode] = useState<CropMode>('all');
  const [resultUrl, setResultUrl] = useState<string>('');
  
  // Crop area state (in percentage of page size)
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api';

  // Generate PDF preview
  const generatePDFPreview = async (pdfFile: File, pageNum: number = 1) => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNum);
      
      // High quality rendering
      const scale = 2.5;
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Could not get canvas context');
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // White background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render PDF
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      const imageUrl = canvas.toDataURL('image/png');
      setPreviewUrl(imageUrl);
      
      pdf.destroy();
    } catch (error) {
      console.error('PDF preview error:', error);
      setPreviewUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    setFile(uploadedFile);
    setLoading(true);
    setError('');

    try {
      // Upload to backend
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const uploadResponse = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const uploadData = await uploadResponse.json();
      setDocumentId(uploadData.id);

      // Get page count
      try {
        const countResponse = await fetch(`${API_URL}/documents/${uploadData.id}/page_count/`);
        if (countResponse.ok) {
          const { page_count } = await countResponse.json();
          setNumPages(page_count);
        }
      } catch (err) {
        console.log('Could not get page count');
      }

      // Generate preview
      await generatePDFPreview(uploadedFile, 1);
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError('Failed to upload PDF. Please try again.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > numPages || !file) return;
    setCurrentPage(newPage);
    await generatePDFPreview(file, newPage);
  };

  const handleZoomChange = (delta: number) => {
    setZoom(prev => Math.min(200, Math.max(50, prev + delta)));
  };

  const handleReset = () => {
    setCropArea({
      x: 10,
      y: 10,
      width: 80,
      height: 80
    });
  };

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    setIsDragging(true);
    setDragHandle(handle);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCropArea(prev => {
      let newArea = { ...prev };

      switch (dragHandle) {
        case 'move':
          const dx = x - (prev.x + prev.width / 2);
          const dy = y - (prev.y + prev.height / 2);
          newArea.x = Math.max(0, Math.min(100 - prev.width, prev.x + dx));
          newArea.y = Math.max(0, Math.min(100 - prev.height, prev.y + dy));
          break;

        case 'nw':
          newArea.width = Math.max(10, prev.width + (prev.x - x));
          newArea.height = Math.max(10, prev.height + (prev.y - y));
          newArea.x = Math.max(0, x);
          newArea.y = Math.max(0, y);
          break;

        case 'ne':
          newArea.width = Math.max(10, x - prev.x);
          newArea.height = Math.max(10, prev.height + (prev.y - y));
          newArea.y = Math.max(0, y);
          break;

        case 'sw':
          newArea.width = Math.max(10, prev.width + (prev.x - x));
          newArea.height = Math.max(10, y - prev.y);
          newArea.x = Math.max(0, x);
          break;

        case 'se':
          newArea.width = Math.max(10, x - prev.x);
          newArea.height = Math.max(10, y - prev.y);
          break;

        case 'n':
          newArea.height = Math.max(10, prev.height + (prev.y - y));
          newArea.y = Math.max(0, y);
          break;

        case 's':
          newArea.height = Math.max(10, y - prev.y);
          break;

        case 'w':
          newArea.width = Math.max(10, prev.width + (prev.x - x));
          newArea.x = Math.max(0, x);
          break;

        case 'e':
          newArea.width = Math.max(10, x - prev.x);
          break;
      }

      // Constrain to bounds
      if (newArea.x + newArea.width > 100) newArea.width = 100 - newArea.x;
      if (newArea.y + newArea.height > 100) newArea.height = 100 - newArea.y;

      return newArea;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragHandle('');
  };

  const handleCropPDF = async () => {
    if (!documentId) {
      setError('Please upload a PDF first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/crop/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: cropArea.x,
          y: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
          apply_to: cropMode,
          current_page: cropMode === 'current' ? currentPage : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to crop PDF' }));
        throw new Error(errorData.error || 'Failed to crop PDF');
      }

      const data = await response.json();

      if (data.download_url) {
        const fullUrl = data.download_url.startsWith('http')
          ? data.download_url
          : `${API_URL.replace('/api', '')}${data.download_url}`;
        setResultUrl(fullUrl);
      }
    } catch (error: any) {
      console.error('Crop failed:', error);
      setError(error.message || 'Failed to crop PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDocumentId('');
    setResultUrl('');
    setError('');
    setCurrentPage(1);
    setNumPages(1);
    setZoom(100);
    setCropArea({ x: 10, y: 10, width: 80, height: 80 });
    setPreviewUrl('');
  };

  const handleDownload = () => {
    if (resultUrl) {
      window.open(resultUrl, '_blank');
    }
  };

  // Success screen
  if (resultUrl) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Crop PDF</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">PDF Cropped Successfully!</h2>
            <p className="text-gray-600 mb-8">Your PDF has been cropped and is ready to download</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Crop Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Upload screen
  if (!file) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Crop PDF</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-red-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={loading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {loading ? (
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto mb-4"></div>
                ) : (
                  <Upload className="w-16 h-16 text-red-500 mx-auto mb-4" />
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {loading ? 'Loading PDF...' : 'Upload PDF File'}
                </h3>
                <p className="text-gray-600">Click to select or drag and drop your PDF</p>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Crop editor screen
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Crop PDF</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex-shrink-0">
          <p className="text-sm text-red-800 text-center">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-200">
          <div className="bg-white rounded-lg shadow-2xl p-4 max-w-4xl max-h-[80vh] relative">
            {previewUrl ? (
              <div
                ref={canvasRef}
                className="relative inline-block cursor-crosshair"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center center'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img 
                  src={previewUrl} 
                  alt="PDF Preview" 
                  className="max-w-full max-h-[70vh] object-contain select-none pointer-events-none"
                  draggable={false}
                />
                
                {/* Crop Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: `0 0 0 9999px rgba(0,0,0,0.5)`
                  }}
                />

                {/* Crop Selection */}
                <div
                  className="absolute border-4 border-blue-500 pointer-events-auto cursor-move"
                  style={{
                    left: `${cropArea.x}%`,
                    top: `${cropArea.y}%`,
                    width: `${cropArea.width}%`,
                    height: `${cropArea.height}%`,
                    boxShadow: 'inset 0 0 0 1px white'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                  {/* Corner Handles */}
                  {['nw', 'ne', 'sw', 'se'].map(handle => (
                    <div
                      key={handle}
                      className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-pointer hover:scale-125 transition-transform"
                      style={{
                        [handle.includes('n') ? 'top' : 'bottom']: '-8px',
                        [handle.includes('w') ? 'left' : 'right']: '-8px',
                        cursor: `${handle}-resize`
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, handle);
                      }}
                    />
                  ))}

                  {/* Edge Handles */}
                  {['n', 's', 'e', 'w'].map(handle => (
                    <div
                      key={handle}
                      className="absolute w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-pointer hover:scale-125 transition-transform"
                      style={{
                        [handle === 'n' || handle === 's' ? 'left' : 'top']: '50%',
                        [handle === 'n' ? 'top' : handle === 's' ? 'bottom' : handle === 'w' ? 'left' : 'right']: '-8px',
                        transform: (handle === 'n' || handle === 's') ? 'translateX(-50%)' : 'translateY(-50%)',
                        cursor: `${handle}-resize`
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, handle);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-96 h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="mt-6 flex items-center gap-6 bg-gray-800 px-6 py-3 rounded-lg text-white">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ◀
            </button>

            <span className="font-medium">
              {currentPage} / {numPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === numPages}
              className="p-2 hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ▶
            </button>

            <div className="w-px h-6 bg-gray-600 mx-2" />

            <button
              onClick={() => handleZoomChange(-10)}
              className="p-2 hover:bg-gray-700 rounded"
            >
              −
            </button>

            <span className="font-medium w-16 text-center">{zoom}%</span>

            <button
              onClick={() => handleZoomChange(10)}
              className="p-2 hover:bg-gray-700 rounded"
            >
              +
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-white border-l flex-shrink-0 flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Crop PDF</h2>
              <button
                onClick={handleReset}
                className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                Reset all
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Click and drag to select the area you want to keep. Resize if needed.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Pages Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pages:
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="crop-mode"
                    checked={cropMode === 'all'}
                    onChange={() => setCropMode('all')}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="text-gray-900">All pages</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="crop-mode"
                    checked={cropMode === 'current'}
                    onChange={() => setCropMode('current')}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="text-gray-900">Current page</span>
                </label>
              </div>
            </div>

            {/* Crop Info */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Position:</span>
                <span className="font-medium">{cropArea.x.toFixed(1)}%, {cropArea.y.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-medium">{cropArea.width.toFixed(1)}% × {cropArea.height.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Crop Button */}
          <div className="p-6 border-t">
            <button
              onClick={handleCropPDF}
              disabled={loading}
              className="w-full px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors"
            >
              {loading ? 'Processing...' : 'Crop PDF ⭕'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}