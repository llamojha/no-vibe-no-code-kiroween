/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    instrumentationHook: true,
  },
  // PostHog reverse proxy configuration for improved reliability
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://eu.i.posthog.com/decide",
      },
    ];
  },
  // Global trailing-slash redirect is disabled here; middleware.ts
  // restores the default behavior for all routes except PostHog /ingest endpoints.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
