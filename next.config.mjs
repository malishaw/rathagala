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
      },
      {
        protocol: "https",
        hostname: "donext-org.s3.eu-west-2.amazonaws.com"
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
