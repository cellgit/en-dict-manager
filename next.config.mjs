import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb' // 增加到 100MB 以支持大数据导入
    }
  },
  pageExtensions: ["ts", "tsx", "js", "jsx", "mdx"]
};

export default withMDX(nextConfig);
