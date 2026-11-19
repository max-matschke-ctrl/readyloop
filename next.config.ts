import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Nachweis-PDFs bis 10 MB (PDF_MAX_BYTES) plus Formularfelder; Standard wären 1 MB.
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
