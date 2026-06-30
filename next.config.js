/** @type {import('next').NextConfig} */
const { getStaticSecurityHeaders } = require('./security-headers')

const staticSecurityHeaders = getStaticSecurityHeaders()

const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: staticSecurityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
