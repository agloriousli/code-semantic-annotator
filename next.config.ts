import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence Turbopack warning and allow explicit config
  turbopack: {},

  // Ensure native tree-sitter modules stay external for both bundlers
  serverExternalPackages: ['tree-sitter', 'tree-sitter-cpp'],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'tree-sitter', 'tree-sitter-cpp'];
    }
    return config;
  },
};

export default nextConfig;
