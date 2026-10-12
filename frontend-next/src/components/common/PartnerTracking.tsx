'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { partnersEnabled } from '@/lib/partners-feature';

let visitor = '';
export function PartnerTracking() {
    const pathname = usePathname();
    useEffect(() => {
        if (!partnersEnabled || pathname.startsWith('/partners') || !('IntersectionObserver' in window)) return;
        try { visitor = sessionStorage.getItem('cp-partner-visitor') || visitor || crypto.randomUUID(); sessionStorage.setItem('cp-partner-visitor', visitor); }
        catch { visitor ||= crypto.randomUUID(); }
        const base = (process.env.NEXT_PUBLIC_PARTNER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.couponpush.com/api').replace(/\/$/, '');
        const seen = new Set<string>();
        const observed = new WeakSet<Element>();
        let frame = 0;
        const send = (type: 'store' | 'offer', value: string) => {
            const key = `${type}:${value}`;
            if (seen.has(key)) return;
            seen.add(key);
            void fetch(`${base}/partner-metrics.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', keepalive: true,
                body: JSON.stringify({ type, visitor, ...(type === 'store' ? { slug: value } : { id: Number(value) }) }), signal: AbortSignal.timeout(8000) }).catch(() => {});
        };
        const observer = new IntersectionObserver(entries => {
            for (const entry of entries) if (entry.isIntersecting) { const id = entry.target.getAttribute('data-coupon-id'); if (id) send('offer', id); observer.unobserve(entry.target); }
        }, { threshold: .5 });
        const scan = () => {
            const store = document.querySelector('[data-partner-store-slug]')?.getAttribute('data-partner-store-slug');
            if (store) send('store', store);
            for (const element of document.querySelectorAll('[data-coupon-id]')) if (!observed.has(element)) { observed.add(element); observer.observe(element); }
        };
        const mutations = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(scan); });
        mutations.observe(document.body, { childList: true, subtree: true });
        scan();
        return () => { observer.disconnect(); mutations.disconnect(); cancelAnimationFrame(frame); };
    }, [pathname]);
    return null;
}
