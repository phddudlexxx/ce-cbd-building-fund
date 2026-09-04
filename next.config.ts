import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["jspdf", "jspdf-autotable"],
};

export default nextConfig;
