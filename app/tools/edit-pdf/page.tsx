'use client';

import { useState } from 'react';
import { Edit, Upload, Download, Type, Highlighter, Trash2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function EditPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [editMode, setEditMode] = useState<'add_text' | 'highlight' | 'delete'>('add_text');
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [x, setX] = useState(100);
  const [y, setY] = useState(100);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setDocumentId(data.id);
    } catch (err) {
      setError('Upload failed');
    }
  };

  const handleEdit = async () => {
    if (!documentId) return;

    setProcessing(true);
    setError('');

    const operations = [];

    if (editMode === 'add_text' && text) {
      operations.push({
        type: 'add_text',
        page,
        x,
        y,
        text,
        size: 12,
        color: [0, 0, 0]
      });
    } else if (editMode === 'highlight' && text) {
      operations.push({
        type: 'highlight_text',
        page,
        text,
        color: [1, 1, 0]
      });
    }

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/edit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations }),
      });

      if (!response.ok) throw new Error('Edit failed');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to edit PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.download_url) return;
    window.open(`${API_URL.replace('/api', '')}${result.download_url}`, '_blank');
  };

  const reset = () => {
    setFile(null);
    setDocumentId('');
    setResult(null);
    setError('');
    setText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Edit className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit PDF</h1>
          <p className="text-gray-600">Add text, highlight, and edit your PDF</p>
        </div>

        {!result ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 rounded-xl p-12 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <Upload className="w-16 h-16 text-indigo-500 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {file ? file.name : 'Upload PDF'}
                </p>
                <p className="text-sm text-gray-500">PDF files only</p>
              </label>
            </div>

            {file && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold mb-4">Edit Options</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <button
                    onClick={() => setEditMode('add_text')}
                    className={`p-4 rounded-lg border-2 transition ${
                      editMode === 'add_text'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <Type className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Add Text</p>
                  </button>
                  
                  <button
                    onClick={() => setEditMode('highlight')}
                    className={`p-4 rounded-lg border-2 transition ${
                      editMode === 'highlight'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <Highlighter className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Highlight</p>
                  </button>
                  
                  <button
                    onClick={() => setEditMode('delete')}
                    className={`p-4 rounded-lg border-2 transition ${
                      editMode === 'delete'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <Trash2 className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Delete</p>
                  </button>
                </div>

                {editMode === 'add_text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Text to Add</label>
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text..."
                        className="w-full border rounded-lg p-3"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Page</label>
                        <input
                          type="number"
                          value={page}
                          onChange={(e) => setPage(parseInt(e.target.value))}
                          min="1"
                          className="w-full border rounded-lg p-3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">X Position</label>
                        <input
                          type="number"
                          value={x}
                          onChange={(e) => setX(parseInt(e.target.value))}
                          className="w-full border rounded-lg p-3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Y Position</label>
                        <input
                          type="number"
                          value={y}
                          onChange={(e) => setY(parseInt(e.target.value))}
                          className="w-full border rounded-lg p-3"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editMode === 'highlight' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Text to Highlight</label>
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text to highlight..."
                        className="w-full border rounded-lg p-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Page</label>
                      <input
                        type="number"
                        value={page}
                        onChange={(e) => setPage(parseInt(e.target.value))}
                        min="1"
                        className="w-full border rounded-lg p-3"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleEdit}
                  disabled={processing || !text}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 transition mt-6"
                >
                  {processing ? 'Processing...' : 'Apply Edits'}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">PDF Edited!</h3>
            <p className="text-gray-600 mb-6">{result.message}</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download Edited PDF
            </button>

            <div>
              <button onClick={reset} className="text-indigo-600 hover:underline">
                Edit Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}