/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Use basePath in development (npm run dev), no basePath in production
  basePath: "/hamster-quest", // process.env.NODE_ENV === 'development' ? "/hamster-quest" : ""
  assetPrefix: "/hamster-quest", // process.env.NODE_ENV === 'development' ? "/hamster-quest" : ""
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
