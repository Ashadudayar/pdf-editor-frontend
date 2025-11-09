'use client';

import { useState } from 'react';
import { Upload, ArrowLeft, Download, Pen, Save } from 'lucide-react';
import Link from 'next/link';
import { pdfjs } from 'react-pdf';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface TextBlock {
  id: string;
  text: string;
  originalText: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
  
  const [editMode, setEditMode] = useState<boolean>(false);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const [scale] = useState<number>(1.5);

  // Render page WITHOUT text to canvas
  const renderPageWithoutText = async (page: any): Promise<string> => {
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Fill white background
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Render page
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Extract text content to know where to paint white rectangles
    const textContent = await page.getTextContent();
    
    // Paint white rectangles over all text positions
    context.fillStyle = 'white';
    textContent.items.forEach((item: any) => {
      if (item.str && item.str.trim()) {
        const tx = item.transform;
        const x = tx[4];
        const y = viewport.height - tx[5];
        const height = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
        
        // Paint white rectangle with extra padding to ensure full coverage
        context.fillRect(x - 2, y - height - 2, item.width + 4, height + 4);
      }
    });

    return canvas.toDataURL('image/png');
  };

  // Extract text blocks with exact positions
  const extractTextBlocks = async (page: any): Promise<TextBlock[]> => {
    const viewport = page.getViewport({ scale });
    const textContent = await page.getTextContent();
    
    const blocks: TextBlock[] = [];
    const items = textContent.items;

    // Group text items into blocks
    const VERTICAL_THRESHOLD = 5;
    const HORIZONTAL_GAP = 15;

    const sortedItems = [...items].sort((a: any, b: any) => {
      const yDiff = Math.abs(a.transform[5] - b.transform[5]);
      if (yDiff < VERTICAL_THRESHOLD) {
        return a.transform[4] - b.transform[4];
      }
      return b.transform[5] - a.transform[5];
    });

    // Group into lines
    const lines: any[][] = [];
    let currentLine: any[] = [];

    sortedItems.forEach((item: any) => {
      if (!item.str || !item.str.trim()) return;

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
    });

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Group lines into blocks
    let blockId = 0;

    lines.forEach((line) => {
      let currentBlock: any[] = [];

      line.forEach((item: any) => {
        if (currentBlock.length === 0) {
          currentBlock.push(item);
        } else {
          const lastItem = currentBlock[currentBlock.length - 1];
          const gap = item.transform[4] - (lastItem.transform[4] + lastItem.width);

          if (gap < HORIZONTAL_GAP) {
            currentBlock.push(item);
          } else {
            blocks.push(createBlockFromItems(currentBlock, viewport, `block-${currentPage}-${blockId++}`));
            currentBlock = [item];
          }
        }
      });

      if (currentBlock.length > 0) {
        blocks.push(createBlockFromItems(currentBlock, viewport, `block-${currentPage}-${blockId++}`));
      }
    });

    return blocks;
  };

  const createBlockFromItems = (items: any[], viewport: any, id: string): TextBlock => {
    const text = items.map(item => item.str).join(' ');
    
    const minX = Math.min(...items.map(item => item.transform[4]));
    const maxX = Math.max(...items.map(item => item.transform[4] + item.width));
    const minY = Math.min(...items.map(item => item.transform[5]));
    const maxY = Math.max(...items.map(item => item.transform[5] + item.height));
    
    const fontSize = items[0].height;
    
    let fontFamily = 'Arial, sans-serif';
    if (items[0].fontName) {
      const fn = items[0].fontName.toLowerCase();
      if (fn.includes('times')) fontFamily = 'Times New Roman, serif';
      else if (fn.includes('courier')) fontFamily = 'Courier New, monospace';
      else if (fn.includes('helvetica')) fontFamily = 'Helvetica, Arial, sans-serif';
    }

    return {
      id,
      text,
      originalText: text,
      x: minX,
      y: viewport.height - maxY,
      width: maxX - minX,
      height: maxY - minY,
      fontSize,
      fontFamily,
      isEditing: false,
      isModified: false,
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

      // Generate thumbnails
      const thumbs: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const thumb = await renderPageWithoutText(page);
        thumbs.push(thumb);
      }
      setPageThumbnails(thumbs);

      await loadPage(pdf, 1);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      setPageWidth(viewport.width);
      setPageHeight(viewport.height);

      // Render background without text
      const bg = await renderPageWithoutText(page);
      setBackgroundImage(bg);

      // Extract text blocks
      const blocks = await extractTextBlocks(page);
      setTextBlocks(blocks);
    } catch (error) {
      console.error('Error loading page:', error);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedBlock(null);
    setEditMode(false);
    
    if (fileUrl) {
      const pdf = await pdfjs.getDocument(fileUrl).promise;
      await loadPage(pdf, newPage);
    }
  };

  const handleBlockClick = (e: React.MouseEvent, blockId: string) => {
    if (!editMode) return;
    e.stopPropagation();
    setSelectedBlock(blockId);
  };

  const handleBlockDoubleClick = (e: React.MouseEvent, blockId: string) => {
    if (!editMode) return;
    e.stopPropagation();
    setTextBlocks(textBlocks.map(block =>
      block.id === blockId ? { ...block, isEditing: true } : { ...block, isEditing: false }
    ));
    setSelectedBlock(blockId);
  };

  const handleTextChange = (blockId: string, newText: string) => {
    setTextBlocks(textBlocks.map(block =>
      block.id === blockId ? { ...block, text: newText, isModified: newText !== block.originalText } : block
    ));
  };

  const handleTextBlur = (blockId: string) => {
    setTextBlocks(textBlocks.map(block =>
      block.id === blockId ? { ...block, isEditing: false } : block
    ));
  };

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
          x: block.x / scale,
          y: block.y / scale,
          width: block.width / scale,
          height: block.height / scale,
        },
        font_size: block.fontSize / scale,
        font_family: block.fontFamily,
      }));

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
    setEditMode(false);
    setBackgroundImage('');
    setPageThumbnails([]);
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
                <p className="text-sm text-gray-600">Click Edit, then double-click text blocks to edit</p>
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
              {pageThumbnails.map((thumb, index) => {
                const pageNum = index + 1;
                return (
                  <div
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                      currentPage === pageNum ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <img src={thumb} alt={`Page ${pageNum}`} className="w-full" />
                    <div className={`text-center text-xs py-1 ${
                      currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {pageNum}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Editor */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                    editMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Pen className="w-4 h-4" />
                  {editMode ? 'Editing...' : 'Edit'}
                </button>
                
                <span className="text-sm text-gray-600">
                  {editMode ? 'Double-click text blocks to edit' : 'Click Edit to start'}
                </span>
              </div>

              {editMode && textBlocks.some(b => b.isModified) && (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
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

            {/* PDF Viewer - Recreated Page */}
            <div className="flex-1 overflow-auto bg-gray-50 p-8">
              <div className="flex justify-center">
                <div
                  className="relative bg-white shadow-2xl"
                  style={{
                    width: pageWidth,
                    height: pageHeight,
                  }}
                >
                  {/* Background Image - PDF with text removed */}
                  {backgroundImage && (
                    <img
                      src={backgroundImage}
                      alt="PDF Background"
                      className="absolute top-0 left-0 w-full h-full pointer-events-none select-none"
                      draggable={false}
                    />
                  )}

                  {/* Text Overlays - Recreate ALL text as HTML */}
                  {textBlocks.map((block) => (
                    <div
                      key={block.id}
                      onClick={(e) => handleBlockClick(e, block.id)}
                      onDoubleClick={(e) => handleBlockDoubleClick(e, block.id)}
                      className={`absolute transition-all ${
                        editMode ? 'cursor-pointer' : ''
                      } ${
                        block.isEditing
                          ? 'z-50 bg-white border-2 border-blue-500 shadow-lg'
                          : editMode && selectedBlock === block.id
                          ? 'border-2 border-dashed border-blue-500 bg-blue-50 bg-opacity-20'
                          : editMode
                          ? 'border-2 border-dashed border-transparent hover:border-blue-400 hover:bg-blue-50 hover:bg-opacity-10'
                          : ''
                      } ${block.isModified && editMode ? 'bg-yellow-100 bg-opacity-40' : ''}`}
                      style={{
                        left: `${block.x}px`,
                        top: `${block.y}px`,
                        minWidth: `${block.width}px`,
                        minHeight: `${block.height}px`,
                        padding: '2px',
                      }}
                      title={editMode ? "Double-click to edit" : ""}
                    >
                      {block.isEditing ? (
                        <textarea
                          value={block.text}
                          onChange={(e) => handleTextChange(block.id, e.target.value)}
                          onBlur={() => handleTextBlur(block.id)}
                          autoFocus
                          className="w-full h-full bg-transparent border-none outline-none resize-none p-0"
                          style={{
                            fontSize: `${block.fontSize}px`,
                            fontFamily: block.fontFamily,
                            lineHeight: '1',
                            color: '#000',
                          }}
                        />
                      ) : (
                        <div
                          className="whitespace-nowrap"
                          style={{
                            fontSize: `${block.fontSize}px`,
                            fontFamily: block.fontFamily,
                            lineHeight: '1',
                            color: '#000',
                          }}
                        >
                          {block.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Nav */}
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
          <div className="w-80 bg-white border-l border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit PDF</h2>
            <p className="text-sm text-gray-600 mb-6">
              Text is grouped into blocks for easy editing.
            </p>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">💡 How to edit:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Click "Edit" button</li>
                <li>Hover to see blocks</li>
                <li>Double-click to edit</li>
                <li>Click Save</li>
              </ol>
            </div>

            {textBlocks.filter(b => b.isModified).length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  📝 {textBlocks.filter(b => b.isModified).length} block(s) modified
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}