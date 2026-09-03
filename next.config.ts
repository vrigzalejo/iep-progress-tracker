import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker/K8s need standalone. Vercel builds the default Next.js output.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "@prisma/client", "@supabase/supabase-js", "nodemailer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
  },
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/pg/**/*",
      "./node_modules/pg-pool/**/*",
      "./node_modules/@prisma/adapter-pg/**/*",
      "./src/generated/prisma/**/*",
    ],
  },
  poweredByHeader: false,
  agentRules: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
