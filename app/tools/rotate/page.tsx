'use client';

import { useState, useEffect } from 'react';
import { Upload, ArrowLeft, Download, RotateCw, RotateCcw, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface PageRotation {
  pageNumber: number;
  rotation: number; // 0, 90, 180, 270
  thumbnail: string;
}

export default function RotatePDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const [pageRotations, setPageRotations] = useState<PageRotation[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api';

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
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const uploadResponse = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const uploadData = await uploadResponse.json();
      setDocumentId(uploadData.id);

      await generateThumbnails(uploadData.id);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError('Failed to upload PDF. Please try again.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const generateThumbnails = async (docId: string) => {
    try {
      setLoading(true);
      
      // Get page count
      const countResponse = await fetch(`${API_URL}/documents/${docId}/page_count/`);
      if (!countResponse.ok) throw new Error('Failed to get page count');
      
      const { page_count } = await countResponse.json();
      
      // Generate thumbnails for each page
      const rotations: PageRotation[] = [];
      
      for (let i = 1; i <= page_count; i++) {
        try {
          const layoutResponse = await fetch(
            `${API_URL}/documents/${docId}/extract_layout/?page=${i}`
          );
          
          if (layoutResponse.ok) {
            const layout = await layoutResponse.json();
            
            // Create a canvas to render the thumbnail
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (ctx && layout.page_width && layout.page_height) {
              const scale = 2.5; // Thumbnail scale
              canvas.width = layout.page_width * scale;
              canvas.height = layout.page_height * scale;
              
              // White background
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw images
              if (layout.images && layout.images.length > 0) {
                for (const img of layout.images) {
                  try {
                    const image = new Image();
                    image.src = img.data;
                    await new Promise((resolve) => {
                      image.onload = resolve;
                      image.onerror = resolve;
                    });
                    ctx.drawImage(
                      image,
                      img.x * scale,
                      img.y * scale,
                      img.width * scale,
                      img.height * scale
                    );
                  } catch {}
                }
              }
              
              // Draw shapes
              if (layout.shapes) {
                layout.shapes.forEach((shape: any) => {
                  if (shape.fill && shape.fill.length >= 3) {
                    ctx.fillStyle = `rgb(${shape.fill[0]}, ${shape.fill[1]}, ${shape.fill[2]})`;
                    ctx.fillRect(
                      shape.rect[0] * scale,
                      shape.rect[1] * scale,
                      (shape.rect[2] - shape.rect[0]) * scale,
                      (shape.rect[3] - shape.rect[1]) * scale
                    );
                  }
                });
              }
              
              // Draw text (simplified)
              if (layout.text_blocks) {
                ctx.fillStyle = '#000';
                ctx.font = `${8 * scale}px Arial`;
                layout.text_blocks.forEach((block: any) => {
                  ctx.fillRect(
                    block.x * scale,
                    block.y * scale,
                    block.width * scale,
                    2
                  );
                });
              }
              
              rotations.push({
                pageNumber: i,
                rotation: 0,
                thumbnail: canvas.toDataURL('image/png'),
              });
            }
          }
        } catch (err) {
          console.error(`Failed to generate thumbnail for page ${i}:`, err);
        }
      }
      
      setPageRotations(rotations);
    } catch (error) {
      console.error('Failed to generate thumbnails:', error);
      setError('Failed to load PDF pages');
    } finally {
      setLoading(false);
    }
  };

  const rotatePage = (pageNumber: number, direction: 'right' | 'left') => {
    setPageRotations(prev =>
      prev.map(page => {
        if (page.pageNumber === pageNumber) {
          const change = direction === 'right' ? 90 : -90;
          return {
            ...page,
            rotation: (page.rotation + change + 360) % 360,
          };
        }
        return page;
      })
    );
  };

  const rotateSelected = (direction: 'right' | 'left') => {
    if (selectedPages.size === 0) return;
    
    setPageRotations(prev =>
      prev.map(page => {
        if (selectedPages.has(page.pageNumber)) {
          const change = direction === 'right' ? 90 : -90;
          return {
            ...page,
            rotation: (page.rotation + change + 360) % 360,
          };
        }
        return page;
      })
    );
  };

  const resetAll = () => {
    setPageRotations(prev =>
      prev.map(page => ({ ...page, rotation: 0 }))
    );
    setSelectedPages(new Set());
  };

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  const handleApplyRotation = async () => {
    if (!documentId) return;

    const hasRotations = pageRotations.some(page => page.rotation !== 0);
    if (!hasRotations) {
      alert('No rotations to apply');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Build rotation string
      const rotationPages: { [key: number]: number } = {};
      pageRotations.forEach(page => {
        if (page.rotation !== 0) {
          rotationPages[page.pageNumber] = page.rotation;
        }
      });

      // Call rotate API - we'll rotate all pages
      const allPages = pageRotations.map(p => p.pageNumber).join(',');
      
      const response = await fetch(`${API_URL}/documents/${documentId}/rotate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: allPages,
          angle: 90, // We'll need to update backend to handle per-page rotations
          rotations: rotationPages,
        }),
      });

      if (!response.ok) throw new Error('Rotation failed');

      const data = await response.json();

      if (data.download_url) {
        const fullUrl = data.download_url.startsWith('http')
          ? data.download_url
          : `${API_URL.replace('/api', '')}${data.download_url}`;
        setResultUrl(fullUrl);
      }
    } catch (error: any) {
      console.error('Rotation failed:', error);
      setError('Failed to rotate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDocumentId('');
    setResultUrl('');
    setPageRotations([]);
    setSelectedPages(new Set());
    setError('');
  };

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = 'rotated.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (resultUrl) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Rotate PDF</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">PDF Rotated Successfully!</h2>
            <p className="text-gray-600 mb-8">Your PDF has been rotated</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Rotate Another PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!file || pageRotations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Rotate PDF</h1>
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

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400">
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
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                ) : (
                  <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                )}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {loading ? 'Loading PDF...' : 'Upload PDF File'}
                </h3>
                <p className="text-gray-600">Click to select or drag and drop</p>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Rotate PDF</h1>
            </div>
            <button
              onClick={handleApplyRotation}
              disabled={loading || !pageRotations.some(p => p.rotation !== 0)}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Processing...' : 'Apply Rotation'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <p className="text-sm text-red-800 text-center">{error}</p>
        </div>
      )}

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              🔄 Mouse over PDF file below and a <RotateCw className="w-4 h-4 inline" /> icon will appear, click on the arrows to rotate PDFs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {pageRotations.map((page) => (
              <div
                key={page.pageNumber}
                className="relative group"
                onClick={() => togglePageSelection(page.pageNumber)}
              >
                {/* Page Card */}
                <div
                  className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all ${
                    selectedPages.has(page.pageNumber)
                      ? 'ring-4 ring-blue-500'
                      : 'hover:shadow-xl'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative bg-gray-100 aspect-[3/4]">
                    <img
                      src={page.thumbnail}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-full object-contain"
                      style={{
                        transform: `rotate(${page.rotation}deg)`,
                        transition: 'transform 0.3s ease',
                      }}
                    />
                    
                    {/* Rotate Overlay on Hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            rotatePage(page.pageNumber, 'left');
                          }}
                          className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Rotate Left"
                        >
                          <RotateCcw className="w-6 h-6 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            rotatePage(page.pageNumber, 'right');
                          }}
                          className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Rotate Right"
                        >
                          <RotateCw className="w-6 h-6 text-gray-700" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Rotation Indicator */}
                    {page.rotation !== 0 && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {page.rotation}°
                      </div>
                    )}
                  </div>
                  
                  {/* Page Number */}
                  <div className="p-3 text-center">
                    <p className="text-sm font-medium text-gray-700">
                      Page {page.pageNumber}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Rotation</h2>
            <button
              onClick={resetAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Reset all
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => rotateSelected('right')}
              disabled={selectedPages.size === 0}
              className="w-full flex items-center gap-3 p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="p-2 bg-white bg-opacity-20 rounded">
                <RotateCw className="w-6 h-6" />
              </div>
              <span className="font-medium">RIGHT</span>
            </button>

            <button
              onClick={() => rotateSelected('left')}
              disabled={selectedPages.size === 0}
              className="w-full flex items-center gap-3 p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="p-2 bg-white bg-opacity-20 rounded">
                <RotateCcw className="w-6 h-6" />
              </div>
              <span className="font-medium">LEFT</span>
            </button>
          </div>

          {selectedPages.size > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedPages.size} page(s) selected
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              💡 Click on pages to select multiple pages, then use the rotation buttons above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}