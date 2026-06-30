/** @type {import('next').NextConfig} */
const { getSecurityHeaders } = require('./security-headers')

const securityHeaders = getSecurityHeaders()

const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
