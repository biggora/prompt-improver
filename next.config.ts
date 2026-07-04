import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

function getOllamaOrigin(): string {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "http://localhost:11434",
    ).origin;
  } catch {
    return "http://localhost:11434";
  }
}

const ollamaOrigin = getOllamaOrigin();

const contentSecurityPolicy = `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ${ollamaOrigin} http://127.0.0.1:11434${isDev ? " ws: wss:" : ""}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
