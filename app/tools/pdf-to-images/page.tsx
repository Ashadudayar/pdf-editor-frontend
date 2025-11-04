'use client';

import ToolTemplate, { processDocument } from '@/components/ToolTemplate';
import { Images } from 'lucide-react';
import { useState } from 'react';

export default function PDFToImagesTool() {
  const [dpi, setDpi] = useState<number>(150);
  const [format, setFormat] = useState<string>('png');
  const [images, setImages] = useState<any[]>([]);

  const handleProcess = async (documentId: string) => {
    const response = await processDocument(documentId, 'pdf-to-images', 'POST', {
      dpi: dpi,
      format: format,
      pages: 'all'
    });
    
    setImages(response.images || []);
    return response;
  };

  return (
    <ToolTemplate
      title="PDF to Images"
      description="Convert PDF pages to JPG or PNG images"
      icon={<Images className="w-16 h-16 text-blue-600" />}
      onProcess={handleProcess}
      instructions={[
        'Upload your PDF file',
        'Choose image quality (DPI)',
        'Select image format',
        'Download images'
      ]}
      additionalInputs={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Quality (DPI)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[72, 150, 300].map(value => (
                <button
                  key={value}
                  onClick={() => setDpi(value)}
                  className={`py-3 px-4 rounded-lg border-2 font-semibold transition ${
                    dpi === value
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {value} DPI
                  <span className="block text-xs text-gray-500">
                    {value === 72 ? 'Low' : value === 150 ? 'Medium' : 'High'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'png', label: 'PNG (Better quality)' },
                { value: 'jpg', label: 'JPG (Smaller size)' }
              ].map(fmt => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value)}
                  className={`py-3 px-4 rounded-lg border-2 font-semibold transition ${
                    format === fmt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {images.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Generated Images:</h4>
              <div className="space-y-2">
                {images.map((img, index) => (
                  <a
                    key={index}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    Page {img.page} - Download
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}