'use client';

import { useState } from 'react';
import { Upload, ArrowLeft, Download, Pen, Save } from 'lucide-react';
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
  
  const [editMode, setEditMode] = useState<boolean>(false);
  const [pageLayout, setPageLayout] = useState<PageLayout | null>(null);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const uploadResponse = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const uploadData = await uploadResponse.json();
      setDocumentId(uploadData.id);

      // Get number of pages (we'll need to track this separately or get from backend)
      // For now, let's assume we can extract it
      setNumPages(1); // You'd need to get this from backend

      // Load first page layout
      await loadPageLayout(uploadData.id, 1);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPageLayout = async (docId: string, pageNum: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${API_URL}/documents/${docId}/extract_layout/?page=${pageNum}`
      );

      if (!response.ok) throw new Error('Failed to extract layout');

      const layout: PageLayout = await response.json();
      setPageLayout(layout);

      // Prepare text blocks for editing
      const blocks = layout.text_blocks.map((block, index) => ({
        ...block,
        id: `block-${pageNum}-${index}`,
        isEditing: false,
        isModified: false,
        originalText: block.text,
      }));

      setTextBlocks(blocks);
    } catch (error) {
      console.error('Failed to load layout:', error);
      alert('Failed to load page layout');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedBlock(null);
    setEditMode(false);
    
    if (documentId) {
      await loadPageLayout(documentId, newPage);
    }
  };

  const handleBlockClick = (e: React.MouseEvent, index: number) => {
    if (!editMode) return;
    e.stopPropagation();
    setSelectedBlock(index);
  };

  const handleBlockDoubleClick = (e: React.MouseEvent, index: number) => {
    if (!editMode) return;
    e.stopPropagation();
    
    setTextBlocks(textBlocks.map((block, i) => ({
      ...block,
      isEditing: i === index,
    })));
    setSelectedBlock(index);
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

  const rgbToHex = (colorInt: number): string => {
    const r = (colorInt >> 16) & 0xFF;
    const g = (colorInt >> 8) & 0xFF;
    const b = colorInt & 0xFF;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const getFontFamily = (fontName: string): string => {
    const lower = fontName.toLowerCase();
    if (lower.includes('times')) return 'Times New Roman, serif';
    if (lower.includes('courier')) return 'Courier New, monospace';
    if (lower.includes('helvetica') || lower.includes('arial')) return 'Arial, sans-serif';
    return 'Arial, sans-serif';
  };

  const isBold = (flags: number): boolean => (flags & 16) !== 0;
  const isItalic = (flags: number): boolean => (flags & 2) !== 0;

  const handleSave = async () => {
    if (!documentId) return;

    const modifiedBlocks = textBlocks.filter(block => block.isModified);
    if (modifiedBlocks.length === 0) {
      alert('No changes to save');
      return;
    }

    setLoading(true);

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

      if (!response.ok) throw new Error('Save failed');

      const data = await response.json();

      if (data.download_url) {
        const fullUrl = data.download_url.startsWith('http') 
          ? data.download_url 
          : `${API_URL.replace('/api', '')}${data.download_url}`;
        setResultUrl(fullUrl);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save changes. Please try again.');
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
                <p className="text-sm text-gray-500">Upload a PDF to edit</p>
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
              
              <span className="text-sm text-gray-600">
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

          {/* Reconstructed Page */}
          <div className="flex-1 overflow-auto bg-gray-50 p-8">
            <div className="flex justify-center">
              <div
                className="relative bg-white shadow-2xl"
                style={{
                  width: pageLayout.page_width,
                  height: pageLayout.page_height,
                }}
              >
                {/* Render Images */}
                {pageLayout.images.map((img, index) => (
                  <img
                    key={`img-${index}`}
                    src={img.data}
                    alt=""
                    className="absolute pointer-events-none"
                    style={{
                      left: img.x,
                      top: img.y,
                      width: img.width,
                      height: img.height,
                    }}
                  />
                ))}

                {/* Render Shapes */}
                {pageLayout.shapes.map((shape, index) => (
                  <div
                    key={`shape-${index}`}
                    className="absolute"
                    style={{
                      left: shape.rect[0],
                      top: shape.rect[1],
                      width: shape.rect[2] - shape.rect[0],
                      height: shape.rect[3] - shape.rect[1],
                      backgroundColor: shape.fill ? rgbToHex(shape.fill[0]) : 'transparent',
                      border: `${shape.width}px solid ${rgbToHex(shape.color[0])}`,
                    }}
                  />
                ))}

                {/* Render Text Blocks */}
                {textBlocks.map((block, index) => (
                  <div
                    key={`text-${index}`}
                    onClick={(e) => handleBlockClick(e, index)}
                    onDoubleClick={(e) => handleBlockDoubleClick(e, index)}
                    className={`absolute ${
                      editMode ? 'cursor-pointer' : ''
                    } ${
                      block.isEditing
                        ? 'z-50 bg-white border-2 border-blue-500'
                        : editMode && selectedBlock === index
                        ? 'border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-20'
                        : editMode
                        ? 'hover:border-2 hover:border-dashed hover:border-blue-400'
                        : ''
                    } ${block.isModified && editMode ? 'bg-yellow-100 bg-opacity-30' : ''}`}
                    style={{
                      left: block.x,
                      top: block.y,
                      minWidth: block.width,
                      minHeight: block.height,
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
                          fontSize: block.size,
                          fontFamily: getFontFamily(block.font),
                          fontWeight: isBold(block.flags) ? 'bold' : 'normal',
                          fontStyle: isItalic(block.flags) ? 'italic' : 'normal',
                          color: rgbToHex(block.color),
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: block.size,
                          fontFamily: getFontFamily(block.font),
                          fontWeight: isBold(block.flags) ? 'bold' : 'normal',
                          fontStyle: isItalic(block.flags) ? 'italic' : 'normal',
                          color: rgbToHex(block.color),
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {block.text}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l p-6">
          <h2 className="text-xl font-bold mb-4">Edit PDF</h2>
          <p className="text-sm text-gray-600 mb-6">
            Page reconstructed from PDF layout.
          </p>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">💡 How to edit:</p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Click "Edit" button</li>
              <li>Double-click text to edit</li>
              <li>Make changes</li>
              <li>Click Save</li>
            </ol>
          </div>

          {textBlocks.filter(b => b.isModified).length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                📝 {textBlocks.filter(b => b.isModified).length} change(s)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}