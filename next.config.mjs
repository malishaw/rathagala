import withPlaiceholder from "@plaiceholder/next";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rathagala.s3.ap-south-1.amazonaws.com"
      },
      {
        protocol: "https",
        hostname: "kidlink.s3.ap-south-1.amazonaws.com"
      }
    ]
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // (optional) Skip ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withPlaiceholder(nextConfig);
