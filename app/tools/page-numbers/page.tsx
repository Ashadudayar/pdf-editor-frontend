'use client';

import ToolTemplate, { processDocument } from '@/components/ToolTemplate';
import { Hash } from 'lucide-react';
import { useState } from 'react';

export default function PageNumbersTool() {
  const [position, setPosition] = useState<string>('bottom-center');
  const [startNum, setStartNum] = useState<number>(1);

  const handleProcess = async (documentId: string) => {
    return processDocument(documentId, 'add-page-numbers', 'POST', {
      position: position,
      start: startNum
    });
  };

  const positions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' }
  ];

  return (
    <ToolTemplate
      title="Add Page Numbers"
      description="Add page numbers to your PDF"
      icon={<Hash className="w-16 h-16 text-blue-600" />}
      onProcess={handleProcess}
      instructions={[
        'Upload your PDF file',
        'Choose position for page numbers',
        'Set starting number',
        'Download numbered PDF'
      ]}
      additionalInputs={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <div className="grid grid-cols-3 gap-2">
              {positions.map(pos => (
                <button
                  key={pos.value}
                  onClick={() => setPosition(pos.value)}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition ${
                    position === pos.value
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Starting Number
            </label>
            <input
              type="number"
              value={startNum}
              onChange={(e) => setStartNum(parseInt(e.target.value))}
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      }
    />
  );
}