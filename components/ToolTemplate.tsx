'use client';

import { useState, ReactNode } from 'react';
import { Upload, Download, ArrowLeft, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ToolTemplateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
  showUpload?: boolean;
  acceptMultiple?: boolean;
  onProcess?: (documentId: string, formData?: any) => Promise<any>;
  additionalInputs?: ReactNode;
  instructions?: string[];
}

export default function ToolTemplate({
  title,
  description,
  icon,
  children,
  showUpload = true,
  acceptMultiple = false,
  onProcess,
  additionalInputs,
  instructions = []
}: ToolTemplateProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch(`${API_URL}/documents/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setDocumentId(data.id);
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async (additionalData?: any) => {
    if (!documentId || !onProcess) return;

    setProcessing(true);
    setError('');

    try {
      const result = await onProcess(documentId, additionalData);
      setResultId(result.id);
      setMessage(result.message || 'Processing completed successfully!');
    } catch (err: any) {
      setError(err.message || 'Processing failed');
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
    setResultId(null);
    setError('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {icon && <div className="flex justify-center mb-4">{icon}</div>}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>

        {/* Main Content */}
        {!resultId ? (
          <div className="space-y-6">
            {/* Upload Area */}
            {showUpload && !documentId && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <input
                  type="file"
                  accept=".pdf"
                  multiple={acceptMultiple}
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
                  <p className="text-sm text-gray-500">Click to select or drag and drop</p>
                </label>
              </div>
            )}

            {/* Additional Inputs & Process Button */}
            {documentId && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Uploaded:</p>
                  <p className="font-semibold text-gray-900">{file?.name}</p>
                </div>

                {additionalInputs && (
                  <div className="mb-6">
                    {additionalInputs}
                  </div>
                )}

                {children}

                <button
                  onClick={() => handleProcess()}
                  disabled={processing}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process PDF'
                  )}
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Instructions */}
            {instructions.length > 0 && !documentId && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">How It Works</h3>
                <ol className="space-y-2 text-gray-600">
                  {instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="font-bold text-blue-600">{index + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition mb-4"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>

            <div>
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Process Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export helper function for making API calls
export const processDocument = async (
  documentId: string,
  endpoint: string,
  method: string = 'POST',
  body?: any
) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  
  const response = await fetch(`${API_URL}/documents/${documentId}/${endpoint}/`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Processing failed');
  }

  return response.json();
};