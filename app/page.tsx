'use client';

import Link from 'next/link';
import { 
  Combine, Scissors, RotateCw, Minimize2, Droplet, Hash,
  Unlock, Lock, Trash2, Copy, ArrowUpDown, Image as ImageIcon,
  Images, Camera, Crop, FileText
} from 'lucide-react';

const tools = [
  {
    category: 'Organize PDF',
    icon: '📋',
    tools: [
      { name: 'Merge PDF', icon: Combine, href: '/tools/merge', color: 'blue', desc: 'Combine multiple PDFs into one' },
      { name: 'Split PDF', icon: Scissors, href: '/tools/split', color: 'purple', desc: 'Split PDF into multiple files' },
      { name: 'Remove Pages', icon: Trash2, href: '/tools/remove-pages', color: 'red', desc: 'Delete specific pages' },
      { name: 'Extract Pages', icon: Copy, href: '/tools/extract-pages', color: 'green', desc: 'Extract pages to new PDF' },
      { name: 'Organize', icon: ArrowUpDown, href: '/tools/organize', color: 'indigo', desc: 'Reorder PDF pages' },
    ]
  },
  {
    category: 'Edit PDF',
    icon: '✏️',
    tools: [
      { name: 'Rotate PDF', icon: RotateCw, href: '/tools/rotate', color: 'blue', desc: 'Rotate pages 90°, 180°, 270°' },
      { name: 'Add Watermark', icon: Droplet, href: '/tools/watermark', color: 'cyan', desc: 'Add watermark to pages' },
      { name: 'Add Page Numbers', icon: Hash, href: '/tools/page-numbers', color: 'purple', desc: 'Number your pages' },
      { name: 'Crop PDF', icon: Crop, href: '/tools/crop', color: 'pink', desc: 'Remove margins and crop' },
    ]
  },
  {
    category: 'Optimize PDF',
    icon: '⚡',
    tools: [
      { name: 'Compress PDF', icon: Minimize2, href: '/tools/compress', color: 'orange', desc: 'Reduce file size' },
    ]
  },
  {
    category: 'Convert',
    icon: '🔄',
    tools: [
      { name: 'Images to PDF', icon: ImageIcon, href: '/tools/images-to-pdf', color: 'green', desc: 'JPG, PNG to PDF' },
      { name: 'PDF to Images', icon: Images, href: '/tools/pdf-to-images', color: 'blue', desc: 'PDF pages to images' },
      { name: 'Scan to PDF', icon: Camera, href: '/tools/scan-to-pdf', color: 'purple', desc: 'Scanned docs to PDF' },
    ]
  },
  {
    category: 'PDF Security',
    icon: '🔐',
    tools: [
      { name: 'Unlock PDF', icon: Unlock, href: '/tools/unlock', color: 'green', desc: 'Remove password protection' },
      { name: 'Protect PDF', icon: Lock, href: '/tools/protect', color: 'red', desc: 'Add password protection' },
    ]
  },
  {
    category: 'Compare',
    icon: '🔍',
    tools: [
      { name: 'Compare PDFs', icon: FileText, href: '/tools/compare', color: 'indigo', desc: 'Find differences between PDFs' },
    ]
  }
];

const colorClasses: Record<string, { bg: string; text: string; hover: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-200' },
  green: { bg: 'bg-green-100', text: 'text-green-600', hover: 'hover:bg-green-200' },
  red: { bg: 'bg-red-100', text: 'text-red-600', hover: 'hover:bg-red-200' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:bg-orange-200' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', hover: 'hover:bg-cyan-200' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-600', hover: 'hover:bg-pink-200' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', hover: 'hover:bg-indigo-200' },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">PDFDoor</h1>
            </div>
            <div className="text-sm text-gray-600">
              Free Online PDF Tools
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            All-in-One PDF Tools
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Edit, convert, compress, and secure your PDFs - 100% free
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secure & private</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Files deleted after 24h</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {tools.map((category, idx) => (
            <div key={idx} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{category.icon}</span>
                <h3 className="text-2xl font-bold text-gray-900">{category.category}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tools.map((tool, toolIdx) => {
                  const Icon = tool.icon;
                  const colors = colorClasses[tool.color];
                  
                  return (
                    <Link
                      key={toolIdx}
                      href={tool.href}
                      className={`group bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 ${colors.hover}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`${colors.bg} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition">
                            {tool.name}
                          </h4>
                          <p className="text-sm text-gray-600">{tool.desc}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">16+</div>
              <div className="text-blue-100">PDF Tools</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">Free to Use</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">Safe</div>
              <div className="text-blue-100">Secure Processing</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">Fast</div>
              <div className="text-blue-100">Quick Results</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-xl font-bold">PDFDoor</span>
          </div>
          <p className="text-gray-400 mb-6">
            Your trusted partner for all PDF operations
          </p>
          <div className="text-sm text-gray-500">
            © 2025 PDFDoor. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}