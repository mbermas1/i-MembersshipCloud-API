/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Define your CORS headers here
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          // Add other CORS headers as needed
        ],
      },
    ];
  },
  server: {
    port: 3011,
  },
};

export default nextConfig;

