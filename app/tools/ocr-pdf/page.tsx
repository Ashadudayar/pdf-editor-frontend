'use client';

import { useState } from 'react';
import { FileSearch, Upload, Download, Copy, CheckCircle, FileText } from 'lucide-react';

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
    setResult(null);

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

  const handleExtract = async () => {
    if (!documentId) return;

    setProcessing(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}/ocr/`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to extract text from PDF');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.text) return;

    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy text');
    }
  };

  const handleDownloadPDF = () => {
    if (!result?.pdf_download_url) return;
    window.open(`${API_URL.replace('/api', '')}${result.pdf_download_url}`, '_blank');
  };

  const handleDownloadTXT = () => {
    if (!result?.txt_download_url) return;
    window.open(`${API_URL.replace('/api', '')}${result.txt_download_url}`, '_blank');
  };

  const reset = () => {
    setFile(null);
    setDocumentId('');
    setResult(null);
    setError('');
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <FileSearch className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">OCR PDF</h1>
          <p className="text-gray-600">Extract text from scanned PDFs</p>
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* Upload */}
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
                <p className="text-sm text-gray-500">PDF with images or scanned documents</p>
              </label>
            </div>

            {file && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    🔍 This tool uses OCR to create a searchable PDF with selectable text.
                  </p>
                </div>
                <button
                  onClick={handleExtract}
                  disabled={processing}
                  className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-300 transition"
                >
                  {processing ? 'Processing OCR...' : 'Extract Text (OCR)'}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 font-semibold">Error:</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Text Extracted!</h3>
                <p className="text-gray-600 mb-4">{result.message}</p>
                
                <div className="flex justify-center gap-4 text-sm text-gray-600 mb-6">
                  <span>📄 {result.pages_processed} page(s)</span>
                  <span>📝 {result.characters?.toLocaleString()} characters</span>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  <Download className="w-5 h-5" />
                  Searchable PDF
                </button>
                
                <button
                  onClick={handleDownloadTXT}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  <FileText className="w-5 h-5" />
                  Download TXT
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy Text
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="font-semibold text-purple-900">Searchable PDF</p>
                  <p className="text-xs text-purple-700">Original look + searchable text</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-semibold text-green-900">Plain Text</p>
                  <p className="text-xs text-green-700">Extracted text only</p>
                </div>
              </div>
            </div>

            {/* Extracted Text Display */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Extracted Text Preview</h4>
                <span className="text-sm text-gray-500">
                  {result.characters?.toLocaleString()} characters
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-gray-200">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                  {result.text}
                </pre>
              </div>
            </div>

            {/* Reset Button */}
            <div className="text-center">
              <button
                onClick={reset}
                className="text-purple-600 hover:underline font-medium"
              >
                Process Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}