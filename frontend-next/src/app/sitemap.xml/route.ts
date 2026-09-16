import { sitemapIndexResponse } from '@/lib/sitemap-xml';
export const dynamic = 'force-static';
export function GET() { return sitemapIndexResponse(); }
