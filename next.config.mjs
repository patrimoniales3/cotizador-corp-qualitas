/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    assetPrefix: '/cotizador-corp-qualitas/',
    basePath: '/cotizador-corp-qualitas',
    images: {
      unoptimized: true,
    },
    reactStrictMode: true,
  }
  
  export default nextConfig;