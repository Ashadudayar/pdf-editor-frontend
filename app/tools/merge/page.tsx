'use client';

import { useState } from 'react';
import { Upload, Download, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface UploadedFile {
  id: string;
  title: string;
  file: File;
}

export default function MergePDFTool() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergedDocId, setMergedDocId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    
    if (uploadedFiles.length === 0) return;

    setUploading(true);
    setError('');

    for (const file of uploadedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/documents/`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        
        setFiles(prev => [...prev, {
          id: data.id,
          title: data.title,
          file: file
        }]);
      } catch (err) {
        setError(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please upload at least 2 PDFs to merge');
      return;
    }

    setMerging(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/documents/merge/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_ids: files.map(f => f.id)
        }),
      });

      if (!response.ok) throw new Error('Merge failed');

      const data = await response.json();
      setMergedDocId(data.id);
    } catch (err) {
      setError('Failed to merge PDFs');
    } finally {
      setMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedDocId) return;
    window.open(`${API_URL}/documents/${mergedDocId}/download/`, '_blank');
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setMergedDocId(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
    setFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
    setFiles(newFiles);
  };

  const reset = () => {
    setFiles([]);
    setMergedDocId(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Merge PDFs</h1>
          <p className="text-gray-600">Combine multiple PDF files into one document</p>
        </div>

        {/* Upload Area */}
        {!mergedDocId && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-12 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <Upload className="w-16 h-16 text-blue-500 mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                {uploading ? 'Uploading...' : 'Upload PDF Files'}
              </p>
              <p className="text-sm text-gray-500">Click to select or drag and drop</p>
              <p className="text-xs text-gray-400 mt-2">Upload 2 or more PDF files</p>
            </label>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Uploaded Files List */}
        {files.length > 0 && !mergedDocId && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Uploaded Files ({files.length})</h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-lg font-bold text-gray-400">{index + 1}</span>
                    <span className="text-gray-700">{file.title}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-2 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === files.length - 1}
                      className="p-2 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Merge Button */}
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || merging}
              className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {merging ? 'Merging PDFs...' : `Merge ${files.length} PDFs`}
            </button>
          </div>
        )}

        {/* Success & Download */}
        {mergedDocId && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">PDFs Merged Successfully!</h3>
            <p className="text-gray-600 mb-6">Your {files.length} PDFs have been combined into one file</p>
            
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download Merged PDF
            </button>

            {/* Start Over Button */}
            <div>
              <button
                onClick={reset}
                className="text-blue-600 hover:underline"
              >
                Merge More PDFs
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {files.length === 0 && !mergedDocId && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">How to Merge PDFs</h3>
            <ol className="space-y-2 text-gray-600">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">1.</span>
                <span>Upload 2 or more PDF files</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">2.</span>
                <span>Arrange files in the order you want (use arrows)</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">3.</span>
                <span>Click "Merge PDFs" button</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">4.</span>
                <span>Download your merged PDF file</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}