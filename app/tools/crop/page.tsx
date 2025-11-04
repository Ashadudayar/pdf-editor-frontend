'use client';

import ToolTemplate, { processDocument } from '@/components/ToolTemplate';
import { Crop } from 'lucide-react';
import { useState } from 'react';

export default function CropPDFTool() {
  const [left, setLeft] = useState<number>(0);
  const [top, setTop] = useState<number>(0);
  const [right, setRight] = useState<number>(0);
  const [bottom, setBottom] = useState<number>(0);

  const handleProcess = async (documentId: string) => {
    return processDocument(documentId, 'crop', 'POST', {
      left, top, right, bottom
    });
  };

  return (
    <ToolTemplate
      title="Crop PDF"
      description="Remove margins and crop PDF pages"
      icon={<Crop className="w-16 h-16 text-blue-600" />}
      onProcess={handleProcess}
      instructions={[
        'Upload your PDF file',
        'Set crop margins (in points)',
        'Download cropped PDF'
      ]}
      additionalInputs={
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Left Margin
              </label>
              <input
                type="number"
                value={left}
                onChange={(e) => setLeft(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Right Margin
              </label>
              <input
                type="number"
                value={right}
                onChange={(e) => setRight(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top Margin
              </label>
              <input
                type="number"
                value={top}
                onChange={(e) => setTop(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bottom Margin
              </label>
              <input
                type="number"
                value={bottom}
                onChange={(e) => setBottom(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            💡 1 inch = 72 points. Standard margin = 36 points (0.5 inch)
          </p>
        </div>
      }
    />
  );
}