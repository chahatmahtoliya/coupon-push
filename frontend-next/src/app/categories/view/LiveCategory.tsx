'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from '@/components/common/SiteLink';
import CategoryPageClient from '@/app/category/[slug]/CategoryPageClient';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import { getCategoryPath } from '@/lib/routes';

export default function LiveCategory() {
    const slug = useSearchParams().get('slug') || '';
    const router = useRouter();
    const categoryPath = getCategoryPath(slug);
    useEffect(() => {
        if (categoryPath !== '/categories/') router.replace(categoryPath);
    }, [categoryPath, router]);
    const categories = deployedSnapshot.categoriesPage?.initialCategories || [];
    const category = categories.find(category => category.slug === slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug === 'all-categories') {
        return <section className="cp-directory-shell cp-directory-empty"><h1>Choose a category</h1><p>Explore the directory to find your next category.</p><Link href="/categories/">Browse categories</Link></section>;
    }
    if (categoryPath !== '/categories/') {
        return <section className="cp-directory-shell"><p>Opening category…</p><Link href={categoryPath}>View category offers</Link></section>;
    }
    return <CategoryPageClient key={slug} slug={slug} initialCategories={categories} initialData={{
        coupons: [], stores: [], categoryName: category?.name || slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        categoryDescription: category?.description || '', categoryIcon: category?.icon || 'fa-tag',
    }} />;
}
