'use client';

import { useState } from 'react';
import { Upload, RotateCw, Download, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RotatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [rotatedFileUrl, setRotatedFileUrl] = useState<string>('');
  const [angle, setAngle] = useState<number>(90);
  const [pageMode, setPageMode] = useState<'all' | 'specific'>('all');
  const [specificPages, setSpecificPages] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setFile(uploadedFile);
    setLoading(true);
    setRotatedFileUrl('');

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch('http://localhost:8000/api/documents/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setDocumentId(data.id);
      setPageCount(data.page_count || 0);
      alert('✅ PDF uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Failed to upload PDF: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async () => {
    if (!documentId) {
      alert('Please upload a PDF first');
      return;
    }

    // Validate specific pages input
    if (pageMode === 'specific' && !specificPages.trim()) {
      alert('Please enter page numbers');
      return;
    }

    setLoading(true);
    setRotatedFileUrl('');

    const requestData = {
      angle: angle,
      pages: pageMode === 'all' ? 'all' : specificPages.trim(),
    };

    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/rotate/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rotation failed');
      }

      const data = await response.json();
      setRotatedFileUrl(data.edited_file);
      alert(`✅ ${data.message}\n📄 ${data.pages_rotated} page(s) rotated`);
    } catch (error) {
      console.error('Rotation error:', error);
      alert('❌ Failed to rotate PDF: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (rotatedFileUrl) {
      window.open(rotatedFileUrl, '_blank');
    }
  };

  const resetForm = () => {
    setFile(null);
    setDocumentId('');
    setRotatedFileUrl('');
    setAngle(90);
    setPageMode('all');
    setSpecificPages('');
    setPageCount(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/tools"
              className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Link>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <RotateCw className="w-10 h-10 text-purple-400" />
              Rotate PDF Pages
            </h1>
            <p className="text-purple-200 mt-2">
              Rotate all pages or specific pages of your PDF
            </p>
          </div>
        </div>

        {/* Upload Section */}
        {!file ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 mb-6 border border-white/20">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={loading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer block text-center"
            >
              <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-white text-xl mb-2">
                Drop PDF here or click to upload
              </p>
              <p className="text-purple-300 text-sm">Maximum file size: 50MB</p>
            </label>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-purple-300 text-sm">
                    {pageCount > 0 && `${pageCount} pages • `}
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-purple-300 hover:text-white transition"
              >
                Change File
              </button>
            </div>
          </div>
        )}

        {/* Rotation Options */}
        {file && documentId && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">
              Rotation Options
            </h2>

            {/* Angle Selection */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Rotation Angle
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[90, 180, 270, -90].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => setAngle(deg)}
                    className={`p-4 rounded-xl transition-all ${
                      angle === deg
                        ? 'bg-purple-500 text-white border-2 border-purple-300'
                        : 'bg-white/5 text-purple-200 border border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <RotateCw
                      className="w-8 h-8 mx-auto mb-2"
                      style={{ transform: `rotate(${deg}deg)` }}
                    />
                    <span className="block text-sm font-medium">
                      {deg > 0 ? `+${deg}°` : `${deg}°`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Page Selection */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-3">
                Pages to Rotate
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/20 cursor-pointer hover:bg-white/10 transition">
                  <input
                    type="radio"
                    name="pageMode"
                    checked={pageMode === 'all'}
                    onChange={() => setPageMode('all')}
                    className="w-4 h-4"
                  />
                  <div>
                    <span className="text-white font-medium">All Pages</span>
                    <p className="text-purple-300 text-sm">
                      Rotate every page in the document
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/20 cursor-pointer hover:bg-white/10 transition">
                  <input
                    type="radio"
                    name="pageMode"
                    checked={pageMode === 'specific'}
                    onChange={() => setPageMode('specific')}
                    className="w-4 h-4 mt-1"
                  />
                  <div className="flex-1">
                    <span className="text-white font-medium">
                      Specific Pages
                    </span>
                    <p className="text-purple-300 text-sm mb-3">
                      Rotate only selected pages
                    </p>
                    {pageMode === 'specific' && (
                      <input
                        type="text"
                        value={specificPages}
                        onChange={(e) => setSpecificPages(e.target.value)}
                        placeholder="e.g., 1,3,5 or 1-5"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Rotate Button */}
            <button
              onClick={handleRotate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Rotating...
                </>
              ) : (
                <>
                  <RotateCw className="w-5 h-5" />
                  Rotate PDF
                </>
              )}
            </button>
          </div>
        )}

        {/* Download Section */}
        {rotatedFileUrl && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                PDF Rotated Successfully!
              </h3>
              <p className="text-green-200 mb-6">
                Your rotated PDF is ready to download
              </p>
              <button
                onClick={handleDownload}
                className="bg-green-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-600 transition-all inline-flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Rotated PDF
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mt-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">
            💡 How to Use
          </h3>
          <ul className="space-y-2 text-purple-200">
            <li>• Upload your PDF file</li>
            <li>• Choose rotation angle (90°, 180°, 270°, or -90°)</li>
            <li>• Select all pages or specific pages to rotate</li>
            <li>• For specific pages, use formats like "1,3,5" or "1-5"</li>
            <li>• Click "Rotate PDF" and download your result</li>
          </ul>
        </div>
      </div>
    </div>
  );
}