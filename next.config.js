/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return {
      // app.propelcoaches.com serves the B2C landing page at its root.
      // Requires the domain to be attached to the Vercel project.
      beforeFiles: [
        {
          source: '/',
          has: [{ type: 'host', value: 'app.propelcoaches.com' }],
          destination: '/app',
        },
      ],
    }
  },
  images: { unoptimized: true },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    // Ensure the Mission Control HTML asset is bundled into the
    // serverless function so readFileSync can find it at runtime.
    outputFileTracingIncludes: {
      '/mission-control': ['./src/data/mission-control.html'],
    },
  },
}
module.exports = nextConfig
