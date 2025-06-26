const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
});

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA(withMDX({
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
      };
    }
    return config;
  },
  // Added comment to invalidate cache
}));

module.exports = nextConfig;
