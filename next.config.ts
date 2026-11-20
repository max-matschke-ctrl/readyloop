import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Nachweis-PDFs bis 10 MB (PDF_MAX_BYTES) plus Formularfelder; Standard wären 1 MB.
    serverActions: {
      bodySizeLimit: "11mb",
      // GitHub Codespaces leitet Ports über *.app.github.dev weiter.
      allowedOrigins: ["localhost:3000", "*.app.github.dev"],
    },
  },
};

export default nextConfig;
