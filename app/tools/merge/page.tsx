'use client';

import { useState, useRef } from 'react';
import { Upload, ArrowLeft, Download, Trash2, GripVertical } from 'lucide-react';
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
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Dynamic import to avoid SSR issues
const PDFPreview = dynamic(() => import('@/components/PDFPreview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
});

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
}

function SortableItem({ file, onRemove, index }: { file: UploadedFile; onRemove: () => void; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative bg-white rounded-xl border-2 p-3 cursor-grab active:cursor-grabbing transition-all flex-shrink-0
        ${isDragging ? 'border-blue-500 shadow-2xl opacity-50' : 'border-gray-200 hover:border-blue-400 hover:shadow-lg'}`}
    >
      {/* Order Badge */}
      <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-10">
        {index + 1}
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg z-10"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* PDF Preview - Only render when NOT dragging */}
      <div className="w-44 h-56 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 mb-3">
        {!isDragging ? (
          <PDFPreview file={file.file} width={176} height={224} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="space-y-1 px-1">
        <p className="font-medium text-gray-900 truncate text-sm" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-gray-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      {/* Drag Indicator (shows on hover when NOT dragging) */}
      {!isDragging && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-5 rounded-xl pointer-events-none">
          <GripVertical className="w-8 h-8 text-gray-600" />
        </div>
      )}
    </div>
  );
}

// Simple drag overlay without PDF rendering
function DragOverlayCard({ name }: { name: string }) {
  return (
    <div className="bg-white rounded-xl border-2 border-blue-500 p-3 shadow-2xl opacity-90 flex-shrink-0">
      <div className="w-44 h-56 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mb-3 border-2 border-blue-300">
        <div className="text-center">
          <GripVertical className="w-12 h-12 text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-blue-600 font-medium">Moving...</p>
        </div>
      </div>
      <p className="font-medium text-gray-900 truncate text-sm px-1">{name}</p>
    </div>
  );
}

export default function MergePDFPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    
    const newFiles: UploadedFile[] = uploadedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please upload at least 2 PDF files');
      return;
    }

    setLoading(true);

    try {
      // Upload files in order
      const uploadedDocs = [];
      
      for (const fileItem of files) {
        const formData = new FormData();
        formData.append('file', fileItem.file);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api'}/documents/`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        uploadedDocs.push(data.id);
      }

      // Merge PDFs
      const mergeResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api'}/documents/merge/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            document_ids: uploadedDocs,
          }),
        }
      );

      if (!mergeResponse.ok) {
        throw new Error('Merge failed');
      }

      const mergeData = await mergeResponse.json();
      
      if (mergeData.merged_file) {
        setMergedUrl(mergeData.merged_file);
      }
    } catch (error) {
      console.error('Merge failed:', error);
      alert('Failed to merge PDFs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (mergedUrl) {
      const link = document.createElement('a');
      link.href = mergedUrl;
      link.download = 'merged.pdf';
      link.click();
    }
  };

  const handleReset = () => {
    setFiles([]);
    setMergedUrl('');
  };

  const activeFile = files.find((file) => file.id === activeId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Merge PDFs</h1>
                <p className="text-sm text-gray-600">
                  Combine multiple PDF files into one document
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {mergedUrl ? (
          // Success State
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12 mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                PDFs Merged Successfully!
              </h2>
              <p className="text-gray-600 mb-8">
                Your {files.length} PDF files have been combined into one document
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleDownload}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Merged PDF
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Merge Another
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Upload/Merge State
          <>
            {/* Upload Area */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Upload PDF Files
                  </h3>
                  <p className="text-gray-600 mb-1">
                    Click to select or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    Upload 2 or more PDF files
                  </p>
                </label>
              </div>
            </div>

            {/* Uploaded Files List */}
            {files.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Uploaded Files ({files.length})
                  </h3>
                  <p className="text-sm text-gray-600">
                    Drag and drop to reorder • Click ✕ to remove
                  </p>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <SortableContext
                    items={files.map((f) => f.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    <div className="flex gap-4 overflow-x-auto pb-4 px-1">
                      {files.map((file, index) => (
                        <SortableItem
                          key={file.id}
                          file={file}
                          index={index}
                          onRemove={() => removeFile(file.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeFile ? (
                      <DragOverlayCard name={activeFile.name} />
                    ) : null}
                  </DragOverlay>
                </DndContext>

                {/* Merge Button */}
                <button
                  onClick={handleMerge}
                  disabled={loading || files.length < 2}
                  className="w-full mt-6 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Merging PDFs...
                    </span>
                  ) : (
                    `Merge ${files.length} PDFs`
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <GripVertical className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Drag Anywhere</h3>
            <p className="text-sm text-gray-600">
              Click and drag any card to reorder
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">100% Secure</h3>
            <p className="text-sm text-gray-600">
              Files are deleted after 24 hours automatically
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No Limits</h3>
            <p className="text-sm text-gray-600">
              Merge unlimited PDF files for free
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}