/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  trailingSlash: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        port: "",
        pathname: "/avatars/**",
      },
    ],
  },
};

module.exports = nextConfig;
