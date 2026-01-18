import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'tree-sitter', 'tree-sitter-cpp'];
    }
    return config;
  },
};

export default nextConfig;
