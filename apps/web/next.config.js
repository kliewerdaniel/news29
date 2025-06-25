const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
});

/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'mdx'],
});

module.exports = nextConfig;
