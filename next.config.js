/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Tauri expects output in 'out' directory
  distDir: 'out',
  // Explicitly set workspace root to silence warning
  outputFileTracingRoot: require('path').join(__dirname),
}

module.exports = nextConfig
