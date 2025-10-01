import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {}
  },
  pageExtensions: ["ts", "tsx", "js", "jsx", "mdx"]
};

export default withMDX(nextConfig);
