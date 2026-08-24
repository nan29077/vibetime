// 이미지 최적화 허용 원격 호스트 (와일드카드 금지)
const S3_HOST =
  process.env.AWS_S3_BUCKET && process.env.AWS_S3_REGION
    ? `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com`
    : null;

const IMAGE_HOSTS = [
  "images.unsplash.com",   // 데모/시드 상품 이미지
  "storage.vibetime.com",  // 서비스 스토리지
  "cdn.vibetime.com",      // 서비스 CDN
  S3_HOST,
  ...(process.env.NEXT_PUBLIC_IMAGE_HOSTS || "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean),
].filter(Boolean);

const imageRemotePatterns = [...new Set(IMAGE_HOSTS)].map((hostname) => ({
  protocol: "https",
  hostname,
}));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Isolate this app's Next output from stale files held by a previous local preview.
  // Docker 빌드 시: VT_NEXT_DIST_DIR=.next 으로 설정하여 표준 경로 사용
  distDir: process.env.VT_NEXT_DIST_DIR || ".next-vibetime",
  // AWS 배포 시 standalone 출력 모드 사용 (Docker 이미지 최적화)
  // 로컬 개발 시 standalone 출력은 비활성화 (번들 크기 축소 목적)
  output: process.env.VT_NEXT_DIST_DIR ? "standalone" : undefined,

  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    // 와일드카드("**") 금지 — 임의 외부 호스트를 이미지 최적화 프록시로
    // 악용당하지 않도록 실제 사용하는 도메인만 허용한다.
    // 추가 도메인이 필요하면 NEXT_PUBLIC_IMAGE_HOSTS 에 쉼표로 나열한다.
    remotePatterns: imageRemotePatterns,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  webpack: (config, { dev }) => {
    // Prevent stale Fast Refresh module records in tunnel/mobile development previews.
    if (dev) config.cache = false;
    return config;
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/_next/static/(.*)",
        // Dev preview URLs keep the same chunk paths between hot reloads.
        // Do not let mobile browsers retain an outdated module factory.
        headers: [{ key: "Cache-Control", value: process.env.NODE_ENV === "production" ? "public, max-age=31536000, immutable" : "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
