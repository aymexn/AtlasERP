import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin();

const nextConfig: any = {
  // Fix: Move allowedDevOrigins to the root level for Next.js 16
  allowedDevOrigins: [
    'localhost:3001',
    '127.0.0.1:3001',
    '172.23.80.1:3001'
  ],

  experimental: {
    turbopack: {
      // Force locking onto the explicit web directory context execution path
      root: path.resolve(__dirname),
    }
  },

  devIndicators: {
    appIsrStatus: false,
  }
};

export default withNextIntl(nextConfig as NextConfig);
