'use client';

import { useState } from 'react';
import { Upload, Download, FileText, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function WordToPDFTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...uploadedFiles]);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.docx') || file.name.endsWith('.doc')
    );
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setError('');
    setResults([]);

    try {
      const conversions = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/documents/word-to-pdf/`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Conversion failed');
        }

        return response.json();
      });

      const convertedResults = await Promise.all(conversions);
      setResults(convertedResults);
    } catch (err: any) {
      setError(err.message || 'Failed to convert document');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = (docId: string, filename: string) => {
    window.open(`${API_URL}/documents/${docId}/download/`, '_blank');
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-red-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Word to PDF</h1>
              <p className="text-sm text-gray-500">Convert DOCX files to PDF</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {results.length === 0 ? (
          <div className="space-y-6">
            {/* Upload Area */}
            {files.length === 0 ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="bg-white rounded-2xl shadow-lg p-12"
              >
                <input
                  type="file"
                  accept=".doc,.docx"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-16 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Upload className="w-20 h-20 text-blue-500 mb-4" />
                  <p className="text-xl font-semibold text-gray-700 mb-2">
                    Select Word files
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or drop Word files here</p>
                  <p className="text-xs text-gray-400">.docx files only</p>
                </label>
              </div>
            ) : (
              <>
                {/* Files Preview */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">
                    Files ({files.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="relative group bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 transition"
                      >
                        <div className="flex flex-col items-center">
                          {/* Word Icon */}
                          <div className="w-16 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-3 relative">
                            <FileText className="w-10 h-10 text-white" />
                            <div className="absolute -top-1 -right-1 bg-blue-700 text-white text-xs font-bold px-2 py-0.5 rounded">
                              DOCX
                            </div>
                          </div>
                          
                          <p className="text-sm font-medium text-gray-700 text-center truncate w-full">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* File number badge */}
                        <div className="absolute -top-2 -left-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add More Button */}
                  <div className="mt-6">
                    <input
                      type="file"
                      accept=".doc,.docx"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="add-more-files"
                    />
                    <label
                      htmlFor="add-more-files"
                      className="inline-flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 cursor-pointer transition"
                    >
                      <Upload className="w-5 h-5" />
                      <span className="font-medium">Add more files</span>
                    </label>
                  </div>
                </div>

                {/* Convert Button */}
                <button
                  onClick={handleConvert}
                  disabled={processing}
                  className="w-full bg-red-600 text-white py-5 rounded-xl text-lg font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
                >
                  {processing ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <span>Convert to PDF</span>
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 font-medium">Failed to convert document</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}
          </div>
        ) : (
          /* Success Screen */
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Conversion Complete!
              </h3>
              <p className="text-gray-600 mb-6">
                Your {files.length} file{files.length > 1 ? 's have' : ' has'} been converted to PDF
              </p>

              {/* Download Buttons */}
              <div className="space-y-3 max-w-md mx-auto">
                {results.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleDownload(result.id, files[index].name)}
                    className="w-full inline-flex items-center justify-center gap-3 bg-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-green-700 transition"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download {files[index].name.replace('.docx', '.pdf')}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={reset}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Convert more files
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}