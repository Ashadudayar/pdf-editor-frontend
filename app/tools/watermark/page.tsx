'use client';

import { useState, useRef } from 'react';
import { Upload, ArrowLeft, Download, Type, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

type WatermarkType = 'text' | 'image';
type Position = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type Layer = 'over' | 'below';

export default function WatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const [watermarkType, setWatermarkType] = useState<WatermarkType>('text');
  const [watermarkText, setWatermarkText] = useState('CONFIDENCIAL');
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [watermarkImagePreview, setWatermarkImagePreview] = useState<string>('');
  
  // Text format options
  const [font, setFont] = useState('Arial');
  const [fontSize, setFontSize] = useState(48);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [textColor, setTextColor] = useState('#FF0000');
  
  // Position and layout
  const [position, setPosition] = useState<Position>('middle-center');
  const [mosaic, setMosaic] = useState(false);
  
  // Additional options
  const [transparency, setTransparency] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState(1);
  const [layer, setLayer] = useState<Layer>('over');
  
  const [numPages, setNumPages] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api';
  const imageInputRef = useRef<HTMLInputElement>(null);

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

      // Get page count
      const countResponse = await fetch(`${API_URL}/documents/${uploadData.id}/page_count/`);
      if (countResponse.ok) {
        const { page_count } = await countResponse.json();
        setNumPages(page_count);
        setToPage(page_count);
      }

      // Generate preview
      await generatePreview(uploadData.id);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError('Failed to upload PDF. Please try again.');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async (docId: string) => {
    try {
      const layoutResponse = await fetch(`${API_URL}/documents/${docId}/extract_layout/?page=1`);
      if (layoutResponse.ok) {
        const layout = await layoutResponse.json();
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx && layout.page_width && layout.page_height) {
          const scale = 0.5;
          canvas.width = layout.page_width * scale;
          canvas.height = layout.page_height * scale;
          
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw images
          if (layout.images) {
            for (const img of layout.images) {
              try {
                const image = new Image();
                image.src = img.data;
                await new Promise((resolve) => {
                  image.onload = resolve;
                  image.onerror = resolve;
                });
                ctx.drawImage(image, img.x * scale, img.y * scale, img.width * scale, img.height * scale);
              } catch {}
            }
          }
          
          setPreviewUrl(canvas.toDataURL('image/png'));
        }
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setWatermarkImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setWatermarkImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const positionMap: { [key in Position]: { x: string; y: string } } = {
    'top-left': { x: 'left', y: 'top' },
    'top-center': { x: 'center', y: 'top' },
    'top-right': { x: 'right', y: 'top' },
    'middle-left': { x: 'left', y: 'middle' },
    'middle-center': { x: 'center', y: 'middle' },
    'middle-right': { x: 'right', y: 'middle' },
    'bottom-left': { x: 'left', y: 'bottom' },
    'bottom-center': { x: 'center', y: 'bottom' },
    'bottom-right': { x: 'right', y: 'bottom' },
  };

  const handleApplyWatermark = async () => {
    if (!documentId) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      
      if (watermarkType === 'text') {
        formData.append('text', watermarkText);
        formData.append('font_name', font);
        formData.append('font_size', fontSize.toString());
        formData.append('color', textColor);
        formData.append('bold', bold.toString());
        formData.append('italic', italic.toString());
        formData.append('underline', underline.toString());
      } else if (watermarkImage) {
        formData.append('image', watermarkImage);
      } else {
        alert('Please select an image for watermark');
        setLoading(false);
        return;
      }

      formData.append('position', position);
      formData.append('opacity', (transparency / 100).toString());
      formData.append('rotation', rotation.toString());
      formData.append('mosaic', mosaic.toString());
      formData.append('layer', layer);
      
      // Page range
      const pages = fromPage === 1 && toPage === numPages 
        ? 'all' 
        : `${fromPage}-${toPage}`;
      formData.append('pages', pages);

      const response = await fetch(`${API_URL}/documents/${documentId}/add_watermark/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to add watermark');

      const data = await response.json();

      if (data.download_url) {
        const fullUrl = data.download_url.startsWith('http')
          ? data.download_url
          : `${API_URL.replace('/api', '')}${data.download_url}`;
        setResultUrl(fullUrl);
      }
    } catch (error: any) {
      console.error('Watermark failed:', error);
      setError('Failed to add watermark. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDocumentId('');
    setResultUrl('');
    setError('');
    setWatermarkText('CONFIDENCIAL');
    setWatermarkImage(null);
    setWatermarkImagePreview('');
    setPreviewUrl('');
  };

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = 'watermarked.pdf';
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
              <h1 className="text-2xl font-bold">Add Watermark</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Watermark Added Successfully!</h2>
            <p className="text-gray-600 mb-8">Your PDF has been watermarked</p>
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
                Add Another Watermark
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Add Watermark</h1>
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
              <h1 className="text-2xl font-bold">Add Watermark</h1>
            </div>
            <button
              onClick={handleApplyWatermark}
              disabled={loading || (watermarkType === 'text' && !watermarkText) || (watermarkType === 'image' && !watermarkImage)}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Processing...' : 'Add Watermark'}
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
        {/* Main Content - Preview */}
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl p-8 relative max-w-2xl">
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Preview" className="max-w-full" />
                
                {/* Watermark Preview Overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    opacity: transparency / 100,
                  }}
                >
                  {watermarkType === 'text' ? (
                    <div
                      className={`${
                        position.includes('top') ? 'items-start' :
                        position.includes('bottom') ? 'items-end' :
                        'items-center'
                      } ${
                        position.includes('left') ? 'justify-start' :
                        position.includes('right') ? 'justify-end' :
                        'justify-center'
                      } flex w-full h-full p-8`}
                    >
                      <span
                        style={{
                          fontFamily: font,
                          fontSize: `${fontSize}px`,
                          color: textColor,
                          fontWeight: bold ? 'bold' : 'normal',
                          fontStyle: italic ? 'italic' : 'normal',
                          textDecoration: underline ? 'underline' : 'none',
                          transform: `rotate(${rotation}deg)`,
                        }}
                      >
                        {watermarkText}
                      </span>
                    </div>
                  ) : watermarkImagePreview ? (
                    <img
                      src={watermarkImagePreview}
                      alt="Watermark"
                      className="max-w-xs max-h-xs"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                      }}
                    />
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="w-96 h-96 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Loading preview...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Options */}
        <div className="w-96 bg-white border-l p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-6">Watermark options</h2>

          {/* Type Selection */}
          <div className="mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setWatermarkType('text')}
                className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                  watermarkType === 'text'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {watermarkType === 'text' && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                <Type className="w-8 h-8" />
                <span className="font-medium">Place text</span>
              </button>

              <button
                onClick={() => setWatermarkType('image')}
                className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                  watermarkType === 'image'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {watermarkType === 'image' && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                <ImageIcon className="w-8 h-8" />
                <span className="font-medium">Place image</span>
              </button>
            </div>
          </div>

          {watermarkType === 'text' ? (
            <>
              {/* Text Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text:
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter watermark text"
                />
              </div>

              {/* Text Format */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text format:
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Helvetica">Helvetica</option>
                  </select>

                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {[12, 16, 24, 32, 48, 64, 72, 96].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setBold(!bold)}
                    className={`p-2 border rounded ${bold ? 'bg-gray-200' : ''}`}
                    title="Bold"
                  >
                    <span className="font-bold">B</span>
                  </button>

                  <button
                    onClick={() => setItalic(!italic)}
                    className={`p-2 border rounded ${italic ? 'bg-gray-200' : ''}`}
                    title="Italic"
                  >
                    <span className="italic">I</span>
                  </button>

                  <button
                    onClick={() => setUnderline(!underline)}
                    className={`p-2 border rounded ${underline ? 'bg-gray-200' : ''}`}
                    title="Underline"
                  >
                    <span className="underline">U</span>
                  </button>

                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 border rounded cursor-pointer"
                    title="Text Color"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image:
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="watermark-image"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 text-gray-600"
                >
                  {watermarkImage ? watermarkImage.name : 'Click to select image'}
                </button>
                {watermarkImagePreview && (
                  <div className="mt-2">
                    <img src={watermarkImagePreview} alt="Preview" className="w-full rounded" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Position */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'] as Position[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className={`aspect-square rounded-lg border-2 ${
                    position === pos
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${position === pos ? 'bg-red-500' : 'bg-gray-400'}`} />
                  </div>
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={mosaic}
                onChange={(e) => setMosaic(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Mosaic</span>
            </label>
          </div>

          {/* Transparency */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transparency: {transparency}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={transparency}
              onChange={(e) => setTransparency(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Rotation */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotation:
            </label>
            <select
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="0">Do not rotate</option>
              <option value="45">45°</option>
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </select>
          </div>

          {/* Pages */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pages:
            </label>
            <div className="flex items-center gap-2">
              <div>
                <label className="text-sm text-gray-600">from page</label>
                <input
                  type="number"
                  min="1"
                  max={numPages}
                  value={fromPage}
                  onChange={(e) => setFromPage(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">to</label>
                <input
                  type="number"
                  min="1"
                  max={numPages}
                  value={toPage}
                  onChange={(e) => setToPage(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1"
                />
              </div>
            </div>
          </div>

          {/* Layer */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layer:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLayer('over')}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                  layer === 'over'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="text-red-600 text-2xl">◆</div>
                <span className={`text-sm font-medium ${layer === 'over' ? 'text-red-600' : ''}`}>
                  Over the PDF content
                </span>
              </button>

              <button
                onClick={() => setLayer('below')}
                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                  layer === 'below'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="text-gray-400 text-2xl">◇</div>
                <span className={`text-sm font-medium ${layer === 'below' ? 'text-red-600' : ''}`}>
                  Below the PDF content
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}