import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/buy-house", // 레포지토리 이름과 동일하게 설정
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
