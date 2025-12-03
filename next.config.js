/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Only use basePath in production
  ...(process.env.NODE_ENV === 'production' && {
    basePath: "/hamster-quest",
    assetPrefix: "/hamster-quest",
  }),
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
