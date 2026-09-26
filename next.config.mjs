/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    // Skip type-checking on production build to speed up build and save memory on 1GB VPS
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Drastically reduces memory consumption and build time by tree-shaking icon/UI libraries
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "framer-motion",
      "@radix-ui/react-icons",
    ],
  },
};

export default nextConfig;
