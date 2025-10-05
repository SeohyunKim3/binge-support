import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname, // 👈 명시적으로 현재 폴더를 root로 지정
  },
  /* config options here */
};

export default nextConfig;
