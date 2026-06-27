import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/photo-sheet-printer',
  assetPrefix: '/photo-sheet-printer/',
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
