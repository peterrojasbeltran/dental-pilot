import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // El lint se ejecuta por separado. Esto evita bloqueos del build con ESLint 9 en algunos entornos.
    ignoreDuringBuilds: true
  },
  typescript: {
    // QA ejecuta `npm run typecheck` antes del build. Esto evita doble validación lenta en entornos limitados.
    ignoreBuildErrors: true
  }
};

export default nextConfig;
