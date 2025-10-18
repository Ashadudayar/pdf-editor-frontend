/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Disable canvas and encoding for PDF.js
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    // Add rule for PDF.js worker
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    
    return config;
  },
};

module.exports = nextConfig;