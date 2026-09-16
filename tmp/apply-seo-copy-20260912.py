from pathlib import Path
root=Path('frontend-next')
def edit(name, old, new):
 p=root/name
 s=p.read_text(encoding='utf-8')
 assert old in s, (name,old[:80])
 p.write_text(s.replace(old,new),encoding='utf-8')
edit('src/app/HomePageClient.tsx','<EmptyState label="No featured backend offers are available right now." />','<section className="cp-container"><p>Find offers from your favourite stores. Compare the terms before you shop.</p><Link href="/stores/">Browse stores and offers</Link></section>')
edit('src/app/store/[slug]/StorePageClient.tsx',"import { CouponDescription } from '@/components/common/CouponDescription';", "import { CouponDescription } from '@/components/common/CouponDescription';\nimport { OfferEvidence } from '@/components/common/OfferEvidence';\nimport { isCheckoutTested } from '@/lib/offer-evidence';")
edit('src/app/store/[slug]/StorePageClient.tsx','coupons.filter((coupon) => coupon.is_verified).length','coupons.filter(isCheckoutTested).length')
edit('src/app/store/[slug]/StorePageClient.tsx',"'are'} marked as verified.","'are'} recorded as checkout tested. A past test does not guarantee account eligibility.")
edit('src/app/store/[slug]/StorePageClient.tsx','{coupon.is_verified && <span className="store-ui-success"><i className="fa-solid fa-circle-check" aria-hidden="true" /> Verified offer</span>}','')
edit('src/app/store/[slug]/StorePageClient.tsx','</span></div></div><div className="store-ui-coupon-actions">','</span></div><OfferEvidence coupon={coupon} /></div><div className="store-ui-coupon-actions">')
edit('src/app/store/[slug]/StorePageClient.tsx','`${displayName} hosting deal guide`','`${displayName} offer guide`')
edit('src/app/store/[slug]/page.tsx',"pseo?.metaTitle || `${storeName} Coupon Codes & Offers`", "`${storeName} ${codeCount ? 'Coupon Codes & Offers' : 'Offers & Deals'}`")
edit('src/app/store/[slug]/page.tsx',"name: pseo?.h1 || `${storeName} Coupon Codes & Offers`,", "name: pseo?.h1 || `${storeName} ${codeCount ? 'Coupon Codes & Offers' : 'Offers & Deals'}`,")
edit('src/app/store/[slug]/page.tsx','customDescription || pseo?.metaDescription ||','pseo?.metaDescription || customDescription ||')
edit('src/app/store/[slug]/page.tsx','const title = customTitle &&','const title = pseo?.metaTitle || (customTitle &&')
edit('src/app/store/[slug]/page.tsx'," : 'Offers & Deals'}`;", " : 'Offers & Deals'}`);")
p=root/'src/components/features/TrendingProductCard.tsx'
s=p.read_text(encoding='utf-8')
s=s.replace("import type { Coupon } from '@/types';", "import type { Coupon } from '@/types';\nimport { isCheckoutTested } from '@/lib/offer-evidence';")
start=s.index('        const storeLower =')
end=s.index('\n    const handleCardClick',start)
s=s[:start]+'''        return { text: isCheckoutTested(coupon) ? `Checkout tested: ${coupon.store_name}` : `Listed on ${coupon.store_name || 'Store'}`, icon: isCheckoutTested(coupon) ? 'check' : 'tag' };
    }, [coupon]);
''' + s[end:]
p.write_text(s,encoding='utf-8')
for name in ['src/app/page.tsx','src/app/layout.tsx']:
 edit(name,'Find verified coupon codes, exclusive deals, and promo codes for top stores including Amazon, Flipkart, Myntra, and Zomato.','Compare coupon codes and shopping offers in India. Browse stores, check offer conditions and find savings for your next order.')
