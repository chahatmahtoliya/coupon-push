import type { ComponentPropsWithRef } from 'react';

type Props = Omit<ComponentPropsWithRef<'a'>, 'href'> & { href: string };

export default function SiteLink({ href, ...props }: Props) {
    // Pages are complete static documents. Load them directly instead of
    // depending on a prefetched App Router payload from a potentially older build.
    if (href.startsWith('/') && !href.startsWith('//')) {
        const url = new URL(href, 'https://couponpush.com');
        const pathname = url.pathname.endsWith('/') || url.pathname.split('/').pop()?.includes('.')
            ? url.pathname
            : `${url.pathname}/`;
        return <a {...props} href={`${pathname}${url.search}${url.hash}`} />;
    }
    return <a {...props} href={href} />;
}
