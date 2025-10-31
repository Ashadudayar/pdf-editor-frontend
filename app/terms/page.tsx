export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By using PDFDoor, you agree to these terms of service. If you do not 
              agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Service Description</h2>
            <p>
              PDFDoor provides free online PDF editing tools. We reserve the right 
              to modify, suspend, or discontinue any part of our service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Use the service only for lawful purposes</li>
              <li>Not upload files containing malware or illegal content</li>
              <li>Not attempt to harm or disrupt our services</li>
              <li>Not use the service to violate others' rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. File Upload Limits</h2>
            <p>
              Free tier users are limited to 5 PDF uploads per day, with a maximum 
              file size of 50MB per upload.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Disclaimer</h2>
            <p>
              The service is provided "as is" without warranties of any kind. We are 
              not responsible for any loss or damage resulting from your use of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Contact</h2>
            <p>
              For questions about these terms, contact us at: support@pdfdoor.com
            </p>
          </section>

          <section className="text-sm text-gray-400 mt-8">
            <p>Last updated: October 30, 2025</p>
          </section>
        </div>
      </div>
    </div>
  );
}