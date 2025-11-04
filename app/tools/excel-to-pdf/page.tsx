'use client';

import { useState } from 'react';
import { FileSpreadsheet, Upload, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function ExcelToPDFTool() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls'))) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select an Excel file');
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/excel-to-pdf/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Conversion failed');

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to convert Excel');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.pdf_url) return;
    window.open(`${API_URL.replace('/api', '')}${result.pdf_url}`, '_blank');
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <FileSpreadsheet className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Excel to PDF</h1>
          <p className="text-gray-600">Convert .xlsx spreadsheets to PDF</p>
        </div>

        {!result ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center border-2 border-dashed border-green-300 rounded-xl p-12 cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
              >
                <Upload className="w-16 h-16 text-green-500 mb-4" />
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {file ? file.name : 'Upload Excel File'}
                </p>
                <p className="text-sm text-gray-500">.xlsx or .xls files</p>
              </label>
            </div>

            {file && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <button
                  onClick={handleConvert}
                  disabled={processing}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 disabled:bg-gray-300 transition"
                >
                  {processing ? 'Converting...' : 'Convert to PDF'}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">PDF Created!</h3>
            <p className="text-gray-600 mb-6">Your spreadsheet has been converted</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>

            <div>
              <button onClick={reset} className="text-green-600 hover:underline">
                Convert Another Spreadsheet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}