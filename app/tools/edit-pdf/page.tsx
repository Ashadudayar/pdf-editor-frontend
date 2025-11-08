'use client';

import { useState, useRef } from 'react';
import { Upload, ArrowLeft, Download, Type, Image as ImageIcon, Pen, Square, Circle, Highlighter, Eraser, Trash2, MousePointer } from 'lucide-react';
import Link from 'next/link';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  size: number;
  color: string;
}

interface DrawingElement {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'highlight';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
  color: string;
  strokeWidth?: number;
}

export default function EditPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');
  
  // Editing state
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'draw' | 'rectangle' | 'circle' | 'highlight' | 'eraser'>('select');
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [drawingElements, setDrawingElements] = useState<DrawingElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<{ x: number; y: number }[]>([]);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(16);
  const [scale, setScale] = useState(1.0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const url = URL.createObjectURL(uploadedFile);
    setFileUrl(url);
    setFile(uploadedFile);
    setLoading(true);

    try {
      // Upload to backend
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api'}/documents/`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setDocumentId(data.id);

      // Get page count
      const pdf = await pdfjs.getDocument(url).promise;
      setNumPages(pdf.numPages);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'text') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      const text = prompt('Enter text:');
      if (text) {
        const newElement: TextElement = {
          id: `text-${Date.now()}`,
          x,
          y,
          text,
          size: fontSize,
          color: selectedColor,
        };
        setTextElements([...textElements, newElement]);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'draw' || selectedTool === 'highlight') {
      setIsDrawing(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      setCurrentDrawing([{ x, y }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDrawing && (selectedTool === 'draw' || selectedTool === 'highlight')) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      setCurrentDrawing([...currentDrawing, { x, y }]);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentDrawing.length > 0) {
      const newDrawing: DrawingElement = {
        id: `draw-${Date.now()}`,
        type: selectedTool === 'highlight' ? 'highlight' : 'line',
        x: 0,
        y: 0,
        points: currentDrawing,
        color: selectedTool === 'highlight' ? 'rgba(255, 255, 0, 0.3)' : selectedColor,
        strokeWidth: selectedTool === 'highlight' ? 20 : 2,
      };
      setDrawingElements([...drawingElements, newDrawing]);
      setCurrentDrawing([]);
      setIsDrawing(false);
    }
  };

  const handleSave = async () => {
  if (!documentId) return;

  setLoading(true);

  try {
    // Prepare operations for backend - Add explicit type
    const operations: Array<{
      type: string;
      page: number;
      x?: number;
      y?: number;
      text?: string;
      size?: number;
      color?: [number, number, number];
      area?: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
      };
    }> = [];

    // Add text elements
    textElements.forEach((el) => {
      operations.push({
        type: 'add_text',
        page: currentPage,
        x: el.x,
        y: el.y,
        text: el.text,
        size: el.size,
        color: hexToRgb(el.color),
      });
    });

    // Add drawing elements (simplified - just highlights for now)
    drawingElements.forEach((el) => {
      if (el.type === 'highlight' && el.points && el.points.length > 0) {
        const minX = Math.min(...el.points.map(p => p.x));
        const maxX = Math.max(...el.points.map(p => p.x));
        const minY = Math.min(...el.points.map(p => p.y));
        const maxY = Math.max(...el.points.map(p => p.y));
        
        operations.push({
          type: 'highlight_text',
          page: currentPage,
          area: {
            x0: minX,
            y0: minY,
            x1: maxX,
            y1: maxY,
          },
          color: [1, 1, 0], // Yellow
        });
      }
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api'}/documents/${documentId}/edit/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations }),
      }
    );

    if (!response.ok) throw new Error('Save failed');

    const data = await response.json();

    if (data.download_url) {
      const baseUrl = 'https://positive-creativity-production.up.railway.app';
      let cleanUrl = data.download_url;
      if (cleanUrl.startsWith('/api/')) {
        cleanUrl = cleanUrl.replace('/api/', '/');
      }
      const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : `${baseUrl}/api${cleanUrl}`;
      setResultUrl(fullUrl);
    }
  } catch (error) {
    console.error('Save failed:', error);
    alert('Failed to save changes. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [0, 0, 0];
  };

  const handleReset = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl('');
    setDocumentId('');
    setNumPages(0);
    setCurrentPage(1);
    setResultUrl('');
    setTextElements([]);
    setDrawingElements([]);
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

  const clearAllEdits = () => {
    setTextElements([]);
    setDrawingElements([]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit PDF</h1>
                <p className="text-sm text-gray-600">
                  Add text, images, and annotations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {resultUrl ? (
        // Success State
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Download className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              PDF Edited Successfully!
            </h2>
            <p className="text-gray-600 mb-8">
              Your changes have been applied
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={handleReset}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Edit Another PDF
              </button>
            </div>
          </div>
        </div>
      ) : !file ? (
        // Upload State
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload PDF File
                </h3>
                <p className="text-gray-600 mb-1">Click to select or drag and drop</p>
                <p className="text-sm text-gray-500">Upload a PDF to edit</p>
              </label>
            </div>
          </div>
        </div>
      ) : (
        // Editor State
        <div className="flex h-[calc(100vh-80px)]">
          {/* Left Toolbar */}
          <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-2">
            <button
              onClick={() => setSelectedTool('select')}
              className={`p-3 rounded-lg transition-colors ${
                selectedTool === 'select' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Select"
            >
              <MousePointer className="w-6 h-6" />
            </button>
            <button
              onClick={() => setSelectedTool('text')}
              className={`p-3 rounded-lg transition-colors ${
                selectedTool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Add Text"
            >
              <Type className="w-6 h-6" />
            </button>
            <button
              onClick={() => setSelectedTool('draw')}
              className={`p-3 rounded-lg transition-colors ${
                selectedTool === 'draw' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Draw"
            >
              <Pen className="w-6 h-6" />
            </button>
            <button
              onClick={() => setSelectedTool('highlight')}
              className={`p-3 rounded-lg transition-colors ${
                selectedTool === 'highlight' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Highlight"
            >
              <Highlighter className="w-6 h-6" />
            </button>
            <button
              onClick={() => setSelectedTool('rectangle')}
              className={`p-3 rounded-lg transition-colors ${
                selectedTool === 'rectangle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Rectangle"
            >
              <Square className="w-6 h-6" />
            </button>
            <button
              onClick={() => setSelectedTool('circle')}
              className={`p-3 rounded-lg transition-colors ${
                selectedTool === 'circle' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
              title="Circle"
            >
              <Circle className="w-6 h-6" />
            </button>
            
            <div className="flex-1" />
            
            <button
              onClick={clearAllEdits}
              className="p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              title="Clear All"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="flex items-center justify-center min-h-full p-8">
              <div className="bg-white shadow-2xl">
                <div
                  ref={pageContainerRef}
                  className="relative"
                  onClick={handleCanvasClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
                >
                  <Document file={fileUrl}>
                    <Page
                      pageNumber={currentPage}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </Document>

                  {/* Text Overlays */}
                  {textElements.map((el) => (
                    <div
                      key={el.id}
                      style={{
                        position: 'absolute',
                        left: el.x,
                        top: el.y,
                        fontSize: el.size,
                        color: el.color,
                        cursor: 'move',
                        userSelect: 'none',
                      }}
                    >
                      {el.text}
                    </div>
                  ))}

                  {/* Drawing Overlays */}
                  <svg
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                    }}
                  >
                    {drawingElements.map((el) => {
                      if (el.type === 'line' && el.points) {
                        const pathData = el.points
                          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                          .join(' ');
                        return (
                          <path
                            key={el.id}
                            d={pathData}
                            stroke={el.color}
                            strokeWidth={el.strokeWidth || 2}
                            fill="none"
                          />
                        );
                      }
                      if (el.type === 'highlight' && el.points) {
                        const pathData = el.points
                          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                          .join(' ');
                        return (
                          <path
                            key={el.id}
                            d={pathData}
                            stroke={el.color}
                            strokeWidth={el.strokeWidth || 20}
                            fill="none"
                            strokeLinecap="round"
                          />
                        );
                      }
                      return null;
                    })}

                    {/* Current drawing */}
                    {isDrawing && currentDrawing.length > 0 && (
                      <path
                        d={currentDrawing
                          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                          .join(' ')}
                        stroke={selectedTool === 'highlight' ? 'rgba(255, 255, 0, 0.3)' : selectedColor}
                        strokeWidth={selectedTool === 'highlight' ? 20 : 2}
                        fill="none"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                </div>
              </div>
            </div>

            {/* Page Navigation */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex items-center gap-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                ←
              </button>
              <span className="text-sm font-medium">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage === numPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                →
              </button>
              
              <div className="w-px h-6 bg-gray-300 mx-2" />
              
              <button
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                -
              </button>
              <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale(Math.min(2, scale + 0.1))}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit PDF</h2>
            
            <p className="text-sm text-gray-600 mb-6">
              Select text to edit, move, or delete the existing content.
            </p>

            {/* Color Picker */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            {/* Font Size */}
            {selectedTool === 'text' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={loading || (textElements.length === 0 && drawingElements.length === 0)}
              className="w-full px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  Edit PDF
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ The Content Editor does not currently support Right-to-Left (RTL) languages. If you uploaded a document in an RTL language, your changes may not be applied correctly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}