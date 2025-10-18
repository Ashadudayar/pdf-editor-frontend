'use client';

import { Search, RotateCw, Trash2, Layers, FileText, Scissors, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ToolsHub() {
  const router = useRouter();

  const tools = [
    {
      id: 'find-replace',
      title: 'Find & Replace',
      description: 'Search and replace text in PDFs',
      icon: Search,
      color: 'from-blue-500 to-blue-600',
      route: '/tools/find-replace',
    },
    {
      id: 'merge',
      title: 'Merge PDFs',
      description: 'Combine multiple PDF files into one',
      icon: Layers,
      color: 'from-purple-500 to-purple-600',
      route: '/tools/merge',
    },
    {
      id: 'split',
      title: 'Split PDF',
      description: 'Divide PDF into separate files',
      icon: Scissors,
      color: 'from-green-500 to-green-600',
      route: '/tools/split',
      comingSoon: false,
    },
    {
      id: 'rotate',
      title: 'Rotate Pages',
      description: 'Rotate PDF pages clockwise or counterclockwise',
      icon: RotateCw,
      color: 'from-orange-500 to-orange-600',
      route: '/tools/rotate',
      comingSoon: true,
    },
    {
      id: 'delete',
      title: 'Delete Pages',
      description: 'Remove unwanted pages from PDF',
      icon: Trash2,
      color: 'from-red-500 to-red-600',
      route: '/tools/delete',
      comingSoon: true,
    },
    {
      id: 'compress',
      title: 'Compress PDF',
      description: 'Reduce PDF file size',
      icon: FileText,
      color: 'from-pink-500 to-pink-600',
      route: '/tools/compress',
      comingSoon: true,
    },
  ];

  const handleToolClick = (tool: typeof tools[0]) => {
    if (tool.comingSoon) {
      alert('🚧 Coming soon! This feature is under development.');
      return;
    }
    router.push(tool.route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white mb-2">PDF Editor Tools</h1>
          <p className="text-white/70">Choose a tool to get started</p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 ${
                  tool.comingSoon ? 'opacity-75' : ''
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-2xl font-bold text-white">{tool.title}</h3>
                  {tool.comingSoon && (
                    <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
                      Soon
                    </span>
                  )}
                </div>
                
                <p className="text-white/70 text-sm leading-relaxed">
                  {tool.description}
                </p>
                
                <div className="mt-6 flex items-center text-white/50 text-sm">
                  <span>Click to use →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">🚀</div>
            <h4 className="text-white font-semibold mb-2">Fast Processing</h4>
            <p className="text-white/60 text-sm">Lightning-fast PDF operations with instant results</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">🔒</div>
            <h4 className="text-white font-semibold mb-2">Secure & Private</h4>
            <p className="text-white/60 text-sm">Your files are automatically deleted after 24 hours</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="text-3xl mb-3">💎</div>
            <h4 className="text-white font-semibold mb-2">Free to Use</h4>
            <p className="text-white/60 text-sm">All basic features are completely free forever</p>
          </div>
        </div>
      </div>
    </div>
  );
}