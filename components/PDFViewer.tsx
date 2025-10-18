'use client';

interface PDFViewerProps {
  fileUrl: string;
  onDocumentLoadSuccess?: () => void;
  onDocumentLoadError?: (error: Error) => void;
}

export default function PDFViewer({ 
  fileUrl,
  onDocumentLoadSuccess,
  onDocumentLoadError 
}: PDFViewerProps) {
  
  const handleLoad = () => {
    onDocumentLoadSuccess?.();
  };

  const handleError = () => {
    onDocumentLoadError?.(new Error('Failed to load PDF'));
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div 
        className="w-full rounded-lg shadow-2xl overflow-hidden" 
        style={{ height: '80vh', maxWidth: '900px' }}
      >
        <iframe
          src={fileUrl}
          className="w-full h-full border-0"
          title="PDF Viewer"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
      
      <p className="text-white/70 text-sm mt-4">
        Use browser controls to navigate pages
      </p>
    </div>
  );
}