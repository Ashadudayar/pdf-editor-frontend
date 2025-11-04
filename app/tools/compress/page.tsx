'use client';

import ToolTemplate, { processDocument } from '@/components/ToolTemplate';
import { Minimize2 } from 'lucide-react';
import { useState } from 'react';

export default function CompressPDFTool() {
  const [quality, setQuality] = useState<string>('medium');

  const handleProcess = async (documentId: string) => {
    return processDocument(documentId, 'compress', 'POST', {
      quality: quality
    });
  };

  const qualityOptions = [
    { value: 'low', label: 'Maximum Compression', desc: 'Smallest file size, lower quality' },
    { value: 'medium', label: 'Balanced', desc: 'Good balance of size and quality' },
    { value: 'high', label: 'Minimum Compression', desc: 'Better quality, larger file' }
  ];

  return (
    <ToolTemplate
      title="Compress PDF"
      description="Reduce PDF file size while maintaining quality"
      icon={<Minimize2 className="w-16 h-16 text-blue-600" />}
      onProcess={handleProcess}
      instructions={[
        'Upload your PDF file',
        'Choose compression level',
        'Get your compressed PDF with reduced file size'
      ]}
      additionalInputs={
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Compression Level
          </label>
          <div className="space-y-3">
            {qualityOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setQuality(option.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  quality === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    quality === option.value
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {quality === option.value && (
                      <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}