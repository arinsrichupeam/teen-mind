/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    appIsrStatus: false,
  },
  experimental: {
    outputStandalone: true,
  },
};

module.exports = nextConfig;
