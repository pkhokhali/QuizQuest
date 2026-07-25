import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH when hosting under a sub-path
// (e.g. "/QuizQuest" for GitHub Pages project sites).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Static export: every page is client-rendered against the QuizQuest API,
  // so the portal can be hosted on any static host (GitHub Pages included).
  output: "export",
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
