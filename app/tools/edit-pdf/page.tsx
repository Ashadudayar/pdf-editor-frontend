'use client';

import { useState, useRef } from 'react';
import { Upload, ArrowLeft, Download, Pen, Save, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import Link from 'next/link';

interface TextBlock {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font: string;
  size: number;
  color: number;
  flags: number;
  isEditing?: boolean;
  isModified?: boolean;
  originalText?: string;
  id?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface ImageElement {
  data: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ShapeElement {
  type: string;
  rect: number[];
  color: number[];
  width: number;
  fill: number[] | null;
}

interface PageLayout {
  page_width: number;
  page_height: number;
  text_blocks: TextBlock[];
  images: ImageElement[];
  shapes: ShapeElement[];
}

export default function EditPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const [editMode, setEditMode] = useState<boolean>(false);
  const [pageLayout, setPageLayout] = useState<PageLayout | null>(null);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  const [formatToolbarPosition, setFormatToolbarPosition] = useState({ x: 0, y: 0 });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api';
  const pageRef = useRef<HTMLDivElement>(null);

  // Validate and sanitize numbers
  const sanitizeNumber = (value: any, defaultValue: number = 0): number => {
    const num = parseFloat(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
  };

  // Validate color value
  const isValidColor = (color: any): boolean => {
    const num = parseInt(color);
    return !isNaN(num) && isFinite(num) && num >= 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file');
      return;
    }

    if (uploadedFile.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
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

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      setDocumentId(uploadData.id);

      try {
        const countResponse = await fetch(`${API_URL}/documents/${uploadData.id}/page_count/`);
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setNumPages(countData.page_count);
        } else {
          setNumPages(1);
        }
      } catch {
        setNumPages(1);
      }

      await loadPageLayout(uploadData.id, 1);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.message || 'Failed to upload PDF. Please try again.');
      setFile(null);
      setDocumentId('');
    } finally {
      setLoading(false);
    }
  };

  const loadPageLayout = async (docId: string, pageNum: number) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `${API_URL}/documents/${docId}/extract_layout/?page=${pageNum}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to load page ${pageNum}. The PDF may be corrupted or password-protected.`);
      }

      const layout: PageLayout = await response.json();
      console.log('Layout loaded:', layout);
      
      // Validate layout data
      if (!layout || typeof layout !== 'object') {
        throw new Error('Invalid layout data received');
      }

      const pageWidth = sanitizeNumber(layout.page_width, 595);
      const pageHeight = sanitizeNumber(layout.page_height, 842);

      if (pageWidth <= 0 || pageHeight <= 0) {
        throw new Error('Invalid page dimensions');
      }

      // Validate and sanitize text blocks
      // Validate and sanitize text blocks
const validTextBlocks = (layout.text_blocks || [])
  .filter(block => {
    try {
      // Check if required properties exist and are valid
      const hasText = block && typeof block.text === 'string' && block.text.trim().length > 0;
      const hasValidX = typeof block.x === 'number' && isFinite(block.x);
      const hasValidY = typeof block.y === 'number' && isFinite(block.y);
      const hasValidWidth = typeof block.width === 'number' && isFinite(block.width);
      const hasValidHeight = typeof block.height === 'number' && isFinite(block.height);
      const hasValidSize = typeof block.size === 'number' && isFinite(block.size);
      
      return hasText && hasValidX && hasValidY && hasValidWidth && hasValidHeight && hasValidSize;
    } catch {
      return false;
    }
  })
  .map((block, index) => ({
    ...block,
    id: `block-${pageNum}-${index}`,
    x: sanitizeNumber(block.x),
    y: sanitizeNumber(block.y),
    width: sanitizeNumber(block.width, 50),
    height: sanitizeNumber(block.height, 12),
    size: sanitizeNumber(block.size, 12),
    color: isValidColor(block.color) ? block.color : 0,
    flags: typeof block.flags === 'number' ? block.flags : 0,
    isEditing: false,
    isModified: false,
    originalText: block.text,
    isBold: ((typeof block.flags === 'number' ? block.flags : 0) & 16) !== 0,
    isItalic: ((typeof block.flags === 'number' ? block.flags : 0) & 2) !== 0,
    isUnderline: ((typeof block.flags === 'number' ? block.flags : 0) & 4) !== 0,
    align: 'left' as 'left' | 'center' | 'right',
  }));

