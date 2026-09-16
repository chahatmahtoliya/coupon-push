'use client';

import { useState } from 'react';

interface Store {
    name: string;
    slug: string;
    count: number;
}

interface FilterSidebarProps {
    stores?: Store[];
    onSortChange?: (sort: string) => void;
    onStoreChange?: (stores: string[]) => void;
    onDiscountChange?: (discounts: string[]) => void;
    onTypeChange?: (types: string[]) => void;
    onValidityChange?: (validity: string) => void;
}

export function FilterSidebar({
    stores = [],
    onSortChange,
    onStoreChange,
    onDiscountChange,
    onTypeChange,
    onValidityChange
}: FilterSidebarProps) {
    const [sortBy, setSortBy] = useState('popular');
    const [storeSearch, setStoreSearch] = useState('');
    const [selectedStores, setSelectedStores] = useState<string[]>([]);
    const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [validity, setValidity] = useState('all');

    const discountOptions = [
        { value: 'under10', label: 'Under 10% Off' },
        { value: '10-25', label: '10% - 25% Off' },
        { value: '25-50', label: '25% - 50% Off' },
        { value: '50-75', label: '50% - 75% Off' },
        { value: '75plus', label: '75% or more' }
    ];

    const typeOptions = [
        { value: 'percentage', label: '% Off Discount' },
        { value: 'fixed', label: '$ Off Discount' },
        { value: 'freeshipping', label: 'Free Shipping' },
        { value: 'nocode', label: 'No Code Required' }
    ];

    const validityOptions = [
        { value: 'new', label: 'New Arrivals', badge: 'NEW' },
        { value: 'expiring', label: 'Expires Soon', badge: 'HOT' },
        { value: 'all', label: 'All Active', badge: null }
    ];

    const handleSortChange = (value: string) => {
        setSortBy(value);
        onSortChange?.(value);
    };

    const handleStoreToggle = (slug: string) => {
        const newSelected = selectedStores.includes(slug)
            ? selectedStores.filter(s => s !== slug)
            : [...selectedStores, slug];
        setSelectedStores(newSelected);
        onStoreChange?.(newSelected);
    };

    const handleDiscountToggle = (value: string) => {
        const newSelected = selectedDiscounts.includes(value)
            ? selectedDiscounts.filter(d => d !== value)
            : [...selectedDiscounts, value];
        setSelectedDiscounts(newSelected);
        onDiscountChange?.(newSelected);
    };

    const handleTypeToggle = (value: string) => {
        const newSelected = selectedTypes.includes(value)
            ? selectedTypes.filter(t => t !== value)
            : [...selectedTypes, value];
        setSelectedTypes(newSelected);
        onTypeChange?.(newSelected);
    };

    const handleValidityChange = (value: string) => {
        setValidity(value);
        onValidityChange?.(value);
    };

    const resetStores = () => {
        setSelectedStores([]);
        onStoreChange?.([]);
    };

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(storeSearch.toLowerCase())
    );

    return (
        <aside className="filter-sidebar">
            {/* Sort By */}
            <div className="filter-section">
                <h4 className="filter-section-title">SORT BY</h4>
                <div className="filter-select-wrapper">
                    <select
                        className="filter-select"
                        value={sortBy}
                        onChange={(e) => handleSortChange(e.target.value)}
                    >
                        <option value="popular">Most Popular</option>
                        <option value="newest">Newest First</option>
                        <option value="expiring">Expiring Soon</option>
                        <option value="discount">Highest Discount</option>
                    </select>
                    <i className="fas fa-chevron-down filter-select-icon"></i>
                </div>
            </div>

            {/* Stores Filter */}
            <div className="filter-section">
                <div className="filter-section-header">
                    <h4 className="filter-section-title">Stores</h4>
                    {selectedStores.length > 0 && (
                        <button className="filter-reset" onClick={resetStores}>Reset</button>
                    )}
                </div>
                <div className="filter-search">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Find a store..."
                        value={storeSearch}
                        onChange={(e) => setStoreSearch(e.target.value)}
                    />
                </div>
                <div className="filter-checkbox-list">
                    {filteredStores.slice(0, 5).map(store => (
                        <label key={store.slug} className="filter-checkbox-item">
                            <input
                                type="checkbox"
                                checked={selectedStores.includes(store.slug)}
                                onChange={() => handleStoreToggle(store.slug)}
                            />
                            <span className="filter-checkbox-custom"></span>
                            <span className="filter-checkbox-label">{store.name}</span>
                            <span className="filter-checkbox-count">{store.count}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Discount Percentage */}
            <div className="filter-section">
                <h4 className="filter-section-title">Discount Percentage</h4>
                <div className="filter-checkbox-list">
                    {discountOptions.map(option => (
                        <label key={option.value} className="filter-checkbox-item">
                            <input
                                type="checkbox"
                                checked={selectedDiscounts.includes(option.value)}
                                onChange={() => handleDiscountToggle(option.value)}
                            />
                            <span className="filter-checkbox-custom"></span>
                            <span className="filter-checkbox-label">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Coupon Type */}
            <div className="filter-section">
                <h4 className="filter-section-title">Coupon Type</h4>
                <div className="filter-checkbox-list">
                    {typeOptions.map(option => (
                        <label key={option.value} className="filter-checkbox-item">
                            <input
                                type="checkbox"
                                checked={selectedTypes.includes(option.value)}
                                onChange={() => handleTypeToggle(option.value)}
                            />
                            <span className="filter-checkbox-custom"></span>
                            <span className="filter-checkbox-label">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Validity */}
            <div className="filter-section">
                <h4 className="filter-section-title">Validity</h4>
                <div className="filter-radio-list">
                    {validityOptions.map(option => (
                        <label key={option.value} className="filter-radio-item">
                            <input
                                type="radio"
                                name="validity"
                                checked={validity === option.value}
                                onChange={() => handleValidityChange(option.value)}
                            />
                            <span className="filter-radio-custom"></span>
                            <span className="filter-radio-label">{option.label}</span>
                            {option.badge && (
                                <span className={`filter-badge filter-badge-${option.badge.toLowerCase()}`}>
                                    {option.badge}
                                </span>
                            )}
                        </label>
                    ))}
                </div>
            </div>
        </aside>
    );
}

export default FilterSidebar;
