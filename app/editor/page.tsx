'use client';

import { useState } from 'react';
import { Upload, Search, RotateCw, Trash2, Layers, Download, X, Check, AlertCircle, FileText, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import PDFViewer from '@/components/PDFViewer';


type Tool = 'find-replace' | 'rotate' | 'delete' | 'merge' | null;

interface PDFFile {
  id: string;
  file: File;
  preview?: string;
  pageCount?: number;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ProfessionalEditor() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [currentFile, setCurrentFile] = useState<PDFFile | null>(null);
  const [documentId, setDocumentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>(null);
  
  // Notification state
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // Tool states
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [rotationAngle, setRotationAngle] = useState(90);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    if (uploadedFiles.length === 0) return;

    const file = uploadedFiles[0];
    if (file.size > 52428800) {
      showNotification('File too large! Maximum 50MB', 'error');
      return;
    }

    if (!file.type.includes('pdf')) {
      showNotification('Please upload a PDF file', 'error');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/documents/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const newFile: PDFFile = {
        id: data.id,
        file: file,
        preview: URL.createObjectURL(file),
      };
      
      setFiles([newFile]);
      setCurrentFile(newFile);
      setDocumentId(data.id);
      showNotification('PDF uploaded successfully!', 'success');
    } catch (error) {
      showNotification('Upload failed: ' + error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    setLoading(true);

    const newFiles: PDFFile[] = [];
    for (const file of uploadedFiles) {
      if (!file.type.includes('pdf')) continue;
      
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:8000/api/documents/', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        newFiles.push({
          id: data.id,
          file: file,
          preview: URL.createObjectURL(file),
        });
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    setLoading(false);
    showNotification(`${newFiles.length} files uploaded`, 'success');
  };

  const handleFindReplace = async () => {
    if (!documentId || !findText.trim()) {
      showNotification('Please enter text to find', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/find_replace/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ find_text: findText, replace_text: replaceText }),
        }
      );

      if (!response.ok) throw new Error('Replace failed');
      const result = await response.json();
      showNotification(`✓ Replaced ${result.replacements || 0} instances`, 'success');
    } catch (error) {
      showNotification('Failed: ' + error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async () => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/rotate/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: 'all', rotation: rotationAngle }),
        }
      );

      if (!response.ok) throw new Error('Rotation failed');
      showNotification('✓ Pages rotated successfully', 'success');
    } catch (error) {
      showNotification('Failed: ' + error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentId || selectedPages.length === 0) {
      showNotification('Please select pages to delete', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/delete_pages/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: selectedPages }),
        }
      );

      if (!response.ok) throw new Error('Delete failed');
      showNotification(`✓ Deleted ${selectedPages.length} pages`, 'success');
      setSelectedPages([]);
    } catch (error) {
      showNotification('Failed: ' + error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      showNotification('Please upload at least 2 PDFs', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/documents/merge/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: files.map(f => f.id) }),
      });

      if (!response.ok) throw new Error('Merge failed');
      const result = await response.json();
      showNotification('✓ PDFs merged successfully', 'success');
      setDocumentId(result.document.id);
    } catch (error) {
      showNotification('Failed: ' + error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!documentId) {
      showNotification('No file to download', 'error');
      return;
    }
    window.open(`http://localhost:8000/api/documents/${documentId}/download/`);
    showNotification('Download started', 'info');
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages(prev => 
      prev.includes(pageNum) 
        ? prev.filter(p => p !== pageNum)
        : [...prev, pageNum]
    );
  };

  const tools = [
    { id: 'find-replace', name: 'Find & Replace', icon: Search, description: 'Search and replace text' },
    { id: 'rotate', name: 'Rotate', icon: RotateCw, description: 'Rotate pages' },
    { id: 'delete', name: 'Delete Pages', icon: Trash2, description: 'Remove pages' },
    { id: 'merge', name: 'Merge', icon: Layers, description: 'Combine PDFs' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg animate-in slide-in-from-top ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          <div className="flex items-center gap-3 text-white">
            {notification.type === 'success' && <Check className="w-5 h-5" />}
            {notification.type === 'error' && <X className="w-5 h-5" />}
            {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
            <span className="font-medium flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="hover:bg-white/20 p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">PDF Editor</h1>
          {documentId && (
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Upload Section - Always Visible */}
        {!currentFile && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="text-center">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Your PDF
              </h2>
              <p className="text-gray-600 mb-6">
                Choose a tool below, then upload your file to get started
              </p>
              
              {/* Tools Grid - Always Visible */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-6">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id as Tool)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      activeTool === tool.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <tool.icon className={`w-6 h-6 mb-2 ${
                      activeTool === tool.id ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <div className="font-medium text-gray-900 text-sm">{tool.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
                  </button>
                ))}
              </div>

              {/* Upload Button */}
              {activeTool && activeTool !== 'merge' && (
                <div>
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
                    className={`inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 cursor-pointer transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-5 h-5" />
                    {loading ? 'Uploading...' : 'Select PDF File'}
                  </label>
                  <p className="text-sm text-gray-500 mt-2">Maximum file size: 50MB</p>
                </div>
              )}

              {activeTool === 'merge' && (
                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleMergeFileUpload}
                    className="hidden"
                    id="merge-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="merge-upload"
                    className={`inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 cursor-pointer transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-5 h-5" />
                    {loading ? 'Uploading...' : 'Select Multiple PDFs'}
                  </label>
                  <p className="text-sm text-gray-500 mt-2">Select 2 or more files</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor Layout - 2 Column */}
        {currentFile && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Preview Panel */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">Preview</h3>
              </div>
              
              <div className="h-[600px]">
                <PDFViewer
                  fileUrl={currentFile.file}
                  selectedPages={selectedPages}
                  onPageSelect={(page) => togglePageSelection(page)}
                  mode={activeTool === 'delete' || activeTool === 'rotate' ? 'grid' : 'single'}
                />
              </div>
            </div>

            {/* Right: Tool Panel */}
            <div className="space-y-4">
              {/* Find & Replace */}
              {activeTool === 'find-replace' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Find & Replace</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Find text
                      </label>
                      <input
                        type="text"
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                        placeholder="Enter text to find..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Replace with
                      </label>
                      <input
                        type="text"
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                        placeholder="Enter replacement..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleFindReplace}
                      disabled={loading || !findText}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Processing...' : 'Replace Text'}
                    </button>
                  </div>
                </div>
              )}

              {/* Rotate */}
              {activeTool === 'rotate' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Rotate Pages</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[90, 180, 270].map((angle) => (
                        <button
                          key={angle}
                          onClick={() => setRotationAngle(angle)}
                          className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                            rotationAngle === angle
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {angle}°
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleRotate}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Processing...' : 'Rotate Pages'}
                    </button>
                  </div>
                </div>
              )}

              {/* Delete */}
              {activeTool === 'delete' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Delete Pages</h3>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      {selectedPages.length > 0 ? (
                        <p>{selectedPages.length} page(s) selected</p>
                      ) : (
                        <p>Click pages in preview to select</p>
                      )}
                    </div>
                    <button
                      onClick={handleDelete}
                      disabled={loading || selectedPages.length === 0}
                      className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Processing...' : `Delete ${selectedPages.length} Page(s)`}
                    </button>
                  </div>
                </div>
              )}

              {/* Merge */}
              {activeTool === 'merge' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Merge PDFs</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {files.map((file, idx) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="flex-1 text-sm text-gray-900 truncate">
                            {file.file.name}
                          </span>
                          <span className="text-xs text-gray-500">{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                    
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleMergeFileUpload}
                      className="hidden"
                      id="add-more"
                      disabled={loading}
                    />
                    <label
                      htmlFor="add-more"
                      className="block w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-sm text-gray-600 hover:border-gray-400 cursor-pointer transition-colors"
                    >
                      + Add more files
                    </label>

                    <button
                      onClick={handleMerge}
                      disabled={loading || files.length < 2}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Merging...' : `Merge ${files.length} PDFs`}
                    </button>
                  </div>
                </div>
              )}

              {/* Change Tool */}
              <button
                onClick={() => {
                  setCurrentFile(null);
                  setFiles([]);
                  setDocumentId('');
                  setActiveTool(null);
                  setSelectedPages([]);
                  setFindText('');
                  setReplaceText('');
                }}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Start New Task
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}