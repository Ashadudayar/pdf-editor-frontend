'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, ArrowLeft, Download, Type, Image as ImageIcon, FileText } from 'lucide-react';
import Link from 'next/link';
import * as pdfjsLib from 'pdfjs-dist';

// ✅ Fixed: Use unpkg CDN with proper CORS support
if (typeof window !== 'undefined') {
  const pdfjsVersion = pdfjsLib.version || '4.10.38';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
}

type WatermarkType = 'text' | 'image';
type Position = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
type Layer = 'over' | 'below';

export default function WatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
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
  const [resultUrl, setResultUrl] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api';
  const imageInputRef = useRef<HTMLInputElement>(null);

  const generatePDFPreview = async (pdfFile: File) => {
    try {
      // Check if PDF.js is loaded
      if (!pdfjsLib) {
        console.error('PDF.js not loaded');
        return;
      }

      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
      });
      
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      
      // Calculate scale for good quality
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // White background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render PDF page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
      
      // Convert to image and set preview
      const imageUrl = canvas.toDataURL('image/png');
      setPreviewUrl(imageUrl);
      
      // Clean up
      pdf.destroy();
      
    } catch (error: any) {
      console.error('PDF preview error:', error);
      // Don't set error - preview is optional
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
          setToPage(page_count);
        }
      } catch (err) {
        console.log('Could not get page count, using default');
        setNumPages(1);
        setToPage(1);
      }

      // Try to generate preview, but don't fail if it doesn't work
      try {
        await generatePDFPreview(uploadedFile);
      } catch (err) {
        console.log('Preview failed, but continuing...');
        setPreviewUrl('');
      }
      
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError('Failed to upload PDF. Please try again.');
      setFile(null);
    } finally {
      setLoading(false);
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

  const handleApplyWatermark = async () => {
    if (!documentId) {
      setError('Please upload a PDF first');
      return;
    }

    if (watermarkType === 'text' && !watermarkText.trim()) {
      setError('Please enter watermark text');
      return;
    }

    if (watermarkType === 'image' && !watermarkImage) {
      setError('Please select an image for watermark');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('watermark_type', watermarkType);
      
      if (watermarkType === 'text') {
        formData.append('watermark_text', watermarkText);
        formData.append('font', font);
        formData.append('font_size', fontSize.toString());
        formData.append('bold', bold.toString());
        formData.append('italic', italic.toString());
        formData.append('text_color', textColor);
      } else if (watermarkImage) {
        formData.append('watermark_image', watermarkImage);
      }
      
      formData.append('position', position);
      formData.append('mosaic', mosaic.toString());
      formData.append('transparency', transparency.toString());
      formData.append('rotation', rotation.toString());
      formData.append('from_page', fromPage.toString());
      formData.append('to_page', toPage.toString());
      formData.append('layer', layer);

      const response = await fetch(`${API_URL}/documents/${documentId}/add_watermark/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add watermark' }));
        throw new Error(errorData.error || 'Failed to add watermark');
      }

      const data = await response.json();

      // Set result URL for download
      if (data.download_url) {
        const fullUrl = data.download_url.startsWith('http')
          ? data.download_url
          : `${API_URL.replace('/api', '')}${data.download_url}`;
        setResultUrl(fullUrl);
      }
    } catch (error: any) {
      console.error('Watermark failed:', error);
      setError(error.message || 'Failed to add watermark. Please try again.');
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
    setNumPages(1);
    setFromPage(1);
    setToPage(1);
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
            <p className="text-gray-600 mb-8">Your PDF has been watermarked and is ready to download</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Add Another
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

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
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
                <p className="text-gray-600">Click to select or drag and drop your PDF</p>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Editor screen
  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Add Watermark</h1>
            </div>
            <button
              onClick={handleApplyWatermark}
              disabled={loading || (watermarkType === 'text' && !watermarkText.trim()) || (watermarkType === 'image' && !watermarkImage)}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Processing...' : 'Add Watermark'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex-shrink-0">
          <p className="text-sm text-red-800 text-center">{error}</p>
        </div>
      )}

      {/* Main Content Area - Flex container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview Area - Fixed, centered */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-h-full overflow-auto">
            {previewUrl ? (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="PDF Preview" 
                  className="max-w-full max-h-[70vh] object-contain" 
                />
                
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
                          fontSize: `${fontSize * 0.5}px`,
                          color: textColor,
                          fontWeight: bold ? 'bold' : 'normal',
                          fontStyle: italic ? 'italic' : 'normal',
                          textDecoration: underline ? 'underline' : 'none',
                          transform: `rotate(${rotation}deg)`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {watermarkText}
                      </span>
                    </div>
                  ) : watermarkImagePreview ? (
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
                      <img
                        src={watermarkImagePreview}
                        alt="Watermark Preview"
                        className="max-w-[150px] max-h-[150px] object-contain"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="w-96 h-[500px] bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-gray-300">
                <FileText className="w-24 h-24 text-gray-400" />
                <div className="text-center px-6">
                  <p className="text-gray-700 font-medium mb-2">{file?.name}</p>
                  <p className="text-sm text-gray-500 mb-1">Preview not available</p>
                  <p className="text-xs text-gray-400">Watermark will be applied correctly ✓</p>
                </div>
                {/* Show watermark preview even without PDF preview */}
                {watermarkType === 'text' && watermarkText && (
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Watermark preview:</p>
                    <span
                      style={{
                        fontFamily: font,
                        fontSize: `${fontSize * 0.3}px`,
                        color: textColor,
                        fontWeight: bold ? 'bold' : 'normal',
                        fontStyle: italic ? 'italic' : 'normal',
                        textDecoration: underline ? 'underline' : 'none',
                        opacity: transparency / 100,
                      }}
                    >
                      {watermarkText}
                    </span>
                  </div>
                )}
                {watermarkType === 'image' && watermarkImagePreview && (
                  <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Watermark preview:</p>
                    <img
                      src={watermarkImagePreview}
                      alt="Watermark"
                      className="max-w-[100px] max-h-[100px] object-contain"
                      style={{ opacity: transparency / 100 }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Scrollable independently */}
        <div className="w-96 bg-white border-l flex-shrink-0 flex flex-col overflow-hidden">
          <div className="p-6 border-b flex-shrink-0">
            <h2 className="text-xl font-bold">Watermark options</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {/* Type Selection */}
            <div className="mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setWatermarkType('text')}
                  className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    watermarkType === 'text'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {watermarkType === 'text' && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                  <Type className="w-8 h-8" />
                  <span className="font-medium">Place text</span>
                </button>

                <button
                  onClick={() => setWatermarkType('image')}
                  className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    watermarkType === 'image'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {watermarkType === 'image' && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
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
                  <div className="flex gap-2 items-center mb-2">
                    <select
                      value={font}
                      onChange={(e) => setFont(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Helvetica">Helvetica</option>
                    </select>

                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {[12, 16, 24, 32, 48, 64, 72, 96].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setBold(!bold)}
                      className={`p-2 border rounded transition-colors ${bold ? 'bg-gray-200 border-gray-400' : 'border-gray-300 hover:bg-gray-50'}`}
                      title="Bold"
                    >
                      <span className="font-bold">B</span>
                    </button>

                    <button
                      onClick={() => setItalic(!italic)}
                      className={`p-2 border rounded transition-colors ${italic ? 'bg-gray-200 border-gray-400' : 'border-gray-300 hover:bg-gray-50'}`}
                      title="Italic"
                    >
                      <span className="italic">I</span>
                    </button>

                    <button
                      onClick={() => setUnderline(!underline)}
                      className={`p-2 border rounded transition-colors ${underline ? 'bg-gray-200 border-gray-400' : 'border-gray-300 hover:bg-gray-50'}`}
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
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 text-gray-600 transition-colors"
                  >
                    {watermarkImage ? watermarkImage.name : 'Click to select image'}
                  </button>
                  {watermarkImagePreview && (
                    <div className="mt-2">
                      <img src={watermarkImagePreview} alt="Preview" className="w-full rounded border" />
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
                    className={`aspect-square rounded-lg border-2 transition-colors ${
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

              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mosaic}
                  onChange={(e) => setMosaic(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm">Mosaic (tile watermark across page)</span>
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
                className="w-full cursor-pointer"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                Pages to watermark:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">From page</label>
                  <input
                    type="number"
                    min="1"
                    max={numPages}
                    value={fromPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= numPages) setFromPage(val);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">To page</label>
                  <input
                    type="number"
                    min="1"
                    max={numPages}
                    value={toPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= numPages) setToPage(val);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Total pages: {numPages}</p>
            </div>

            {/* Layer */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Layer:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLayer('over')}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    layer === 'over'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-red-600 text-2xl">◆</div>
                  <span className={`text-xs text-center font-medium ${layer === 'over' ? 'text-red-600' : 'text-gray-600'}`}>
                    Over the PDF content
                  </span>
                </button>

                <button
                  onClick={() => setLayer('below')}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                    layer === 'below'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-gray-400 text-2xl">◇</div>
                  <span className={`text-xs text-center font-medium ${layer === 'below' ? 'text-red-600' : 'text-gray-600'}`}>
                    Below the PDF content
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}