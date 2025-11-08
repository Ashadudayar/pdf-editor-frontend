'use client';

import { useState, useRef } from 'react';
import { Upload, ArrowLeft, Download, Pen, Hand, Type, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Document, Page, pdfjs } from 'react-pdf';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface TextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  isEditing: boolean;
  isNew: boolean;
}

export default function EditPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');
  const [scale, setScale] = useState(1.0);
  
  const [mode, setMode] = useState<'annotate' | 'edit'>('edit');
  const [selectedTool, setSelectedTool] = useState<'hand' | 'text'>('hand');
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement>(null);

  const groupTextIntoBlocks = (items: any[], viewportHeight: number): TextBlock[] => {
    if (items.length === 0) return [];

    const VERTICAL_THRESHOLD = 3;
    const HORIZONTAL_THRESHOLD = 15;

    // Sort by vertical position first, then horizontal
    const sortedItems = [...items].sort((a, b) => {
      const yDiff = Math.abs(a.transform[5] - b.transform[5]);
      if (yDiff < VERTICAL_THRESHOLD) {
        return a.transform[4] - b.transform[4];
      }
      return b.transform[5] - a.transform[5];
    });

    const lines: any[][] = [];
    let currentLine: any[] = [];

    sortedItems.forEach((item, index) => {
      if (item.str.trim()) {
        if (currentLine.length === 0) {
          currentLine.push(item);
        } else {
          const lastItem = currentLine[currentLine.length - 1];
          const yDiff = Math.abs(item.transform[5] - lastItem.transform[5]);

          if (yDiff < VERTICAL_THRESHOLD) {
            currentLine.push(item);
          } else {
            lines.push(currentLine);
            currentLine = [item];
          }
        }
      }
    });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Group lines into blocks based on proximity
    const blocks: TextBlock[] = [];
    let blockId = 0;

    lines.forEach((line, lineIndex) => {
      let currentBlock: any[] = [];

      line.forEach((item, itemIndex) => {
        if (currentBlock.length === 0) {
          currentBlock.push(item);
        } else {
          const lastItem = currentBlock[currentBlock.length - 1];
          const horizontalGap = item.transform[4] - (lastItem.transform[4] + lastItem.width);

          if (horizontalGap < HORIZONTAL_THRESHOLD) {
            currentBlock.push(item);
          } else {
            // Save current block
            blocks.push(createBlockFromItems(currentBlock, viewportHeight, `block-${blockId++}`));
            currentBlock = [item];
          }
        }
      });

      if (currentBlock.length > 0) {
        blocks.push(createBlockFromItems(currentBlock, viewportHeight, `block-${blockId++}`));
      }
    });

    return blocks;
  };

  const createBlockFromItems = (items: any[], viewportHeight: number, id: string): TextBlock => {
    const texts = items.map(item => item.str).join(' ');
    const minX = Math.min(...items.map(item => item.transform[4]));
    const maxX = Math.max(...items.map(item => item.transform[4] + item.width));
    const minY = Math.min(...items.map(item => item.transform[5]));
    const maxY = Math.max(...items.map(item => item.transform[5] + item.height));
    const avgFontSize = items.reduce((sum, item) => sum + item.height, 0) / items.length;

    return {
      id,
      text: texts,
      x: minX,
      y: viewportHeight - maxY,
      width: maxX - minX,
      height: maxY - minY,
      fontSize: avgFontSize,
      isEditing: false,
      isNew: false,
    };
  };

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

      await loadPageText(pdf, 1);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPageText = async (pdf: any, pageNumber: number) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const textContent = await page.getTextContent();

      const blocks = groupTextIntoBlocks(textContent.items, viewport.height);
      setTextBlocks(blocks);
    } catch (error) {
      console.error('Error loading text:', error);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedBlock(null);
    
    if (fileUrl) {
      const pdf = await pdfjs.getDocument(fileUrl).promise;
      await loadPageText(pdf, newPage);
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool === 'text' && mode === 'edit') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newBlock: TextBlock = {
        id: `new-${Date.now()}`,
        text: 'Double-click to edit',
        x,
        y,
        width: 150,
        height: 30,
        fontSize: 14,
        isEditing: false,
        isNew: true,
      };

      setTextBlocks([...textBlocks, newBlock]);
      setSelectedBlock(newBlock.id);
    }
  };

  const handleBlockClick = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    if (mode === 'edit') {
      setSelectedBlock(blockId);
    }
  };

  const handleBlockDoubleClick = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    if (mode === 'edit') {
      setTextBlocks(textBlocks.map(block =>
        block.id === blockId ? { ...block, isEditing: true } : { ...block, isEditing: false }
      ));
      setSelectedBlock(blockId);
    }
  };

  const handleTextChange = (blockId: string, newText: string) => {
    setTextBlocks(textBlocks.map(block =>
      block.id === blockId ? { ...block, text: newText } : block
    ));
  };

  const handleTextBlur = (blockId: string) => {
    setTextBlocks(textBlocks.map(block =>
      block.id === blockId ? { ...block, isEditing: false } : block
    ));
  };

  const deleteSelectedBlock = () => {
    if (selectedBlock) {
      setTextBlocks(textBlocks.filter(block => block.id !== selectedBlock));
      setSelectedBlock(null);
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

      textBlocks.forEach((block) => {
        if (block.isNew) {
          operations.push({
            type: 'add_text',
            page: currentPage,
            x: block.x,
            y: block.y,
            text: block.text,
            size: block.fontSize,
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
    setTextBlocks([]);
    setSelectedBlock(null);
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
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Hand className="w-5 h-5" />
                </button>
              </div>

              {mode === 'edit' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTool('hand')}
                    className={`p-2 rounded-lg ${selectedTool === 'hand' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                  >
                    <Hand className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedTool('text')}
                    className={`p-2 rounded-lg ${selectedTool === 'text' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                  >
                    <Type className="w-5 h-5" />
                  </button>
                  {selectedBlock && (
                    <button onClick={deleteSelectedBlock} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-auto bg-gray-50">
              <div className="flex items-start justify-center p-8">
                <div ref={pageRef} className="bg-white shadow-2xl relative" onClick={handlePageClick}>
                  <Document file={fileUrl}>
                    <Page pageNumber={currentPage} scale={1.5} renderTextLayer={false} renderAnnotationLayer={false} />
                  </Document>

                  {/* Text Block Overlays */}
                  {textBlocks.map((block) => (
                    <div
                      key={block.id}
                      onClick={(e) => handleBlockClick(e, block.id)}
                      onDoubleClick={(e) => handleBlockDoubleClick(e, block.id)}
                      className={`absolute cursor-pointer transition-all ${
                        selectedBlock === block.id 
                          ? 'border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-30' 
                          : 'border-2 border-dashed border-transparent hover:border-blue-300 hover:bg-blue-50 hover:bg-opacity-20'
                      } ${block.isNew ? 'border-green-500 bg-green-50 bg-opacity-30' : ''}`}
                      style={{
                        left: `${block.x}px`,
                        top: `${block.y}px`,
                        minWidth: `${block.width}px`,
                        minHeight: `${block.height}px`,
                        padding: '4px',
                      }}
                      title="Click to select, double-click to edit"
                    >
                      {block.isEditing ? (
                        <textarea
                          value={block.text}
                          onChange={(e) => handleTextChange(block.id, e.target.value)}
                          onBlur={() => handleTextBlur(block.id)}
                          autoFocus
                          className="w-full h-full bg-white bg-opacity-90 outline-none border-none resize-none"
                          style={{ fontSize: `${block.fontSize}px`, lineHeight: '1.2' }}
                        />
                      ) : (
                        <div
                          className="select-none whitespace-pre-wrap"
                          style={{ fontSize: `${block.fontSize}px`, lineHeight: '1.2' }}
                        >
                          {block.text}
                        </div>
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
              <div className="w-px h-6 bg-gray-300 mx-2" />
              <button onClick={() => setScale(Math.max(0.5, scale - 0.1))} className="p-2 rounded-lg hover:bg-gray-100">-</button>
              <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(Math.min(2, scale + 0.1))} className="p-2 rounded-lg hover:bg-gray-100">+</button>
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
                💡 <strong>Tip:</strong> Click to select a text block, double-click to edit it.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="w-full h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg"></div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading || textBlocks.filter(i => i.isNew).length === 0}
              className="w-full px-6 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Edit PDF →'
              )}
            </button>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ The Content Editor does not currently support Right-to-Left (RTL) languages.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}