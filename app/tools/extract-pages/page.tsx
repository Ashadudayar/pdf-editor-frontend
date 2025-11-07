'use client';

import { useState } from 'react';
import { Upload, ArrowLeft, Download, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import PDF preview
const PDFPreview = dynamic(() => import('@/components/PDFPreview'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
});

interface PageItem {
  pageNumber: number;
  selected: boolean;
}

export default function ExtractPagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    try {
      // Upload to backend
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api'}/documents/`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setDocumentId(data.id);

      // Get page count from PDF
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      
      const pdf = await pdfjs.getDocument(URL.createObjectURL(uploadedFile)).promise;
      const pageCount = pdf.numPages;
      
      setNumPages(pageCount);
      setPages(Array.from({ length: pageCount }, (_, i) => ({
        pageNumber: i + 1,
        selected: false,
      })));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    setPages((prev) =>
      prev.map((page) =>
        page.pageNumber === pageNumber
          ? { ...page, selected: !page.selected }
          : page
      )
    );
  };

  const selectAll = () => {
    setPages((prev) => prev.map((page) => ({ ...page, selected: true })));
  };

  const deselectAll = () => {
    setPages((prev) => prev.map((page) => ({ ...page, selected: false })));
  };

  const handleExtract = async () => {
    if (!documentId) return;

    const selectedPages = pages.filter((p) => p.selected).map((p) => p.pageNumber);

    if (selectedPages.length === 0) {
      alert('Please select at least one page to extract');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://positive-creativity-production.up.railway.app/api'}/documents/${documentId}/extract-pages/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: selectedPages }),
        }
      );

      if (!response.ok) throw new Error('Extract failed');

      const data = await response.json();
      
      if (data.download_url) {
        const baseUrl = 'https://positive-creativity-production.up.railway.app';
        let cleanUrl = data.download_url;
        if (cleanUrl.startsWith('/api/')) {
          cleanUrl = cleanUrl.replace('/api/', '/');
        }
        const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : `${baseUrl}/api${cleanUrl}`;
        setResultUrl(fullUrl);
      }
    } catch (error) {
      console.error('Extract failed:', error);
      alert('Failed to extract pages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDocumentId('');
    setNumPages(0);
    setPages([]);
    setResultUrl('');
  };

  const handleDownload = () => {
    if (resultUrl) {
      const link = document.createElement('a');
      link.href = resultUrl;
      link.download = 'extracted_pages.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const selectedCount = pages.filter((p) => p.selected).length;

  // Generate page range string
  const getPageRangeString = () => {
    const selected = pages.filter(p => p.selected).map(p => p.pageNumber).sort((a, b) => a - b);
    if (selected.length === 0) return '';
    
    const ranges: string[] = [];
    let start = selected[0];
    let end = selected[0];
    
    for (let i = 1; i <= selected.length; i++) {
      if (i < selected.length && selected[i] === end + 1) {
        end = selected[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        if (i < selected.length) {
          start = selected[i];
          end = selected[i];
        }
      }
    }
    
    return ranges.join(', ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Extract Pages</h1>
                <p className="text-sm text-gray-600">
                  Extract specific pages from your PDF
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {resultUrl ? (
          // Success State
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12 mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pages Extracted Successfully!
              </h2>
              <p className="text-gray-600 mb-8">
                Extracted {selectedCount} page{selectedCount > 1 ? 's' : ''} from your PDF
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleDownload}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Extract from Another PDF
                </button>
              </div>
            </div>
          </div>
        ) : !file ? (
          // Upload State
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-green-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload PDF File
                </h3>
                <p className="text-gray-600 mb-1">Click to select or drag and drop</p>
                <p className="text-sm text-gray-500">Upload a PDF to extract pages</p>
              </label>
            </div>
          </div>
        ) : (
          // Page Selection State
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Total pages: {numPages}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Click on pages to extract from document. You can use "shift" key to set ranges.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Page Range Input */}
              {selectedCount > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pages to extract:
                  </label>
                  <input
                    type="text"
                    value={getPageRangeString()}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-mono"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    {selectedCount} page{selectedCount > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            {/* Pages Grid */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {pages.map((page) => (
                  <div
                    key={page.pageNumber}
                    onClick={() => togglePageSelection(page.pageNumber)}
                    className={`relative cursor-pointer rounded-xl border-2 p-3 transition-all hover:shadow-lg
                      ${page.selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                  >
                    {/* Green Checkmark when selected */}
                    {page.selected && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}

                    {/* PDF Preview */}
                    <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-2">
                      {file && (
                        <PDFPreview
                          file={file}
                          width={150}
                          height={200}
                          pageNumber={page.pageNumber}
                        />
                      )}
                    </div>

                    {/* Page Number */}
                    <p className={`text-center text-sm font-medium ${page.selected ? 'text-green-600' : 'text-gray-900'}`}>
                      {page.pageNumber}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Extract Button */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <button
                onClick={handleExtract}
                disabled={loading || selectedCount === 0}
                className="w-full px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Extracting Pages...
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    {selectedCount > 0
                      ? `Extract ${selectedCount} Page${selectedCount > 1 ? 's' : ''}`
                      : 'Select Pages to Extract'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Copy className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Visual Selection</h3>
            <p className="text-sm text-gray-600">
              Click pages to extract
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">100% Secure</h3>
            <p className="text-sm text-gray-600">
              Files deleted automatically
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Easy Download</h3>
            <p className="text-sm text-gray-600">
              Get your extracted PDF instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}