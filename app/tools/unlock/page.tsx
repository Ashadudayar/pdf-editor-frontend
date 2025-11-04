'use client';

import ToolTemplate, { processDocument } from '@/components/ToolTemplate';
import { Unlock } from 'lucide-react';
import { useState } from 'react';

export default function UnlockPDFTool() {
  const [password, setPassword] = useState<string>('');

  const handleProcess = async (documentId: string) => {
    return processDocument(documentId, 'unlock', 'POST', {
      password: password
    });
  };

  return (
    <ToolTemplate
      title="Unlock PDF"
      description="Remove password protection from PDF"
      icon={<Unlock className="w-16 h-16 text-blue-600" />}
      onProcess={handleProcess}
      instructions={[
        'Upload your password-protected PDF',
        'Enter the current password',
        'Download unlocked PDF'
      ]}
      additionalInputs={
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter PDF password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      }
    />
  );
}