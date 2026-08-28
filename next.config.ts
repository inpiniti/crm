import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 첨부파일 업로드 (도메인 제한 20MB/파일, 여러 개 동시 업로드 여유분 포함)
      bodySizeLimit: "60mb",
    },
  },
};

export default nextConfig;
