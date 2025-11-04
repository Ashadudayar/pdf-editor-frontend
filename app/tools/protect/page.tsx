'use client';

import ToolTemplate, { processDocument } from '@/components/ToolTemplate';
import { Lock } from 'lucide-react';
import { useState } from 'react';

export default function ProtectPDFTool() {
  const [password, setPassword] = useState<string>('');

  const handleProcess = async (documentId: string) => {
    if (!password) {
      throw new Error('Password is required');
    }
    return processDocument(documentId, 'protect', 'POST', {
      password: password
    });
  };

  return (
    <ToolTemplate
      title="Protect PDF"
      description="Add password protection to your PDF"
      icon={<Lock className="w-16 h-16 text-blue-600" />}
      onProcess={handleProcess}
      instructions={[
        'Upload your PDF file',
        'Enter a strong password',
        'Download password-protected PDF'
      ]}
      additionalInputs={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Use a strong password with letters, numbers, and symbols.
            </p>
          </div>
        </div>
      }
    />
  );
}