from pathlib import Path
import shutil, subprocess
src = Path('D:/Cpush')
dst = Path('D:/Cpush-seo-release')
files = '''.htaccess
frontend-next/package.json
frontend-next/package-lock.json
frontend-next/scripts/prepare-catalog.mjs
frontend-next/scripts/prepare-redirects.mjs
frontend-next/scripts/check-seo-audit.cjs
frontend-next/scripts/check-seo-storefront.py
frontend-next/src/app/HomePageClient.tsx
frontend-next/src/app/about/page.tsx
frontend-next/src/app/coupons/CouponsPageClient.tsx
frontend-next/src/app/layout.tsx
frontend-next/src/app/page.tsx
frontend-next/src/app/store/[slug]/StorePageClient.tsx
frontend-next/src/app/store/[slug]/page.tsx
frontend-next/src/components/common/CouponModal.tsx
frontend-next/src/components/common/OfferEvidence.tsx
frontend-next/src/components/features/CouponCard.tsx
frontend-next/src/components/features/MaterialStoreCarousel.tsx
frontend-next/src/components/features/TrendingProductCard.tsx
frontend-next/src/lib/coupon-filters.ts
frontend-next/src/lib/deployed-snapshot.ts
frontend-next/src/lib/store-pseo.ts
frontend-next/src/lib/catalog-normalization.ts
frontend-next/src/lib/offer-evidence.ts
frontend-next/src/data/store-redirects.json
frontend-next/src/services/api.ts
frontend-next/src/types/index.ts'''.splitlines()
for file in files:
    (dst/file).parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src/file, dst/file)
def read(file): return (dst/file).read_text(encoding='utf-8')
def write(file, text): (dst/file).write_text(text, encoding='utf-8')
file = 'frontend-next/src/app/store/[slug]/StorePageClient.tsx'
write(file, read(file).replace('getStorePath, getCategoryPath', 'getStorePath').replace('getCategoryPath(store.category_slug)', "store.category_slug ? `/category/${store.category_slug}` : '/stores'"))
file = 'frontend-next/src/app/store/[slug]/page.tsx'
s = read(file).replace("import { getStoreGuide } from '@/lib/site-navigation';\n", '').replace("import Link from '@/components/common/SiteLink';\n", '')
start = s.index('        <nav className="container site-related-links"')
end = s.index('        </nav>', start) + len('        </nav>\n')
write(file, s[:start] + s[end:])
file = 'frontend-next/src/components/layout/Footer.tsx'
s = read(file)
start = s.index('                    <div className="cp-social-row">')
end = s.index('                    </div>', start) + len('                    </div>')
write(file, s[:start] + '                    <Link href="/about/#offer-checks">How we label offers</Link>' + s[end:])
file = 'frontend-next/src/lib/routes.ts'
s = read(file)
start = s.index('const STORE_SLUG_REDIRECTS:')
end = s.index('\n};', start) + 3
s = s[:start] + 'const STORE_SLUG_REDIRECTS: Readonly<Record<string, string>> = storeRedirects;' + s[end:]
write(file, "import storeRedirects from '@/data/store-redirects.json';\n" + s)
file = 'frontend-next/src/styles/seo.css'
css = '\n'.join(line for line in (src/file).read_text().splitlines() if line.startswith('.offer-evidence'))
write(file, read(file).rstrip() + '\n\n' + css + '\n')
print('Prepared SEO-only release tree; excluded concurrent navigation/blog/sitemap changes.')
