import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind v4 로더. create-next-app(16.4~)이 이 파일에 넣는 설정이라 스타터로 덮어써도 빠지지 않게 둔다.
  // 빠지면 빌드는 통과하지만 Tailwind 클래스가 하나도 생성되지 않는다.
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // 같은 도메인 /blog 프록시를 쓰면 켠다 (references/blog-proxy.md)
  // skipTrailingSlashRedirect: true,
  // skipProxyUrlNormalize: true,
  async redirects() {
    return [
      // 지우거나 합친 페이지는 301로 가장 가까운 페이지에 넘긴다. 색인된 주소를 404로 두지 않는다.
      // { source: "/old-page", destination: "/new-page", permanent: true },
    ];
  },
};

export default nextConfig;
