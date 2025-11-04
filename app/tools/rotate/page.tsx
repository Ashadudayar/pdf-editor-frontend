'use client';

import ToolTemplate, { processDocument } from '@/components/ToolTemplate';
import { RotateCw } from 'lucide-react';
import { useState } from 'react';

export default function RotatePDFTool() {
  const [angle, setAngle] = useState<number>(90);
  const [pages, setPages] = useState<string>('all');

  const handleProcess = async (documentId: string) => {
    return processDocument(documentId, 'rotate', 'POST', {
      angle: angle,
      pages: pages
    });
  };

  return (
    <ToolTemplate
      title="Rotate PDF"
      description="Rotate PDF pages by 90, 180, or 270 degrees"
      icon={<RotateCw className="w-16 h-16 text-blue-600" />}
      onProcess={handleProcess}
      instructions={[
        'Upload your PDF file',
        'Select rotation angle (90°, 180°, 270°)',
        'Choose which pages to rotate',
        'Download your rotated PDF'
      ]}
      additionalInputs={
        <div className="space-y-4">
          {/* Rotation Angle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotation Angle
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[90, 180, 270].map(deg => (
                <button
                  key={deg}
                  onClick={() => setAngle(deg)}
                  className={`py-3 px-4 rounded-lg border-2 font-semibold transition ${
                    angle === deg
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Pages Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pages to Rotate
            </label>
            <input
              type="text"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="all, 1,3,5 or 1-5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter "all" or page numbers (e.g., "1,3,5" or "1-5")
            </p>
          </div>
        </div>
      }
    />
  );
}