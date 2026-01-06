/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable trailing slashes for consistent routing
  trailingSlash: true,
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
    images: {
      unoptimized: true,
    },
  }
  
  export default nextConfig