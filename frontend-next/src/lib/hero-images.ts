import manifest from '@/data/hero-images.json';

type HeroImage = { width: number; height: number; variants: Array<{ width: number; src: string }> };

export function getHeroImage(url: string) {
    const images = manifest as Record<string, HeroImage>;
    // The release snapshot uses the media host, while the live API returns the
    // backend host. Both URLs can refer to the same historical upload.
    let image = images[url];
    if (!image) {
        try {
            const candidate = new URL(url);
            const ownHosts = ['couponpush.com', 'www.couponpush.com', 'api.couponpush.com', 'media.couponpush.com'];
            if (ownHosts.includes(candidate.hostname) && candidate.pathname.startsWith('/uploads/hero/')) {
                const match = Object.entries(images).find(([source]) => {
                    const original = new URL(source);
                    return ownHosts.includes(original.hostname) && original.pathname === candidate.pathname && original.search === candidate.search;
                });
                if (match) image = match[1];
            }
        } catch { /* Unrecognized URLs retain the original image. */ }
    }
    if (!image) return { src: url, srcSet: undefined, width: undefined, height: undefined };
    return {
        src: image.variants.find(variant => variant.width >= 1200)?.src || image.variants.at(-1)!.src,
        srcSet: image.variants.map(variant => `${variant.src} ${variant.width}w`).join(', '),
        width: image.width,
        height: image.height,
    };
}

export const heroMainSizes = '(max-width: 620px) calc(100vw - 28px), (max-width: 760px) calc(100vw - 40px), (max-width: 1260px) calc(66.667vw - 37px), 804px';
export const heroSideSizes = '(max-width: 760px) calc(50vw - 26px), (max-width: 1260px) calc(33.333vw - 19px), 402px';
