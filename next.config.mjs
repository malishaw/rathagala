import withPlaiceholder from "@plaiceholder/next";
import { hostname } from "os";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.AWS_S3_BUCKET + ".s3." + process.env.AWS_REGION + ".amazonaws.com",
      }
    ]
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
  },

};

export default withPlaiceholder(nextConfig);
