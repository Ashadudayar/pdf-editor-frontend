export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
            <p>
              We collect minimal information necessary to provide our services:
              uploaded PDF files (temporarily), usage analytics, and cookies for ads.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. File Handling</h2>
            <p>
              All uploaded PDF files are automatically deleted from our servers 
              after 24 hours. We do not read, store permanently, or share your 
              PDF content with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Cookies and Tracking</h2>
            <p>
              We use cookies for Google Analytics (to understand how users interact 
              with our site) and Google AdSense (to display relevant advertisements).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Third-Party Services</h2>
            <p>
              We use Google Analytics and Google AdSense. These services may collect 
              information as described in their respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, please contact us at: 
              support@pdfdoor.com
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