/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/**/*'],
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/api/uploads/:file*',
          destination: '/images/products/:file*',
        },
      ],
      fallback: [
        {
          source: '/images/products/:file*',
          destination: '/api/uploads/:file*',
        },
      ],
    };
  },
};

export default nextConfig;
