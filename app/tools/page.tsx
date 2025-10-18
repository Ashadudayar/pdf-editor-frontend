'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileSearch,
  Merge,
  Split,
  RotateCw,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

const tools = [
  {
    id: 'find-replace',
    name: 'Find & Replace',
    description: 'Search and replace text in your PDF documents',
    icon: FileSearch,
    color: 'from-blue-500 to-cyan-500',
    href: '/tools/find-replace',
  },
  {
    id: 'merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDF files into one document',
    icon: Merge,
    color: 'from-purple-500 to-pink-500',
    href: '/tools/merge',
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Extract pages or split PDF into multiple files',
    icon: Split,
    color: 'from-orange-500 to-red-500',
    href: '/tools/split',
  },
  {
    id: 'rotate',
    name: 'Rotate Pages',
    description: 'Rotate PDF pages by 90°, 180°, or 270°',
    icon: RotateCw,
    color: 'from-green-500 to-emerald-500',
    href: '/tools/rotate',
  },
];

export default function ToolsPage() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-purple-300 hover:text-purple-200 mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-12 h-12 text-purple-400" />
            PDF Tools
          </h1>
          <p className="text-purple-200 text-xl">
            Professional PDF editing tools at your fingertips
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isHovered = hoveredTool === tool.id;

            return (
              <Link
                key={tool.id}
                href={tool.href}
                onMouseEnter={() => setHoveredTool(tool.id)}
                onMouseLeave={() => setHoveredTool(null)}
                className="group relative"
              >
                <div
                  className={`relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 transition-all duration-300 ${
                    isHovered
                      ? 'transform scale-105 shadow-2xl shadow-purple-500/20'
                      : 'hover:bg-white/15'
                  }`}
                >
                  {/* Gradient Background on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${tool.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-200 transition">
                      {tool.name}
                    </h3>

                    <p className="text-purple-200 mb-4">{tool.description}</p>

                    <div className="flex items-center text-purple-300 group-hover:text-purple-200 transition">
                      <span className="text-sm font-medium">Launch Tool</span>
                      <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Animated Border on Hover */}
                  <div
                    className={`absolute inset-0 rounded-2xl border-2 ${
                      isHovered ? 'border-purple-400' : 'border-transparent'
                    } transition-colors duration-300`}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Coming Soon
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Compress PDF',
              'PDF to Images',
              'Add Watermark',
              'Password Protect',
            ].map((feature) => (
              <div
                key={feature}
                className="bg-white/5 rounded-lg p-4 text-center border border-white/10"
              >
                <p className="text-purple-300 text-sm font-medium">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30 text-center">
            <div className="text-3xl font-bold text-white mb-2">4</div>
            <div className="text-blue-200 text-sm">Active Tools</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 text-center">
            <div className="text-3xl font-bold text-white mb-2">100%</div>
            <div className="text-purple-200 text-sm">Free to Use</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-xl p-6 border border-green-500/30 text-center">
            <div className="text-3xl font-bold text-white mb-2">∞</div>
            <div className="text-green-200 text-sm">No Limits</div>
          </div>
        </div>
      </div>
    </div>
  );
}