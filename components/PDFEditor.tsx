'use client';

import { useState } from 'react';
import { Upload, Download, Search, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PDFEditor() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('http://localhost:8000/api/documents/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setDocumentId(data.id);
      
      const pdfUrl = `http://localhost:8000${data.original_file}`;
      setFileUrl(pdfUrl);
      
      alert('✅ PDF uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleFindReplace = async () => {
    if (!findText || !documentId) {
      alert('Please enter text to find');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/find_replace/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            find_text: findText, 
            replace_text: replaceText || '' 
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const editedUrl = `http://localhost:8000${data.edited_file}`;
        setFileUrl(editedUrl);
        alert('✅ Text replaced successfully!');
      } else {
        throw new Error('Replace failed');
      }
    } catch (error) {
      console.error('Replace error:', error);
      alert('Failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!documentId) {
      alert('Please upload a PDF first');
      return;
    }
    window.open(`http://localhost:8000/api/documents/${documentId}/download/`);
  };

  const handleStartNew = () => {
    setFile(null);
    setFileUrl('');
    setDocumentId('');
    setFindText('');
    setReplaceText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Find & Replace</h1>
            <p className="text-white/70 mt-1">Search and replace text in your PDF</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Tools
            </button>
            <button
              onClick={handleDownload}
              disabled={!documentId || loading}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: PDF Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              {!fileUrl ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/30 rounded-lg">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={loading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer text-center">
                    <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <p className="text-white text-lg mb-2">
                      {loading ? 'Uploading...' : 'Drop PDF or click to upload'}
                    </p>
                    <p className="text-white/60 text-sm">
                      Supports PDF files up to 50MB
                    </p>
                  </label>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
                  <div className="bg-white rounded-lg overflow-hidden" style={{ height: '70vh' }}>
                    <iframe
                      src={fileUrl}
                      className="w-full h-full border-0"
                      title="PDF Viewer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Tools */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Find & Replace
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Find text</label>
                  <input
                    type="text"
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    placeholder="Enter text to find..."
                    className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-purple-400 focus:outline-none placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="text-white/80 text-sm mb-2 block">Replace with</label>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="Enter replacement..."
                    className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20 focus:border-purple-400 focus:outline-none placeholder-white/40"
                  />
                </div>

                <button
                  onClick={handleFindReplace}
                  disabled={loading || !documentId}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
                >
                  {loading ? 'Processing...' : 'Replace Text'}
                </button>
              </div>
            </div>

            <button
              onClick={handleStartNew}
              className="w-full bg-white/10 backdrop-blur-lg border border-white/20 text-white py-3 rounded-lg hover:bg-white/20 font-semibold transition-all"
            >
              Start New Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}