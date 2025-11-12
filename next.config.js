/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Tauri expects output in 'out' directory
  distDir: 'out',
}

module.exports = nextConfig
