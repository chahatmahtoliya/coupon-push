'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { storesApi } from '@/services/api';
import type { StorePageData } from '@/types';
import StorePageClient from '../../store/[slug]/StorePageClient';

export default function LiveStore() {
    const [data, setData] = useState<StorePageData | null>(null);
    const slug = useSearchParams().get('slug') || '';
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        const requested = slug;
        setData(null);
        setError('');
        if (!requested) { setError('Choose a store from the directory.'); return; }
        storesApi.getBySlugFresh(requested).then(result => {
            if (!result?.store) throw new Error('Store not found');
            if (active) setData(result);
        }).catch(() => { if (active) setError('We could not load this store. Please try again shortly.'); });
        return () => { active = false; };
    }, [attempt, slug]);
    if (data) return <StorePageClient initialData={data} slug={slug} />;
    return <section className="container" aria-live="polite"><h1>{error ? 'Store unavailable' : 'Loading store offers…'}</h1><p>{error || 'Getting the latest offers from this store.'}</p>{error && <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button>}<p><Link href="/stores/">Browse stores</Link></p></section>;
}
