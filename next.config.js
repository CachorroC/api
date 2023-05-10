/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    typedRoutes: true,
  },
  env: {
    PORT: "6969",
  },
};

module.exports = nextConfig;
