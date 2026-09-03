'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Box, Typography, IconButton, Button, Container } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import type { Coupon } from '@/types';
import { TrendingProductCard } from './TrendingProductCard';
import { CouponModal } from '@/components/common/CouponModal';

interface TopTrendingCarouselProps {
    coupons: Coupon[];
    title?: string;
    viewAllLink?: string;
    showPromoBanner?: boolean;
    showRanks?: boolean;
}

export function TopTrendingCarousel({
    coupons,
    title = 'Top trending',
    viewAllLink = '/deals',
    showPromoBanner = true,
    showRanks = true,
}: TopTrendingCarouselProps) {
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

    return (
        <Box
            component="section"
            aria-label={title}
            sx={{
                width: '100%',
                py: { xs: 2.5, sm: 3.5, md: 4 },
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
                {/* Section Header: Title & "View all >" */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: { xs: 1.75, sm: 2.25 },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                            variant="h2"
                            sx={{
                                fontSize: { xs: '1.25rem', sm: '1.45rem', md: '1.65rem' },
                                fontWeight: 800,
                                color: '#111827',
                                letterSpacing: '-0.3px',
                                textTransform: 'capitalize',
                                lineHeight: 1.2,
                            }}
                        >
                            {title}
                        </Typography>
                    </Box>

                    {viewAllLink && (
                        <Link href={viewAllLink} style={{ textDecoration: 'none' }}>
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
                    )}
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
                        {coupons.map((coupon, index) => (
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
                                    rank={showRanks ? index + 1 : undefined}
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
                        ))}
                    </Box>
                </Box>

                {/* More trending deals Promo Banner */}
                {showPromoBanner && (
                    <Box
                        sx={{
                            mt: { xs: 2.5, sm: 3 },
                            p: { xs: 1.75, sm: 2.25 },
                            px: { xs: 2, sm: 3 },
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #ECFDF5 0%, #E6F9ED 50%, #D1FAE5 100%)',
                            border: '1px solid #A7F3D0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: { xs: 'nowrap', sm: 'nowrap' },
                            gap: 2,
                            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.25 } }}>
                            {/* Colorful Shopping Bags Icon */}
                            <Box
                                sx={{
                                    width: { xs: 44, sm: 52 },
                                    height: { xs: 44, sm: 52 },
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <svg width="46" height="46" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 16H34L37 42H11L14 16Z" fill="#A78BFA" />
                                    <path d="M19 16V12C19 9.23858 21.2386 7 24 7C26.7614 7 29 9.23858 29 12V16" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
                                    <path d="M22 20H40L42 42H20L22 20Z" fill="#38BDF8" opacity="0.9" />
                                    <path d="M27 20V16C27 14.3431 28.3431 13 30 13C31.6569 13 33 14.3431 33 16V20" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M8 24H24L26 42H6L8 24Z" fill="#FDE047" opacity="0.95" />
                                    <path d="M12 24V21C12 19.8954 12.8954 19 14 19C15.1046 19 16 19.8954 16 21V24" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </Box>

                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: { xs: '1rem', sm: '1.15rem' },
                                        fontWeight: 800,
                                        color: '#064E3B',
                                        lineHeight: 1.25,
                                    }}
                                >
                                    More trending deals
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: { xs: '0.75rem', sm: '0.825rem' },
                                        color: '#047857',
                                        fontWeight: 500,
                                        mt: 0.25,
                                    }}
                                >
                                    Updated every 3 hours
                                </Typography>
                            </Box>
                        </Box>

                        <Link href="/deals" style={{ textDecoration: 'none', flexShrink: 0 }}>
                            <Button
                                variant="contained"
                                endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                    bgcolor: '#FFFFFF',
                                    color: '#064E3B',
                                    borderRadius: '999px',
                                    px: { xs: 2, sm: 3 },
                                    py: { xs: 0.75, sm: 1 },
                                    fontWeight: 700,
                                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                    textTransform: 'none',
                                    boxShadow: '0 2px 8px rgba(6, 78, 59, 0.08)',
                                    border: '1px solid rgba(167, 243, 208, 0.6)',
                                    whiteSpace: 'nowrap',
                                    '&:hover': {
                                        bgcolor: '#F9FAFB',
                                        color: '#047857',
                                        boxShadow: '0 4px 12px rgba(6, 78, 59, 0.14)',
                                    },
                                }}
                            >
                                Shop Now
                            </Button>
                        </Link>
                    </Box>
                )}
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

export default TopTrendingCarousel;
