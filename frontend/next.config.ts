import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-only "N" badge sits bottom-left, on top of the meeting toolbar's Mute button.
  // Compile and runtime errors are still shown.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
