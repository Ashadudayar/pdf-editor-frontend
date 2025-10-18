'use client';

import { useState } from 'react';
import { Upload, Search, Download, ArrowLeft, Loader2, CheckCircle, FileText, Eye } from 'lucide-react';
import Link from 'next/link';

export default function FindReplacePage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [editedFileUrl, setEditedFileUrl] = useState<string>('');
  const [originalFileUrl, setOriginalFileUrl] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setFile(uploadedFile);
    setLoading(true);
    setEditedFileUrl('');
    setOriginalFileUrl('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch('http://localhost:8000/api/documents/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      console.log('Upload response:', data);
      setDocumentId(data.id);
      setOriginalFileUrl(data.original_file);
      setMessage('✅ PDF uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Failed to upload PDF: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindReplace = async () => {
    if (!documentId) {
      alert('Please upload a PDF first');
      return;
    }

    if (!findText.trim()) {
      alert('Please enter text to find');
      return;
    }

    setLoading(true);
    setMessage('');
    setEditedFileUrl('');

    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/find_replace/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            find_text: findText,
            replace_text: replaceText,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Find & Replace failed');
      }

      const data = await response.json();
      console.log('Find/Replace response:', data);
      
      if (data.edited_file) {
        setEditedFileUrl(data.edited_file);
        setMessage(`✅ Successfully replaced "${findText}" with "${replaceText}"!`);
      } else {
        setMessage('⚠️ Text not found in the PDF');
      }
    } catch (error) {
      console.error('Find & Replace error:', error);
      alert('❌ Failed to process PDF: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOriginal = () => {
  if (documentId) {
    // Use download endpoint instead of direct media URL
    window.open(`http://localhost:8000/api/documents/${documentId}/download_original/`, '_blank');
  }
};

  const handleDownloadEdited = () => {
  if (documentId) {
    window.open(`http://localhost:8000/api/documents/${documentId}/download/`, '_blank');
  }
};

  
  
  

  const resetForm = () => {
    setFile(null);
    setDocumentId('');
    setFindText('');
    setReplaceText('');
    setEditedFileUrl('');
    setOriginalFileUrl('');
    setMessage('');
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
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
              <Search className="w-10 h-10 text-purple-400" />
              Find & Replace Text
            </h1>
            <p className="text-purple-200 mt-2">
              Search and replace text in your PDF documents
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Controls */}
          <div className="space-y-6">
            {/* Upload Section */}
            {!file ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
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
                  <p className="text-purple-300 text-sm">
                    Maximum file size: 50MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-purple-300 text-sm">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="text-purple-300 hover:text-white transition text-sm"
                  >
                    Change File
                  </button>
                </div>

                {/* View Original PDF Button */}
                {originalFileUrl && (
                  <button
                    onClick={handleViewOriginal}
                    className="w-full bg-blue-500/20 border border-blue-500/30 text-blue-200 py-3 rounded-lg hover:bg-blue-500/30 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    View Original PDF
                  </button>
                )}
              </div>
            )}

            {/* Find & Replace Form */}
            {file && documentId && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Search className="w-6 h-6 text-purple-400" />
                  Find & Replace
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Find text
                    </label>
                    <input
                      type="text"
                      value={findText}
                      onChange={(e) => setFindText(e.target.value)}
                      placeholder="Enter text to find..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Replace with
                    </label>
                    <input
                      type="text"
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      placeholder="Enter replacement text..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    onClick={handleFindReplace}
                    disabled={loading || !findText.trim()}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Replace Text
                      </>
                    )}
                  </button>
                </div>

                {/* Success Message */}
                {message && (
                  <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-200 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      {message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Status & Download */}
          <div className="space-y-6">
            {/* Before Edit - View Original */}
            {file && !editedFileUrl && (
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Original PDF Uploaded
                  </h3>
                  <p className="text-blue-200 mb-4">
                    Your PDF is ready for text replacement
                  </p>
                  <p className="text-blue-300 text-sm mb-6">
                    Enter text to find and click "Replace Text" below
                  </p>
                  {originalFileUrl && (
                    <button
                      onClick={handleViewOriginal}
                      className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-all inline-flex items-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      View Original PDF
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* After Edit - Download Edited */}
            {editedFileUrl && (
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Text Replaced Successfully!
                  </h3>
                  <p className="text-green-200 mb-6">
                    Your edited PDF is ready to download
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleDownloadEdited}
                      className="w-full bg-green-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-600 transition-all inline-flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Edited PDF
                    </button>
                    
                    {originalFileUrl && (
                      <button
                        onClick={handleViewOriginal}
                        className="w-full bg-blue-500/30 border border-blue-400/30 text-blue-200 px-6 py-2 rounded-lg hover:bg-blue-500/40 transition-all inline-flex items-center justify-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Original (Compare)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                How to Use
              </h3>
              <ul className="space-y-2 text-purple-200 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">1.</span>
                  <span>Upload your PDF file</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">2.</span>
                  <span>Click "View Original PDF" to check your document</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">3.</span>
                  <span>Enter the text you want to find</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">4.</span>
                  <span>Enter the replacement text</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">5.</span>
                  <span>Click "Replace Text" to process</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">6.</span>
                  <span>Download your edited PDF</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}