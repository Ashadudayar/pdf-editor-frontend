'use client';

import { useState } from 'react';
import { Upload, Merge, Download, ArrowLeft, Loader2, X, GripVertical } from 'lucide-react';
import Link from 'next/link';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  uploadedId?: string;
}

export default function MergePage() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [mergedFileUrl, setMergedFileUrl] = useState<string>('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    
    for (const file of uploadedFiles) {
      if (file.type !== 'application/pdf') {
        alert(`${file.name} is not a PDF file`);
        continue;
      }

      const fileObj: PDFFile = {
        id: Math.random().toString(36).substring(7),
        file,
        name: file.name,
      };

      setFiles(prev => [...prev, fileObj]);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8000/api/documents/', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, uploadedId: data.id } : f
        ));
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...files];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);

    setFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please upload at least 2 PDF files');
      return;
    }

    setLoading(true);
    setMergedFileUrl('');

    try {
      const documentIds = files.map(f => f.uploadedId).filter(Boolean);

      if (documentIds.length < 2) {
        alert('Please wait for all files to finish uploading');
        return;
      }

      const response = await fetch(
        'http://localhost:8000/api/documents/merge/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document_ids: documentIds }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Merge failed');
      }

      const data = await response.json();
      console.log('Merge response:', data);
      
      // Use the full URL directly from backend
      setMergedFileUrl(data.merged_file);
      alert('✅ ' + data.message);
    } catch (error) {
      console.error('Merge error:', error);
      alert('❌ Failed to merge PDFs: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (mergedFileUrl) {
      // Open the URL directly - it's already complete from backend
      window.open(mergedFileUrl, '_blank');
    }
  };

  const resetForm = () => {
    setFiles([]);
    setMergedFileUrl('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/tools"
              className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Link>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Merge className="w-10 h-10 text-purple-400" />
              Merge PDFs
            </h1>
            <p className="text-purple-200 mt-2">
              Combine multiple PDF files into one document
            </p>
          </div>
        </div>

        {!mergedFileUrl ? (
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer block text-center"
              >
                <Upload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <p className="text-white text-lg mb-1">
                  Drop PDFs here or click to upload
                </p>
                <p className="text-purple-300 text-sm">
                  Select multiple files (minimum 2)
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-white font-semibold mb-4">
                  Files to Merge ({files.length})
                </h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={file.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className="bg-white/5 rounded-lg p-4 flex items-center gap-3 cursor-move hover:bg-white/10 transition"
                    >
                      <GripVertical className="w-5 h-5 text-purple-400" />
                      <div className="flex-1">
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-purple-300 text-sm">
                          {file.uploadedId ? '✅ Uploaded' : '⏳ Uploading...'}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleMerge}
                  disabled={loading || files.length < 2}
                  className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <Merge className="w-5 h-5" />
                      Merge {files.length} PDFs
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                PDFs Merged Successfully!
              </h3>
              <p className="text-green-200 mb-6">
                Your merged PDF is ready to download
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-600 transition-all inline-flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Merged PDF
                </button>
                <button
                  onClick={resetForm}
                  className="w-full bg-purple-500/30 text-purple-200 px-6 py-2 rounded-lg hover:bg-purple-500/40 transition-all"
                >
                  Merge More PDFs
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mt-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">
            💡 How to Use
          </h3>
          <ul className="space-y-2 text-purple-200 text-sm">
            <li>• Upload 2 or more PDF files</li>
            <li>• Drag files to reorder them</li>
            <li>• Click "Merge PDFs" to combine</li>
            <li>• Download your merged PDF</li>
          </ul>
        </div>
      </div>
    </div>
  );
}