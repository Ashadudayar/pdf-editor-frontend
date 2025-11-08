'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, ArrowLeft, Download, Pen, Hand, Type, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { Document, Page, pdfjs } from 'react-pdf';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface TextItem {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
  fontFamily: string;
  isEditing: boolean;
  isModified: boolean;
}

export default function EditPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');
  
  const [mode, setMode] = useState<'annotate' | 'edit'>('edit');
  const [selectedTool, setSelectedTool] = useState<'hand' | 'text'>('hand');
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [pdfBackground, setPdfBackground] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const url = URL.createObjectURL(uploadedFile);
    setFileUrl(url);
    setFile(uploadedFile);
    setLoading(true);

    try {
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

      const pdf = await pdfjs.getDocument(url).promise;
      setNumPages(pdf.numPages);

      await loadPage(pdf, 1);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPage = async (pdf: any, pageNumber: number) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });

      // Render PDF to canvas (background only)
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      setPdfBackground(canvas.toDataURL());

      // Extract text with positioning
      const textContent = await page.getTextContent();
      const items: TextItem[] = [];

      textContent.items.forEach((item: any, index: number) => {
        if (item.str && item.str.trim()) {
          const transform = item.transform;
          const fontHeight = Math.sqrt(transform[2] * transform[2] + transform[3] * transform[3]);
          
          // Map common PDF fonts to web-safe fonts
          let fontFamily = 'Arial, sans-serif';
          if (item.fontName) {
            const fontLower = item.fontName.toLowerCase();
            if (fontLower.includes('times')) fontFamily = 'Times New Roman, serif';
            else if (fontLower.includes('courier')) fontFamily = 'Courier New, monospace';
            else if (fontLower.includes('helvetica') || fontLower.includes('arial')) fontFamily = 'Arial, sans-serif';
          }

          items.push({
            id: `text-${pageNumber}-${index}`,
            text: item.str,
            x: transform[4],
            y: viewport.height - transform[5] - fontHeight,
            width: item.width,
            height: fontHeight,
            fontName: item.fontName || 'Arial',
            fontSize: fontHeight,
            fontFamily: fontFamily,
            isEditing: false,
            isModified: false,
          });
        }
      });

      setTextItems(items);
    } catch (error) {
      console.error('Error loading page:', error);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedItem(null);
    
    if (fileUrl) {
      const pdf = await pdfjs.getDocument(fileUrl).promise;
      await loadPage(pdf, newPage);
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'text' && mode === 'edit') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newItem: TextItem = {
        id: `new-${Date.now()}`,
        text: 'New Text',
        x,
        y,
        width: 100,
        height: 16,
        fontName: 'Arial',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        isEditing: true,
        isModified: true,
      };

      setTextItems([...textItems, newItem]);
      setSelectedItem(newItem.id);
    } else {
      setSelectedItem(null);
      setTextItems(textItems.map(item => ({ ...item, isEditing: false })));
    }
  };

  const handleTextClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (mode === 'edit' && selectedTool === 'hand') {
      setSelectedItem(itemId);
    }
  };

  const handleTextDoubleClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (mode === 'edit') {
      setTextItems(textItems.map(item =>
        item.id === itemId ? { ...item, isEditing: true } : { ...item, isEditing: false }
      ));
      setSelectedItem(itemId);
    }
  };

  const handleTextChange = (itemId: string, newText: string) => {
    setTextItems(textItems.map(item =>
      item.id === itemId ? { ...item, text: newText, isModified: true } : item
    ));
  };

  const handleTextBlur = (itemId: string) => {
    setTextItems(textItems.map(item =>
      item.id === itemId ? { ...item, isEditing: false } : item
    ));
  };

  const deleteSelectedItem = () => {
    if (selectedItem) {
      setTextItems(textItems.filter(item => item.id !== selectedItem));
      setSelectedItem(null);
    }
  };

  const handleSave = async () => {
    if (!documentId) return;

    setLoading(true);

    try {
      const operations: Array<{
        type: string;
        page: number;
        x?: number;
        y?: number;
        text?: string;
        size?: number;
        color?: [number, number, number];
      }> = [];

      textItems.forEach((item) => {
        if (item.isModified) {
          operations.push({
            type: 'add_text',
            page: currentPage,
            x: item.x,
            y: item.y,
            text: item.text,
            size: item.fontSize,
            color: [0, 0, 0],
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

  const handleReset = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl('');
    setDocumentId('');
    setNumPages(0);
    setCurrentPage(1);
    setResultUrl('');
    setTextItems([]);
    setSelectedItem(null);
    setPdfBackground('');
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
                <p className="text-sm text-gray-600">Add text, images, and annotations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {resultUrl ? (
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload PDF File</h3>
                <p className="text-gray-600 mb-1">Click to select or drag and drop</p>
                <p className="text-sm text-gray-500">Upload a PDF to edit</p>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-80px)]">
          {/* Left Sidebar */}
          <div className="w-24 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-2 space-y-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                    currentPage === pageNum ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="bg-white p-1">
                    <Document file={fileUrl}>
                      <Page pageNumber={pageNum} width={80} renderTextLayer={false} renderAnnotationLayer={false} />
                    </Document>
                  </div>
                  <div className={`text-center text-xs py-1 ${
                    currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-600'
                  }`}>
                    {pageNum}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Editor */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode('annotate')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    mode === 'annotate' ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Pen className="w-4 h-4" />
                  Annotate
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    mode === 'edit' ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  ✏️ Edit
                </button>
              </div>

              {mode === 'edit' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTool('hand')}
                    className={`p-2 rounded-lg ${selectedTool === 'hand' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                    title="Select Tool"
                  >
                    <Hand className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedTool('text')}
                    className={`p-2 rounded-lg ${selectedTool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                    title="Add Text"
                  >
                    <Type className="w-5 h-5" />
                  </button>
                  {selectedItem && (
                    <button onClick={deleteSelectedItem} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto bg-gray-50">
              <div className="flex items-start justify-center p-8">
                <div
                  className="relative bg-white shadow-2xl"
                  onClick={handlePageClick}
                  style={{
                    cursor: selectedTool === 'text' ? 'crosshair' : 'default',
                  }}
                >
                  {/* PDF Background (No Text) */}
                  {pdfBackground && (
                    <img
                      src={pdfBackground}
                      alt="PDF Page"
                      className="block"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    />
                  )}

                  {/* Editable Text Overlays */}
                  {textItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => handleTextClick(e, item.id)}
                      onDoubleClick={(e) => handleTextDoubleClick(e, item.id)}
                      className={`absolute transition-all ${
                        selectedItem === item.id
                          ? 'border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-20'
                          : 'border-2 border-dashed border-transparent hover:border-blue-300 hover:bg-blue-50 hover:bg-opacity-10'
                      } ${item.isModified ? 'bg-yellow-50 bg-opacity-30' : ''}`}
                      style={{
                        left: `${item.x}px`,
                        top: `${item.y}px`,
                        minWidth: `${item.width}px`,
                        minHeight: `${item.height}px`,
                        fontSize: `${item.fontSize}px`,
                        fontFamily: item.fontFamily,
                        lineHeight: `${item.height}px`,
                        cursor: item.isEditing ? 'text' : 'pointer',
                        padding: '0 2px',
                      }}
                      title={item.isEditing ? 'Editing' : 'Click to select, double-click to edit'}
                    >
                      {item.isEditing ? (
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => handleTextChange(item.id, e.target.value)}
                          onBlur={() => handleTextBlur(item.id)}
                          autoFocus
                          className="w-full bg-white bg-opacity-80 outline-none border-none"
                          style={{
                            fontSize: `${item.fontSize}px`,
                            fontFamily: item.fontFamily,
                            lineHeight: `${item.height}px`,
                          }}
                        />
                      ) : (
                        <span className="select-none whitespace-nowrap">{item.text}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-center gap-4">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                ←
              </button>
              <span className="text-sm font-medium">{currentPage} / {numPages}</span>
              <button
                onClick={() => handlePageChange(Math.min(numPages, currentPage + 1))}
                disabled={currentPage === numPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit PDF</h2>
            <p className="text-sm text-gray-600 mb-6">
              Select text to edit, move, or delete the existing content.
            </p>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong><br/>
                • Click to select text<br/>
                • Double-click to edit<br/>
                • Use Text tool to add new text
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={loading || !textItems.some(i => i.isModified)}
              className="w-full px-6 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Modified text appears with yellow background. Font families are preserved from the original PDF.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}