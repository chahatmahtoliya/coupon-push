import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'export',
    turbopack: { root: 'D:/Cpush' },
    trailingSlash: true,
    devIndicators: false,
    images: { unoptimized: true },
    outputFileTracingRoot: 'D:/Cpush',
    allowedDevOrigins: ['127.0.0.1'],
    experimental: {
        staticGenerationRetryCount: 2,
        staticGenerationMaxConcurrency: 1,
        staticGenerationMinPagesPerWorker: 500,
    },
};

export default nextConfig;


