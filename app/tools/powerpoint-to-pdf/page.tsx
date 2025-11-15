'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function PowerPointToPDFTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...uploadedFiles]);
    setError('');
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

        const response = await fetch(`${API_URL}/documents/powerpoint-to-pdf/`, {
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
      setError(err.message || 'Failed to convert presentation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = (docId: string) => {
    window.open(`${API_URL}/documents/${docId}/download/`, '_blank');
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">PowerPoint to PDF</h1>
          <p className="text-gray-600">Convert PPTX files to PDF</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {results.length === 0 ? (
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <input
                type="file"
                accept=".ppt,.pptx"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-orange-300 rounded-xl p-12 cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition"
              >
                <svg className="w-20 h-20 text-orange-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  Select PowerPoint files
                </p>
                <p className="text-sm text-gray-500">.pptx files only</p>
              </label>
            </div>

            {/* Files List */}
            {files.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Files ({files.length})</h3>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-700">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add More Button */}
                <div className="mt-4">
                  <input
                    type="file"
                    accept=".ppt,.pptx"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="add-more-files"
                  />
                  <label
                    htmlFor="add-more-files"
                    className="inline-block px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 cursor-pointer"
                  >
                    + Add more files
                  </label>
                </div>
              </div>
            )}

            {/* Convert Button */}
            {files.length > 0 && (
              <button
                onClick={handleConvert}
                disabled={processing}
                className="w-full bg-orange-600 text-white py-4 rounded-xl text-lg font-bold hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processing ? 'Converting...' : 'Convert to PDF →'}
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 font-medium">Error: {error}</p>
              </div>
            )}
          </div>
        ) : (
          /* Success Screen */
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
                  onClick={() => handleDownload(result.id)}
                  className="w-full bg-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-green-700"
                >
                  Download {files[index].name.replace('.pptx', '.pdf')}
                </button>
              ))}
            </div>

            <button
              onClick={reset}
              className="mt-6 text-orange-600 hover:text-orange-700 font-medium hover:underline"
            >
              Convert more files
            </button>
          </div>
        )}
      </div>
    </div>
  );
}