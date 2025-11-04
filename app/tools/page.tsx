'use client';

import Link from 'next/link';
import { 
  Combine, 
  Split, 
  Search, 
  Droplets, 
  RotateCw, 
  Trash2,
  Image,
  FileImage,
  Scissors,
  Crop,
  Grid3x3,
  Lock,
  Unlock,
  Download,
  Minus,
  FileText,
  Wrench,
  EyeOff,
  Hash
} from 'lucide-react';

export default function ToolsPage() {
  const tools = [
    {
      name: 'Merge PDFs',
      description: 'Combine multiple PDFs',
      icon: Combine,
      href: '/tools/merge',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Split PDF',
      description: 'Separate PDF pages',
      icon: Split,
      href: '/tools/split',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Find & Replace',
      description: 'Edit text in PDF',
      icon: Search,
      href: '/tools/find-replace',
      color: 'from-green-500 to-teal-500'
    },
    {
      name: 'Watermark',
      description: 'Add watermark',
      icon: Droplets,
      href: '/tools/watermark',
      color: 'from-red-500 to-orange-500'
    },
    {
      name: 'Rotate Pages',
      description: 'Fix orientation',
      icon: RotateCw,
      href: '/tools/rotate',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      name: 'Remove Pages',
      description: 'Delete pages',
      icon: Trash2,
      href: '/tools/remove-pages',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      name: 'Images to PDF',
      description: 'Create PDF from images',
      icon: Image,
      href: '/tools/images-to-pdf',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'PDF to Images',
      description: 'Convert to images',
      icon: FileImage,
      href: '/tools/pdf-to-images',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Compress',
      description: 'Reduce file size',
      icon: Minus,
      href: '/tools/compress',
      color: 'from-green-500 to-teal-500'
    },
    {
      name: 'Protect',
      description: 'Add password',
      icon: Lock,
      href: '/tools/protect',
      color: 'from-red-500 to-orange-500'
    },
    {
      name: 'Unlock',
      description: 'Remove password',
      icon: Unlock,
      href: '/tools/unlock',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      name: 'Extract Pages',
      description: 'Get specific pages',
      icon: Scissors,
      href: '/tools/extract-pages',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      name: 'Compare',
      description: 'Compare two PDFs',
      icon: Grid3x3,
      href: '/tools/compare',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Organize',
      description: 'Reorder pages',
      icon: Grid3x3,
      href: '/tools/organize',
      color: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Page Numbers',
      description: 'Add page numbers',
      icon: Hash,
      href: '/tools/page-numbers',
      color: 'from-green-500 to-teal-500'
    },
    {
      name: 'Crop',
      description: 'Crop PDF pages',
      icon: Crop,
      href: '/tools/crop',
      color: 'from-red-500 to-orange-500'
    },
    // NEW TOOLS - THESE 3
    {
      name: 'WORD to PDF',
      description: 'Convert .docx to PDF',
      icon: FileText,
      href: '/tools/word-to-pdf',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      name: 'Repair PDF',
      description: 'Fix corrupted files',
      icon: Wrench,
      href: '/tools/repair',
      color: 'from-orange-600 to-red-600'
    },
    {
      name: 'Redact PDF',
      description: 'Remove sensitive info',
      icon: EyeOff,
      href: '/tools/redact',
      color: 'from-purple-600 to-pink-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">All PDF Tools</h1>
          <p className="text-xl text-gray-600">Choose from {tools.length} professional tools</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.name} href={tool.href}>
                <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer group hover:scale-105">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.name}</h3>
                  <p className="text-sm text-gray-600">{tool.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}