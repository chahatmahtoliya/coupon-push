import type { Metadata } from 'next';
import { categoriesApi } from '@/services/api';
import type { Category } from '@/types';
import { deployedSnapshot } from '@/lib/deployed-snapshot';
import CategoriesPageClient from './CategoriesPageClient';

export const metadata: Metadata = {
    title: 'Coupon Categories',
    description: 'Browse verified coupon codes and online deals by category.',
};

export default async function CategoriesPage() {
    let initialCategories: Category[] = deployedSnapshot.categoriesPage?.initialCategories || [];
    try {
        initialCategories = await categoriesApi.getAll();
    } catch (error) {
        console.error('Failed to fetch categories:', error);
    }
    return <CategoriesPageClient initialCategories={initialCategories} />;
}
