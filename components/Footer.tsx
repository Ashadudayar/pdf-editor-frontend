'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-white/10 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* About Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">PDFDoor</h3>
            <p className="text-gray-400 text-sm">
              Free online PDF editor with privacy first approach.
            </p>
          </div>

          {/* Tools Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Tools</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tools/find-replace" className="text-gray-400 hover:text-purple-400 text-sm">
                  Find & Replace
                </Link>
              </li>
              <li>
                <Link href="/tools/merge" className="text-gray-400 hover:text-purple-400 text-sm">
                  Merge PDFs
                </Link>
              </li>
              <li>
                <Link href="/tools/split" className="text-gray-400 hover:text-purple-400 text-sm">
                  Split PDFs
                </Link>
              </li>
              <li>
                <Link href="/editor" className="text-gray-400 hover:text-purple-400 text-sm">
                  PDF Editor
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-purple-400 text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-purple-400 text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-purple-400 text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm">
                support@pdfdoor.com
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 PDFDoor. All rights reserved. | Files are automatically deleted after 24 hours.
          </p>
        </div>
      </div>
    </footer>
  );
}