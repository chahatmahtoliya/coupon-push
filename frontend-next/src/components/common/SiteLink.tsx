import NextLink from 'next/link';
import type { ComponentPropsWithRef } from 'react';

type Props = Omit<ComponentPropsWithRef<'a'>, 'href'> & { href: string };

export default function SiteLink({ href, ...props }: Props) {
    // Store pages are complete static documents. Load them directly instead of
    // depending on a prefetched App Router payload from a potentially older build.
    if (href.startsWith('/store/')) {
        const url = new URL(href, 'https://couponpush.com');
        const pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
        return <a {...props} href={`${pathname}${url.search}${url.hash}`} />;
    }
    return <NextLink {...props} href={href} />;
}
