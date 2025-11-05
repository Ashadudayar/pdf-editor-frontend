'use client';

import { useState } from 'react';
import { ScanText, Upload, Copy, Download } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function OCRPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleOCR = async () => {
    if (!documentId) return;

    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/ocr/`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('OCR failed');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to extract text. Make sure Tesseract OCR is installed.');
    } finally {
      setProcessing(false);
    }
  };

  const copyAllText = () => {
    if (!result?.pages) return;
    const allText = result.pages.map((p: any) => `Page ${p.page}:\n${p.text}`).join('\n\n');
    navigator.clipboard.writeText(allText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setFile(null);
    setDocumentId('');
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <ScanText className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">OCR PDF</h1>
          <p className="text-gray-600">Extract text from scanned PDFs</p>
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
                className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl p-12 cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition"
              >
                <Upload className="w-16 h-16 text-purple-500 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {file ? file.name : 'Upload Scanned PDF'}
                </p>
                <p className="text-sm text-gray-500">PDF files only</p>
              </label>
            </div>

            {file && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    🔍 This tool uses OCR to extract text from scanned documents and images in PDFs.
                  </p>
                </div>
                <button
                  onClick={handleOCR}
                  disabled={processing}
                  className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition"
                >
                  {processing ? 'Extracting Text...' : 'Extract Text (OCR)'}
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
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Extracted Text</h3>
              <button
                onClick={copyAllText}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy All'}
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {result.pages?.map((page: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4">
                  <p className="font-semibold text-purple-600 mb-2">Page {page.page}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{page.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button onClick={reset} className="text-purple-600 hover:underline">
                Process Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}