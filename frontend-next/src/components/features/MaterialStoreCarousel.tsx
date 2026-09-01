'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Box, Typography, IconButton, Container } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import type { Coupon } from '@/types';
import { TrendingProductCard } from './TrendingProductCard';
import { CouponModal } from '@/components/common/CouponModal';
import { getStorePath } from '@/lib/routes';

interface MaterialStoreCarouselProps {
    title: string;
    coupons: Coupon[];
    storeSlug?: string;
    storeName?: string;
    storeLogo?: string;
    viewAllUrl?: string;
}

const tagTypes = ['top-pick', 'exclusive', 'exclusive', 'popular', 'exclusive', 'super-save'] as const;

export function MaterialStoreCarousel({
    title,
    coupons,
    storeSlug,
    storeName,
    storeLogo,
    viewAllUrl,
}: MaterialStoreCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

    const updateScrollButtons = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        updateScrollButtons();
        container.addEventListener('scroll', updateScrollButtons, { passive: true });
        window.addEventListener('resize', updateScrollButtons);
        return () => {
            container.removeEventListener('scroll', updateScrollButtons);
            window.removeEventListener('resize', updateScrollButtons);
        };
    }, [coupons, updateScrollButtons]);

    const handleScroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const cardWidth = container.firstElementChild ? (container.firstElementChild as HTMLElement).clientWidth + 16 : 220;
        const scrollAmount = cardWidth * (window.innerWidth < 600 ? 1.5 : window.innerWidth < 960 ? 2.5 : 4);
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    if (!coupons || coupons.length === 0) {
        return null;
    }

    const targetViewAll = viewAllUrl || (storeSlug ? getStorePath(storeSlug) : '/deals');

    return (
        <Box
            component="section"
            aria-label={title}
            sx={{
                width: '100%',
                py: { xs: 2.5, sm: 3.5 },
                bgcolor: 'transparent',
            }}
        >
            <Container
                maxWidth={false}
                sx={{
                    maxWidth: '1360px',
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: { xs: 1.75, sm: 2.25 },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {storeLogo && (
                            <Box
                                component="img"
                                src={storeLogo}
                                alt={storeName || ''}
                                sx={{
                                    width: { xs: 28, sm: 32 },
                                    height: { xs: 28, sm: 32 },
                                    borderRadius: '50%',
                                    objectFit: 'contain',
                                    border: '1px solid #E5E7EB',
                                    p: 0.25,
                                }}
                            />
                        )}
                        <Typography
                            variant="h2"
                            sx={{
                                fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.55rem' },
                                fontWeight: 800,
                                color: '#111827',
                                letterSpacing: '-0.3px',
                                lineHeight: 1.2,
                            }}
                        >
                            {title}
                        </Typography>
                    </Box>

                    <Link href={targetViewAll} style={{ textDecoration: 'none' }}>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: '#4B5563',
                                fontSize: { xs: '0.85rem', sm: '0.925rem' },
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'color 0.18s ease, transform 0.18s ease',
                                '&:hover': {
                                    color: '#FF6B35',
                                    transform: 'translateX(2px)',
                                },
                            }}
                        >
                            <span>View all</span>
                            <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
                        </Box>
                    </Link>
                </Box>

                {/* Carousel Area */}
                <Box sx={{ position: 'relative', width: '100%' }}>
                    {/* Left Navigation Arrow */}
                    {canScrollLeft && (
                        <IconButton
                            onClick={() => handleScroll('left')}
                            aria-label="Scroll left"
                            sx={{
                                position: 'absolute',
                                left: { xs: -10, sm: -18, md: -20 },
                                top: '48%',
                                transform: 'translateY(-50%)',
                                zIndex: 10,
                                width: { xs: 36, sm: 42 },
                                height: { xs: 36, sm: 42 },
                                bgcolor: '#FFFFFF',
                                color: '#1F2937',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)',
                                border: '1px solid #E5E7EB',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                display: { xs: 'none', sm: 'inline-flex' },
                                '&:hover': {
                                    bgcolor: '#FFFFFF',
                                    color: '#FF6B35',
                                    transform: 'translateY(-50%) scale(1.1)',
                                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.16)',
                                },
                            }}
                        >
                            <ChevronLeftRoundedIcon sx={{ fontSize: 26 }} />
                        </IconButton>
                    )}

                    {/* Right Navigation Arrow */}
                    {canScrollRight && (
                        <IconButton
                            onClick={() => handleScroll('right')}
                            aria-label="Scroll right"
                            sx={{
                                position: 'absolute',
                                right: { xs: -10, sm: -18, md: -20 },
                                top: '48%',
                                transform: 'translateY(-50%)',
                                zIndex: 10,
                                width: { xs: 36, sm: 42 },
                                height: { xs: 36, sm: 42 },
                                bgcolor: '#FFFFFF',
                                color: '#1F2937',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)',
                                border: '1px solid #E5E7EB',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                display: { xs: 'none', sm: 'inline-flex' },
                                '&:hover': {
                                    bgcolor: '#FFFFFF',
                                    color: '#FF6B35',
                                    transform: 'translateY(-50%) scale(1.1)',
                                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.16)',
                                },
                            }}
                        >
                            <ChevronRightRoundedIcon sx={{ fontSize: 26 }} />
                        </IconButton>
                    )}

                    {/* Scrollable Track */}
                    <Box
                        ref={scrollContainerRef}
                        sx={{
                            display: 'flex',
                            gap: { xs: 1.5, sm: 2, md: 2.25 },
                            overflowX: 'auto',
                            scrollSnapType: 'x mandatory',
                            scrollBehavior: 'smooth',
                            py: 1,
                            px: 0.5,
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            '&::-webkit-scrollbar': {
                                display: 'none',
                            },
                        }}
                    >
                        {coupons.map((coupon, index) => {
                            const badgeType = tagTypes[index % tagTypes.length];
                            return (
                                <Box
                                    key={coupon.id || index}
                                    sx={{
                                        flex: {
                                            xs: '0 0 calc(50% - 8px)',
                                            sm: '0 0 calc(33.333% - 12px)',
                                            md: '0 0 calc(25% - 14px)',
                                            lg: '0 0 calc(16.666% - 16px)',
                                        },
                                        minWidth: { xs: '160px', sm: '180px', md: '190px' },
                                        maxWidth: { xs: '210px', sm: '220px', md: '230px' },
                                        scrollSnapAlign: 'start',
                                    }}
                                >
                                    <TrendingProductCard
                                        coupon={coupon}
                                        badgeType={badgeType}
                                        onCouponClick={(c) => {
                                            if (c.code && c.code.trim()) {
                                                setSelectedCoupon(c);
                                            } else {
                                                const link = c.affiliate_link || c.store_website_url || `/coupon/${c.id}`;
                                                window.open(link, '_blank', 'noopener,noreferrer');
                                            }
                                        }}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Container>

            {/* Coupon Modal when promo code is clicked */}
            <CouponModal
                coupon={selectedCoupon}
                isOpen={Boolean(selectedCoupon)}
                onClose={() => setSelectedCoupon(null)}
            />
        </Box>
    );
}

export default MaterialStoreCarousel;
