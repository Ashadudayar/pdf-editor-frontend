'use client';

import { useState, useRef } from 'react';
import { Upload, ArrowLeft, Download, RotateCcw, Plus, ArrowUpDown, X } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Dynamic import PDF preview
const PDFPreview = dynamic(() => import('@/components/PDFPreview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
});

interface PageItem {
  id: string;
  pageNumber: number;
  originalPageNumber: number;
  fileIndex: number; // Track which file this page belongs to
}

interface UploadedFile {
  file: File;
  documentId: string;
  fileName: string;
  pageCount: number;
}

function SortablePageItem({ page, files }: { page: PageItem; files: UploadedFile[] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const currentFile = files[page.fileIndex];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-move rounded-xl border-2 border-red-300 p-3 bg-white hover:shadow-lg transition-all ${
        isDragging ? 'shadow-2xl z-50' : ''
      }`}
    >
      {/* PDF Preview */}
      <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-2">
        {currentFile && (
          <PDFPreview
            file={currentFile.file}
            width={150}
            height={200}
            pageNumber={page.originalPageNumber}
          />
        )}
      </div>

      {/* Page Number */}
      <p className="text-center text-sm font-medium text-gray-900">
        {page.pageNumber}
      </p>
    </div>
  );
}

export default function OrganizePDFPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setLoading(true);

    try {
      const newFiles: UploadedFile[] = [];
      const newPages: PageItem[] = [...pages];
      let currentPageNumber = pages.length + 1;

      for (let i = 0; i < uploadedFiles.length; i++) {
        const uploadedFile = uploadedFiles[i];

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

        // Get page count from PDF
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        
        const pdf = await pdfjs.getDocument(URL.createObjectURL(uploadedFile)).promise;
        const pageCount = pdf.numPages;

        const fileIndex = files.length + newFiles.length;

        newFiles.push({
          file: uploadedFile,
          documentId: data.id,
          fileName: uploadedFile.name,
          pageCount: pageCount,
        });

        // Add pages from this file
        for (let j = 1; j <= pageCount; j++) {
          newPages.push({
            id: `file-${fileIndex}-page-${j}`,
            pageNumber: currentPageNumber++,
            originalPageNumber: j,
            fileIndex: fileIndex,
          });
        }
      }

      setFiles([...files, ...newFiles]);
      setPages(newPages);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newArray = arrayMove(items, oldIndex, newIndex);
        
        // Update page numbers based on new order
        return newArray.map((item, index) => ({
          ...item,
          pageNumber: index + 1,
        }));
      });
    }
  };

  const handleReset = () => {
    // Reset to original order
    const sortedPages = [...pages].sort((a, b) => {
      if (a.fileIndex !== b.fileIndex) {
        return a.fileIndex - b.fileIndex;
      }
      return a.originalPageNumber - b.originalPageNumber;
    });

    setPages(sortedPages.map((item, index) => ({
      ...item,
      pageNumber: index + 1,
    })));
  };

  const handleReverse = () => {
    setPages((prev) =>
      [...prev].reverse().map((item, index) => ({
        ...item,
        pageNumber: index + 1,
      }))
    );
  };

  const removeFile = (fileIndex: number) => {
    // Remove all pages from this file
    const remainingPages = pages
      .filter(page => page.fileIndex !== fileIndex)
      .map((page, index) => ({
        ...page,
        pageNumber: index + 1,
        fileIndex: page.fileIndex > fileIndex ? page.fileIndex - 1 : page.fileIndex,
      }));

    const remainingFiles = files.filter((_, index) => index !== fileIndex);

    setPages(remainingPages);
    setFiles(remainingFiles);
  };

  const handleOrganize = async () => {
    if (files.length === 0) return;

    setLoading(true);

    try {
      // If only one file, use organize endpoint
      if (files.length === 1) {
        const pageOrder = pages.map((page) => page.originalPageNumber);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api'}/documents/${files[0].documentId}/organize/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page_order: pageOrder }),
          }
        );

        if (!response.ok) throw new Error('Organize failed');

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
      } else {
        // Multiple files - merge in the new order
        const documentIds = pages.map(page => files[page.fileIndex].documentId);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api'}/documents/merge/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document_ids: documentIds }),
          }
        );

        if (!response.ok) throw new Error('Merge failed');

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
      }
    } catch (error) {
      console.error('Organize failed:', error);
      alert('Failed to organize pages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = () => {
    setFiles([]);
    setPages([]);
    setResultUrl('');
  };

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = 'organized.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const totalPages = pages.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Organize PDF</h1>
                <p className="text-sm text-gray-600">
                  Drag and drop pages to reorder
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {resultUrl ? (
          // Success State
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12 mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                PDF Organized Successfully!
              </h2>
              <p className="text-gray-600 mb-8">
                Your pages have been reordered
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
                  onClick={handleResetAll}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Organize Another PDF
                </button>
              </div>
            </div>
          </div>
        ) : files.length === 0 ? (
          // Upload State
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-orange-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
                multiple
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload PDF File(s)
                </h3>
                <p className="text-gray-600 mb-1">Click to select or drag and drop</p>
                <p className="text-sm text-gray-500">Upload PDF(s) to organize pages</p>
              </label>
            </div>
          </div>
        ) : (
          // Organize State
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Side - Pages Grid */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Drag pages to reorder
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                    <button
                      onClick={handleReverse}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      Reverse
                    </button>
                  </div>
                </div>

                {/* Drag and Drop Grid */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pages.map((p) => p.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {pages.map((page) => (
                        <SortablePageItem key={page.id} page={page} files={files} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* File Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Files:</h3>
                  <button
                    onClick={handleResetAll}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Reset all
                  </button>
                </div>
                
                {/* File List */}
                <div className="space-y-2 mb-4">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-red-50 rounded-lg group">
                      <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-900 truncate flex-1">{file.fileName}</p>
                      <button
                        onClick={() => removeFile(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Files Button */}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="add-files"
                  ref={fileInputRef}
                  multiple
                />
                <label
                  htmlFor="add-files"
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-gray-700 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">Add more files</span>
                </label>
              </div>

              {/* Organize Button */}
              <button
                onClick={handleOrganize}
                disabled={loading}
                className="w-full px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Organizing...
                  </>
                ) : (
                  <>
                    Organize
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Drag & Drop</h3>
            <p className="text-sm text-gray-600">
              Easy reordering with drag and drop
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Multiple Files</h3>
            <p className="text-sm text-gray-600">
              Add and organize multiple PDFs
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Instant Download</h3>
            <p className="text-sm text-gray-600">
              Get your organized PDF immediately
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}