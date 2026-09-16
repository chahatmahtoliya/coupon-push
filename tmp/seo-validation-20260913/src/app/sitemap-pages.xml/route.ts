import { getSiteNavigation } from '@/lib/site-navigation';
import { sitemapResponse } from '@/lib/sitemap-xml';
export const dynamic = 'force-static';
export function GET() { return sitemapResponse(getSiteNavigation().pages); }
