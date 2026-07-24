/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
  turbopack: {
    root: process.cwd()
  }
};

export default nextConfig;
