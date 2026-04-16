import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/buy-house" : "", // 프로덕션(배포) 환경에서만 basePath 적용
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
