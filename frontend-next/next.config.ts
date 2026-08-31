import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'export',
    trailingSlash: true,
    devIndicators: false,
    images: { unoptimized: true },
    outputFileTracingRoot: process.cwd(),
    allowedDevOrigins: ['127.0.0.1'],
    experimental: {
        staticGenerationRetryCount: 2,
        staticGenerationMaxConcurrency: 1,
        staticGenerationMinPagesPerWorker: 500,
    },
};

export default nextConfig;
