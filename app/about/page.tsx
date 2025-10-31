export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About PDFDoor</h1>
        
        <div className="space-y-6 text-lg">
          <p>
            PDFDoor is a free online PDF editor that makes it easy to 
            work with PDF documents without installing any software.
          </p>
          
          <p>
            Our mission is to provide powerful PDF editing tools that are:
          </p>
          
          <ul className="list-disc ml-6 space-y-2">
            <li>100% free to use</li>
            <li>Privacy-focused (files deleted after 24 hours)</li>
            <li>Fast and easy to use</li>
            <li>Accessible from any device</li>
          </ul>
          
          <p>
            Built with modern web technologies including Next.js and Django,
            PDFDoor is constantly improving with new features based on user feedback.
          </p>
        </div>
      </div>
    </div>
  );
}