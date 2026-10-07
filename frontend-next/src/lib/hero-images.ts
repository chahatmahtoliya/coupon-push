import manifest from '@/data/hero-images.json';

type HeroImage = { width: number; height: number; backgroundColor?: string; variants: Array<{ width: number; src: string }> };

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
    if (!image) return { src: url, srcSet: undefined, width: undefined, height: undefined, backgroundColor: undefined };
    return {
        backgroundColor: image.backgroundColor,
        src: image.variants.find(variant => variant.width >= 1200)?.src || image.variants.at(-1)!.src,
        srcSet: image.variants.map(variant => `${variant.src} ${variant.width}w`).join(', '),
        width: image.width,
        height: image.height,
    };
}

export const heroMainSizes = '(max-width: 620px) calc(88vw - 25px), (max-width: 1000px) calc(46vw - 12px), (max-width: 2000px) calc(30.667vw - 16px), calc(33.333vw - 70px)';
