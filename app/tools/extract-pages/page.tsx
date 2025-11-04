'use client';

import ToolTemplate, { processDocument } from '@/components/ToolTemplate';
import { Copy } from 'lucide-react';
import { useState } from 'react';

export default function ExtractPagesTool() {
  const [pages, setPages] = useState<string>('');

  const handleProcess = async (documentId: string) => {
    const pageNumbers = pages.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    return processDocument(documentId, 'extract-pages', 'POST', {
      pages: pageNumbers
    });
  };

  return (
    <ToolTemplate
      title="Extract Pages"
      description="Extract specific pages into a new PDF"
      icon={<Copy className="w-16 h-16 text-blue-600" />}
      onProcess={handleProcess}
      instructions={[
        'Upload your PDF file',
        'Enter page numbers to extract',
        'Download new PDF with selected pages'
      ]}
      additionalInputs={
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pages to Extract
          </label>
          <input
            type="text"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            placeholder="e.g., 1,3,5,7"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter page numbers separated by commas
          </p>
        </div>
      }
    />
  );
}