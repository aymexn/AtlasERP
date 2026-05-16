import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  turbopack: {
    root: '.',
  },
  allowedDevOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
};

export default withNextIntl(nextConfig);
