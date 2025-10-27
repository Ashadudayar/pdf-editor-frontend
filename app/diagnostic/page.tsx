'use client';

export default function DiagnosticPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Environment Diagnostics</h1>
        
        <div className="bg-slate-800 rounded-lg p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 mb-1">NEXT_PUBLIC_API_URL:</p>
              <p className="font-mono bg-slate-900 p-3 rounded">
                {apiUrl || '❌ NOT SET'}
              </p>
            </div>
            
            <div>
              <p className="text-gray-400 mb-1">Status:</p>
              <p className={`text-lg font-semibold ${apiUrl ? 'text-green-400' : 'text-red-400'}`}>
                {apiUrl ? '✅ API URL is configured' : '❌ API URL is NOT configured'}
              </p>
            </div>
            
            {!apiUrl && (
              <div className="bg-red-900/20 border border-red-500 rounded p-4 mt-4">
                <p className="text-red-400 font-semibold mb-2">⚠️ Configuration Required</p>
                <p className="text-sm text-gray-300">
                  Please set the NEXT_PUBLIC_API_URL environment variable in Vercel:
                </p>
                <p className="font-mono text-sm bg-slate-900 p-2 rounded mt-2">
                  https://positive-creativity-production.up.railway.app/api
                </p>
              </div>
            )}
            
            {apiUrl && (
              <div className="bg-green-900/20 border border-green-500 rounded p-4 mt-4">
                <p className="text-green-400 font-semibold mb-2">✅ Configuration Correct</p>
                <p className="text-sm text-gray-300">
                  Your app will connect to: {apiUrl}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Instructions</h2>
          <ol className="space-y-2 text-gray-300">
            <li>1. If API URL is NOT SET, go to Vercel Settings → Environment Variables</li>
            <li>2. Add: NEXT_PUBLIC_API_URL</li>
            <li>3. Value: https://positive-creativity-production.up.railway.app/api</li>
            <li>4. Save and redeploy</li>
            <li>5. Clear browser cache and refresh this page</li>
          </ol>
        </div>
        
        <div className="mt-6">
          <a
            href="/tools/find-replace"
            className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold"
          >
            ← Back to Editor
          </a>
        </div>
      </div>
    </div>
  );
}