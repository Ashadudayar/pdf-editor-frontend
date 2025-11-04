'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface UploadedDoc {
  id: string;
  title: string;
}

export default function ComparePDFsTool() {
  const [doc1, setDoc1] = useState<UploadedDoc | null>(null);
  const [doc2, setDoc2] = useState<UploadedDoc | null>(null);
  const [uploading1, setUploading1] = useState(false);
  const [uploading2, setUploading2] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [differences, setDifferences] = useState<any[]>([]);
  const [compared, setCompared] = useState(false);

  const handleUpload1 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading1(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setDoc1({ id: data.id, title: data.title });
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading1(false);
    }
  };

  const handleUpload2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading2(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setDoc2({ id: data.id, title: data.title });
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading2(false);
    }
  };

  const handleCompare = async () => {
    if (!doc1 || !doc2) return;

    setComparing(true);

    try {
      const response = await fetch(`${API_URL}/documents/compare/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc1_id: doc1.id,
          doc2_id: doc2.id
        }),
      });

      const data = await response.json();
      setDifferences(data.differences || []);
      setCompared(true);
    } catch (err) {
      alert('Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  const reset = () => {
    setDoc1(null);
    setDoc2(null);
    setDifferences([]);
    setCompared(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Compare PDFs</h1>
          <p className="text-gray-600">Find differences between two PDF documents</p>
        </div>

        {!compared ? (
          <div className="space-y-6">
            {/* Upload First PDF */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-lg font-semibold mb-4">First PDF</h3>
              {!doc1 ? (
                <>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpload1}
                    className="hidden"
                    id="file-upload-1"
                    disabled={uploading1}
                  />
                  <label
                    htmlFor="file-upload-1"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-xl p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <Upload className="w-12 h-12 text-blue-500 mb-3" />
                    <p className="text-gray-700 font-medium">
                      {uploading1 ? 'Uploading...' : 'Upload First PDF'}
                    </p>
                  </label>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">✓ {doc1.title}</p>
                </div>
              )}
            </div>

            {/* Upload Second PDF */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-lg font-semibold mb-4">Second PDF</h3>
              {!doc2 ? (
                <>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpload2}
                    className="hidden"
                    id="file-upload-2"
                    disabled={uploading2}
                  />
                  <label
                    htmlFor="file-upload-2"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl p-8 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition"
                  >
                    <Upload className="w-12 h-12 text-purple-500 mb-3" />
                    <p className="text-gray-700 font-medium">
                      {uploading2 ? 'Uploading...' : 'Upload Second PDF'}
                    </p>
                  </label>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">✓ {doc2.title}</p>
                </div>
              )}
            </div>

            {/* Compare Button */}
            {doc1 && doc2 && (
              <button
                onClick={handleCompare}
                disabled={comparing}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition"
              >
                {comparing ? 'Comparing...' : 'Compare PDFs'}
              </button>
            )}
          </div>
        ) : (
          /* Results */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Comparison Results</h3>

            {differences.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-800 font-semibold text-lg">PDFs are identical!</p>
                <p className="text-green-600 text-sm mt-2">No differences found between the two documents.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-800 font-semibold">
                      Found {differences.length} difference(s)
                    </p>
                  </div>
                </div>

                {differences.map((diff, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900 mb-2">
                      Difference #{index + 1}
                    </p>
                    {diff.type === 'page_count' && (
                      <p className="text-gray-600">
                        Page count mismatch: Document 1 has {diff.doc1} pages, Document 2 has {diff.doc2} pages
                      </p>
                    )}
                    {diff.type === 'text_diff' && (
                      <p className="text-gray-600">
                        Text content differs on page {diff.page}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={reset}
              className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Compare Other PDFs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}