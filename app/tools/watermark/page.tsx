'use client';

import ToolTemplate, { processDocument } from '@/components/ToolTemplate';
import { Droplet } from 'lucide-react';
import { useState } from 'react';

export default function WatermarkPDFTool() {
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [opacity, setOpacity] = useState<number>(0.3);
  const [angle, setAngle] = useState<number>(45);

  const handleProcess = async (documentId: string) => {
    return processDocument(documentId, 'add-watermark', 'POST', {
      text: text,
      opacity: opacity,
      angle: angle
    });
  };

  return (
    <ToolTemplate
      title="Add Watermark"
      description="Add text watermark to your PDF pages"
      icon={<Droplet className="w-16 h-16 text-blue-600" />}
      onProcess={handleProcess}
      instructions={[
        'Upload your PDF file',
        'Enter watermark text',
        'Adjust opacity and angle',
        'Download watermarked PDF'
      ]}
      additionalInputs={
        <div className="space-y-4">
          {/* Watermark Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Watermark Text
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter watermark text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Opacity Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opacity: {opacity}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Transparent</span>
              <span>Opaque</span>
            </div>
          </div>

          {/* Angle Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotation Angle: {angle}°
            </label>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0°</span>
              <span>90°</span>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p 
              className="font-bold text-gray-600 inline-block"
              style={{ 
                opacity: opacity, 
                transform: `rotate(${angle}deg)`,
                fontSize: '24px'
              }}
            >
              {text || 'PREVIEW'}
            </p>
          </div>
        </div>
      }
    />
  );
}