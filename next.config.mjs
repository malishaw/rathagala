import withPlaiceholder from "@plaiceholder/next";
import { hostname } from "os";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.AWS_S3_BUCKET + ".s3." + process.env.AWS_REGION + ".amazonaws.com",
      },
      {
        protocol: 'https',
        hostname: 'donext-org.s3.eu-west-2.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'sumudu-s3-test.s3.us-east-1.amazonaws.com',
        pathname: '/**',
      },
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
