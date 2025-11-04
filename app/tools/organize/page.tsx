'use client';

import { useState } from 'react';
import { Upload, Download, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function OrganizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setDocumentId(data.id);

      // Get page count
      const countResponse = await fetch(`${API_URL}/documents/${data.id}/page_count/`);
      const countData = await countResponse.json();
      const count = countData.page_count;
      setPageCount(count);
      setPageOrder(Array.from({ length: count }, (_, i) => i + 1));
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...pageOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setPageOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === pageOrder.length - 1) return;
    const newOrder = [...pageOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setPageOrder(newOrder);
  };

  const removePage = (index: number) => {
    setPageOrder(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    setProcessing(true);

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/organize/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_order: pageOrder }),
      });

      const data = await response.json();
      setResultId(data.id);
    } catch (err) {
      alert('Failed to organize pages');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultId) return;
    window.open(`${API_URL}/documents/${resultId}/download/`, '_blank');
  };

  const reset = () => {
    setFile(null);
    setDocumentId('');
    setPageOrder([]);
    setResultId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Organize PDF Pages</h1>
          <p className="text-gray-600">Reorder, remove, or rearrange pages</p>
        </div>

        {!resultId ? (
          <div className="space-y-6">
            {!documentId && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
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
                    {uploading ? 'Uploading...' : 'Upload PDF File'}
                  </p>
                </label>
              </div>
            )}

            {pageOrder.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Pages ({pageOrder.length})</h3>
                <div className="space-y-2 mb-6">
                  {pageOrder.map((pageNum, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                    >
                      <span className="font-semibold">Page {pageNum}</span>
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
                          disabled={index === pageOrder.length - 1}
                          className="p-2 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removePage(index)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleProcess}
                  disabled={processing || pageOrder.length === 0}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition"
                >
                  {processing ? 'Processing...' : 'Organize Pages'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Pages Organized!</h3>
            <p className="text-gray-600 mb-6">Your PDF has been reorganized</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>

            <div>
              <button onClick={reset} className="text-blue-600 hover:underline">
                Organize Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}