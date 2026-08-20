'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Category } from '@/types';
import { categoriesApi } from '@/services/api';

export function CategoryBar() {
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        categoriesApi.getAll()
            .then(setCategories)
            .catch(console.error);
    }, []);

    // Default icons for categories
    const getIcon = (slug: string): string => {
        const icons: Record<string, string> = {
            electronics: 'fa-laptop',
            fashion: 'fa-tshirt',
            food: 'fa-utensils',
            travel: 'fa-plane',
            beauty: 'fa-spa',
            health: 'fa-heartbeat',
            home: 'fa-home',
            sports: 'fa-futbol',
            books: 'fa-book',
            entertainment: 'fa-film',
        };
        return icons[slug] || 'fa-tag';
    };

    return (
        <div className="category-bar">
            <div className="container">
                <div className="category-scroll">
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/category/${category.slug}`}
                            className="category-item"
                        >
                            <i className={`fas ${category.icon || getIcon(category.slug)}`} aria-hidden="true"></i>
                            {category.name}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CategoryBar;
