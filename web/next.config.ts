import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: any = {
  experimental: {
    // Explicitly unblock local loops and network IPs to stop browser panics
    allowedDevOrigins: [
      'localhost:3001',
      '127.0.0.1:3001',
      '172.23.80.1:3001'
    ],
  },
  devIndicators: {
    appIsrStatus: false,
  }
};

export default withNextIntl(nextConfig as NextConfig);
