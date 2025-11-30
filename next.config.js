/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // basePath: "/hamster-quest",  // Commented out for local development
  // assetPrefix: "/hamster-quest",  // Commented out for local development
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