// Validate and sanitize images
const validImages = (layout.images || [])
  .filter(img => {
    try {
      const hasData = img && typeof img.data === 'string' && img.data.startsWith('data:image/');
      const hasValidX = typeof img.x === 'number' && isFinite(img.x);
      const hasValidY = typeof img.y === 'number' && isFinite(img.y);
      const hasValidWidth = typeof img.width === 'number' && isFinite(img.width) && img.width > 0;
      const hasValidHeight = typeof img.height === 'number' && isFinite(img.height) && img.height > 0;
      
      return hasData && hasValidX && hasValidY && hasValidWidth && hasValidHeight;
    } catch {
      return false;
    }
  })
  .map(img => ({
    data: img.data,
    x: sanitizeNumber(img.x),
    y: sanitizeNumber(img.y),
    width: sanitizeNumber(img.width, 10),
    height: sanitizeNumber(img.height, 10),
  }));

// Validate and sanitize shapes
const validShapes = (layout.shapes || [])
  .filter(shape => {
    try {
      if (!shape || !Array.isArray(shape.rect) || shape.rect.length < 4) {
        return false;
      }
      
      const allValid = shape.rect.slice(0, 4).every(
        val => typeof val === 'number' && isFinite(val)
      );
      
      return allValid;
    } catch {
      return false;
    }
  })
  .map(shape => ({
    type: shape.type || 'path',
    rect: [
      sanitizeNumber(shape.rect[0]),
      sanitizeNumber(shape.rect[1]),
      sanitizeNumber(shape.rect[2]),
      sanitizeNumber(shape.rect[3]),
    ],
    color: Array.isArray(shape.color) ? shape.color : [0, 0, 0],
    width: sanitizeNumber(shape.width, 1),
    fill: Array.isArray(shape.fill) ? shape.fill : null,
  }));
      const sanitizedLayout: PageLayout = {
        page_width: pageWidth,
        page_height: pageHeight,
        text_blocks: validTextBlocks,
        images: validImages,
        shapes: validShapes,
      };

      setPageLayout(sanitizedLayout);
      setTextBlocks(validTextBlocks);
      setError('');
    } catch (error: any) {
      console.error('Failed to load layout:', error);
      setError(error.message || 'Failed to load page. This PDF may not be supported.');
      if (pageNum === 1) {
        setPageLayout(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > numPages) return;
    setCurrentPage(newPage);
    setSelectedBlock(null);
    setEditMode(false);
    setShowFormatToolbar(false);
    
    if (documentId) {
      await loadPageLayout(documentId, newPage);
    }
  };

  const handleBlockClick = (e: React.MouseEvent, index: number) => {
    if (!editMode) return;
    e.stopPropagation();
    setSelectedBlock(index);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setFormatToolbarPosition({
      x: rect.left,
      y: rect.top - 50
    });
    setShowFormatToolbar(true);
  };

  const handleBlockDoubleClick = (e: React.MouseEvent, index: number) => {
    if (!editMode) return;
    e.stopPropagation();
    
    setTextBlocks(textBlocks.map((block, i) => ({
      ...block,
      isEditing: i === index,
    })));
    setSelectedBlock(index);
    setShowFormatToolbar(false);
  };

  const handleTextChange = (index: number, newText: string) => {
    setTextBlocks(textBlocks.map((block, i) => 
      i === index ? {
        ...block,
        text: newText,
        isModified: newText !== block.originalText,
      } : block
    ));
  };

  const handleTextBlur = (index: number) => {
    setTextBlocks(textBlocks.map((block, i) =>
      i === index ? { ...block, isEditing: false } : block
    ));
  };

  const handleFormatChange = (property: string, value: any) => {
    if (selectedBlock === null) return;
    
    setTextBlocks(textBlocks.map((block, i) =>
      i === selectedBlock ? { ...block, [property]: value, isModified: true } : block
    ));
  };

  // Update rgbToHex to handle both integer and array formats
const rgbToHex = (color: number | number[]): string => {
  try {
    if (Array.isArray(color)) {
      // Handle RGB array [r, g, b]
      const [r, g, b] = color;
      return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    } else {
      // Handle integer color
      const num = parseInt(String(color));
      if (isNaN(num)) return '#000000';
      
      const r = (num >> 16) & 0xFF;
      const g = (num >> 8) & 0xFF;
      const b = num & 0xFF;
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  } catch {
    return '#000000';
  }
};

  const getFontFamily = (fontName: string): string => {
    try {
      const lower = String(fontName).toLowerCase();
      if (lower.includes('times')) return 'Times New Roman, serif';
      if (lower.includes('courier')) return 'Courier New, monospace';
      if (lower.includes('helvetica') || lower.includes('arial')) return 'Arial, sans-serif';
      return 'Arial, sans-serif';
    } catch {
      return 'Arial, sans-serif';
    }
  };

  const handleSave = async () => {
    if (!documentId) return;

    const modifiedBlocks = textBlocks.filter(block => block.isModified);
    if (modifiedBlocks.length === 0) {
      alert('No changes to save');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const operations = modifiedBlocks.map(block => ({
        type: 'replace_text',
        page: currentPage,
        original_text: block.originalText,
        new_text: block.text,
        bbox: {
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height,
        },
        font_size: block.size,
        font_family: getFontFamily(block.font),
      }));

      const response = await fetch(`${API_URL}/documents/${documentId}/edit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save changes');
      }

      const data = await response.json();

      if (data.download_url) {
        const fullUrl = data.download_url.startsWith('http') 
          ? data.download_url 
          : `${API_URL.replace('/api', '')}${data.download_url}`;
        setResultUrl(fullUrl);
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      setError(error.message || 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDocumentId('');
    setNumPages(0);
    setCurrentPage(1);
    setResultUrl('');
    setTextBlocks([]);
    setSelectedBlock(null);
    setEditMode(false);
    setPageLayout(null);
    setZoom(1.0);
    setShowFormatToolbar(false);
    setError('');
  };

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = 'edited.pdf';
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
              <h1 className="text-2xl font-bold">Edit PDF</h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">PDF Edited Successfully!</h2>
            <p className="text-gray-600 mb-8">Your changes have been applied</p>
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
                Edit Another PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!file || !pageLayout) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Edit PDF</h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-1">Error</p>
                <p className="text-sm text-red-700">{error}</p>
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
                  {loading ? 'Processing...' : 'Upload PDF File'}
                </h3>
                <p className="text-gray-600 mb-1">Click to select or drag and drop</p>
                <p className="text-sm text-gray-500">Maximum file size: 50MB</p>
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
              <div>
                <h1 className="text-2xl font-bold">Edit PDF</h1>
                <p className="text-sm text-gray-600">Double-click text to edit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-start gap-2">
            <span className="text-red-600">⚠️</span>
            <p className="text-sm text-red-800 flex-1">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium ${
                  editMode ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Pen className="w-4 h-4" />
                {editMode ? 'Editing...' : 'Edit'}
              </button>
              
              <span className="text-sm text-gray-600 border-l pl-4">
                {editMode ? 'Double-click text to edit' : 'Click Edit to start'}
              </span>
            </div>

            {editMode && textBlocks.some(b => b.isModified) && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>

          {/* Format Toolbar */}
          {showFormatToolbar && selectedBlock !== null && editMode && textBlocks[selectedBlock] && (
            <div
              className="fixed bg-white shadow-xl rounded-lg border-2 border-blue-200 p-2 flex items-center gap-2 z-50"
              style={{
                left: formatToolbarPosition.x,
                top: formatToolbarPosition.y,
              }}
            >
              <select
                value={textBlocks[selectedBlock]?.font || 'Arial'}
                onChange={(e) => handleFormatChange('font', e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Helvetica">Helvetica</option>
              </select>

              <input
                type="number"
                value={textBlocks[selectedBlock]?.size || 12}
                onChange={(e) => handleFormatChange('size', parseInt(e.target.value))}
                className="w-16 px-2 py-1 border rounded text-sm"
                min="8"
                max="72"
              />

              <div className="border-l pl-2 flex gap-1">
                <button
                  onClick={() => handleFormatChange('isBold', !textBlocks[selectedBlock]?.isBold)}
                  className={`p-1 rounded ${textBlocks[selectedBlock]?.isBold ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormatChange('isItalic', !textBlocks[selectedBlock]?.isItalic)}
                  className={`p-1 rounded ${textBlocks[selectedBlock]?.isItalic ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormatChange('isUnderline', !textBlocks[selectedBlock]?.isUnderline)}
                  className={`p-1 rounded ${textBlocks[selectedBlock]?.isUnderline ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </button>
              </div>

              <div className="border-l pl-2 flex gap-1">
                <button
                  onClick={() => handleFormatChange('align', 'left')}
                  className={`p-1 rounded ${textBlocks[selectedBlock]?.align === 'left' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormatChange('align', 'center')}
                  className={`p-1 rounded ${textBlocks[selectedBlock]?.align === 'center' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleFormatChange('align', 'right')}
                  className={`p-1 rounded ${textBlocks[selectedBlock]?.align === 'right' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-gray-50 p-8">
            <div className="flex justify-center">
              <div
                ref={pageRef}
                className="relative bg-white shadow-2xl"
                style={{
                  width: pageLayout.page_width * zoom,
                  height: pageLayout.page_height * zoom,
                }}
                onClick={() => {
                  setShowFormatToolbar(false);
                  setSelectedBlock(null);
                }}
              >
                {/* White Background Layer */}
                <div className="absolute inset-0 bg-white" />

                {/* Render Images */}
                {pageLayout.images.map((img, index) => (
                  <div
                    key={`img-${index}`}
                    className="absolute overflow-hidden bg-white"
                    style={{
                      left: img.x * zoom,
                      top: img.y * zoom,
                      width: img.width * zoom,
                      height: img.height * zoom,
                    }}
                  >
                    <img
                      src={img.data}
                      alt=""
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.error('Image load error');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ))}

                {/* Render Shapes */}
                {/* Render Shapes */}
{pageLayout.shapes.map((shape, index) => {
  try {
    const x0 = shape.rect[0] * zoom;
    const y0 = shape.rect[1] * zoom;
    const x1 = shape.rect[2] * zoom;
    const y1 = shape.rect[3] * zoom;
    const width = Math.abs(x1 - x0);
    const height = Math.abs(y1 - y0);

    if (width <= 0 || height <= 0) return null;

    const fillColor = shape.fill ? rgbToHex(shape.fill) : 'transparent';
    const strokeColor = shape.color ? rgbToHex(shape.color) : '#000000';

    return (
      <div
        key={`shape-${index}`}
        className="absolute"
        style={{
          left: Math.min(x0, x1),
          top: Math.min(y0, y1),
          width,
          height,
          backgroundColor: fillColor,
          border: shape.width > 0 ? `${Math.max(shape.width * zoom, 0.5)}px solid ${strokeColor}` : 'none',
        }}
      />
    );
  } catch (error) {
    console.error('Error rendering shape:', error);
    return null;
  }
})}

                {/* Render Text Blocks */}
                {textBlocks.map((block, index) => {
                  try {
                    return (
                      <div
                        key={`text-${index}`}
                        onClick={(e) => handleBlockClick(e, index)}
                        onDoubleClick={(e) => handleBlockDoubleClick(e, index)}
                        className={`absolute ${
                          editMode ? 'cursor-pointer' : ''
                        } ${
                          block.isEditing
                            ? 'z-50 bg-white border-2 border-blue-500 shadow-lg'
                            : editMode && selectedBlock === index
                            ? 'border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-20'
                            : editMode
                            ? 'hover:border-2 hover:border-dashed hover:border-blue-400'
                            : ''
                        } ${block.isModified && editMode ? 'bg-yellow-100 bg-opacity-30' : ''}`}
                        style={{
                          left: block.x * zoom,
                          top: block.y * zoom,
                          minWidth: block.width * zoom,
                          minHeight: block.height * zoom,
                          padding: '2px',
                        }}
                      >
                        {block.isEditing ? (
                          <input
                            type="text"
                            value={block.text}
                            onChange={(e) => handleTextChange(index, e.target.value)}
                            onBlur={() => handleTextBlur(index)}
                            autoFocus
                            className="w-full bg-transparent border-none outline-none"
                            style={{
                              fontSize: block.size * zoom,
                              fontFamily: getFontFamily(block.font),
                              fontWeight: block.isBold ? 'bold' : 'normal',
                              fontStyle: block.isItalic ? 'italic' : 'normal',
                              textDecoration: block.isUnderline ? 'underline' : 'none',
                              textAlign: block.align || 'left',
                              color: rgbToHex(block.color),
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: block.size * zoom,
                              fontFamily: getFontFamily(block.font),
                              fontWeight: block.isBold ? 'bold' : 'normal',
                              fontStyle: block.isItalic ? 'italic' : 'normal',
                              textDecoration: block.isUnderline ? 'underline' : 'none',
                              color: rgbToHex(block.color),
                              whiteSpace: 'nowrap',
                              display: 'block',
                              textAlign: block.align || 'left',
                            }}
                          >
                            {block.text}
                          </span>
                        )}
                      </div>
                    );
                  } catch (error) {
                    console.error('Error rendering text block:', error);
                    return null;
                  }
                })}
              </div>
            </div>
          </div>

          {/* Bottom Controls with Zoom Slider */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              
              <div className="flex items-center gap-6">
                <span className="text-sm font-medium">
                  Page {currentPage} of {numPages}
                </span>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Zoom:</span>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    value={zoom * 100}
                    onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
                    className="w-40 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm font-medium min-w-[50px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === numPages || loading}
                className="px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Edit PDF</h2>
          <p className="text-sm text-gray-600 mb-6">
            Select and edit text blocks in your PDF.
          </p>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">💡 How to edit:</p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Click "Edit" button</li>
              <li>Click text to select & format</li>
              <li>Double-click to edit text</li>
              <li>Use bottom slider to zoom</li>
              <li>Click Save when done</li>
            </ol>
          </div>

          {textBlocks.filter(b => b.isModified).length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <p className="text-sm text-yellow-800 font-medium">
                📝 {textBlocks.filter(b => b.isModified).length} change(s) pending
              </p>
            </div>
          )}

          {numPages > 1 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-700">Pages:</h3>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: Math.min(numPages, 20) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    disabled={loading}
                    className={`px-3 py-2 rounded text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                {numPages > 20 && (
                  <div className="col-span-4 text-center text-sm text-gray-500">
                    ...and {numPages - 20} more pages
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}