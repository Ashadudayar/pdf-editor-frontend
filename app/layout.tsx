export const metadata: Metadata = {
  title: "PDFDoor - Free Online PDF Tools | Edit, Convert, Compress PDFs",
  description: "Free online PDF tools to edit, convert, merge, split, compress, and secure your PDFs. 28+ professional PDF tools. No signup required. Fast, secure, and free forever.",
  keywords: "PDF editor, PDF converter, merge PDF, split PDF, compress PDF, PDF tools online, free PDF editor, edit PDF, convert PDF to Word, Word to PDF",
  authors: [{ name: "PDFDoor" }],
  creator: "PDFDoor",
  publisher: "PDFDoor",
  metadataBase: new URL('https://pdf-editor-frontend-flax.vercel.app'), // Change this to your domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'PDFDoor - Free Online PDF Tools',
    description: 'Edit, convert, and manage PDFs online for free. 28+ professional tools.',
    url: 'https://pdf-editor-frontend-flax.vercel.app', // Change this
    siteName: 'PDFDoor',
    images: [
      {
        url: '/og-image.png', // We'll create this
        width: 1200,
        height: 630,
        alt: 'PDFDoor - Free PDF Tools',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDFDoor - Free Online PDF Tools',
    description: 'Edit, convert, and manage PDFs online for free',
    images: ['/twitter-image.png'],
    creator: '@pdfdoor', // Change to your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add after Google Search Console setup
  },
};