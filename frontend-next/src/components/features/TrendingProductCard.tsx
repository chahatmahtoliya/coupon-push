'use client';

import React, { useState } from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import type { Coupon } from '@/types';
import { trackClick } from '@/services/api';
import { getCouponPath, getStorePath } from '@/lib/routes';
import { isCodeCoupon } from '@/utils/coupon';

export interface TrendingProductCardProps {
    coupon: Coupon;
    rank?: number; // 1, 2, 3, 4, 5, 6...
    badgeLabel?: string; // 'Top Pick' | 'Exclusive' | 'Popular' | 'Super Save'
    badgeType?: 'top-pick' | 'exclusive' | 'popular' | 'super-save' | 'rank';
    onCouponClick?: (coupon: Coupon) => void;
}

const mediaBase = (process.env.NEXT_PUBLIC_MEDIA_URL || 'https://media.couponpush.com').replace(/\/$/, '');

function normalizeImageUrl(value?: string | null): string | null {
    if (!value) return null;
    if (value.startsWith('//')) return `https:${value}`;
    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);
            if ((url.hostname === 'couponpush.com' || url.hostname === 'www.couponpush.com')
                && url.pathname.startsWith('/uploads/')) {
                return `${mediaBase}${url.pathname}${url.search}`;
            }
        } catch {
            return value;
        }
        return value;
    }
    if (value.startsWith('/uploads/')) return `${mediaBase}${value}`;
    if (value.startsWith('uploads/')) return `${mediaBase}/${value}`;
    try {
        const api = new URL(process.env.NEXT_PUBLIC_API_URL || 'https://api.couponpush.com/api');
        return `${api.origin}${value.startsWith('/') ? value : `/${value}`}`;
    } catch {
        return value;
    }
}

export function TrendingProductCard({
    coupon,
    rank,
    badgeLabel,
    badgeType,
    onCouponClick,
}: TrendingProductCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [imgFailed, setImgFailed] = useState(false);

    const hasCode = isCodeCoupon(coupon);
    const couponImg = normalizeImageUrl(coupon.image);
    const storeLogo = normalizeImageUrl(coupon.store_logo);
    const displayImg = (!imgFailed && couponImg) ? couponImg : (!imgFailed && storeLogo ? storeLogo : null);

    // Calculate discount label
    const discountText = React.useMemo(() => {
        if (coupon.discount_value && Number(coupon.discount_value) > 0) {
            if (coupon.discount_type === 'percentage') {
                return `${Math.round(Number(coupon.discount_value))}% OFF`;
            }
            if (coupon.discount_type === 'fixed' || (coupon.discount_type as string) === 'flat') {
                return `₹${Number(coupon.discount_value).toLocaleString('en-IN')} OFF`;
            }
            return 'DEAL';
        }
        // If sale price and original price exist
        if (coupon.original_price && coupon.sale_price && coupon.original_price > coupon.sale_price) {
            const pct = Math.round(((coupon.original_price - coupon.sale_price) / coupon.original_price) * 100);
            return `${pct}% OFF`;
        }
        return hasCode ? 'PROMO' : 'DEAL';
    }, [coupon, hasCode]);

    // Price calculation
    const formattedSalePrice = React.useMemo(() => {
        if (coupon.sale_price && Number(coupon.sale_price) > 0) {
            return `₹${Number(coupon.sale_price).toLocaleString('en-IN')}`;
        }
        if (coupon.original_price && coupon.discount_value) {
            const original = Number(coupon.original_price);
            const disc = Number(coupon.discount_value);
            if (coupon.discount_type === 'percentage') {
                const calculated = Math.max(1, Math.round(original * (1 - disc / 100)));
                return `₹${calculated.toLocaleString('en-IN')}`;
            }
            const calculated = Math.max(1, original - disc);
            return `₹${calculated.toLocaleString('en-IN')}`;
        }
        if (coupon.discount_value && Number(coupon.discount_value) > 0) {
            return coupon.discount_type === 'percentage'
                ? `${coupon.discount_value}% Savings`
                : `Save ₹${Number(coupon.discount_value).toLocaleString('en-IN')}`;
        }
        return 'Special Offer';
    }, [coupon]);

    const formattedOriginalPrice = React.useMemo(() => {
        if (coupon.original_price && Number(coupon.original_price) > 0) {
            return `₹${Number(coupon.original_price).toLocaleString('en-IN')}`;
        }
        return null;
    }, [coupon.original_price]);

    // Trust / Social proof text
    const trustBadge = React.useMemo(() => {
        const storeLower = (coupon.store_name || '').toLowerCase();
        if (storeLower.includes('amazon')) {
            if (rank === 1 || rank === 2 || rank === 3) return { text: 'Best Seller on Amazon', icon: 'amazon' };
            if (rank && rank % 2 === 0) return { text: "Amazon's Choice", icon: 'check' };
            return { text: 'Top Seller on Amazon', icon: 'amazon' };
        }
        if (storeLower.includes('flipkart')) {
            return { text: 'Top Seller on Flipkart', icon: 'check' };
        }
        if (storeLower.includes('ajio')) {
            return { text: 'Top Rated on AJIO', icon: 'star' };
        }
        if (storeLower.includes('myntra')) {
            return { text: 'Trending on Myntra', icon: 'star' };
        }
        if (coupon.is_verified) {
            return { text: `Verified on ${coupon.store_name}`, icon: 'check' };
        }
        if (coupon.click_count && coupon.click_count > 0) {
            return { text: `${coupon.click_count > 999 ? (coupon.click_count / 1000).toFixed(1) + 'k' : coupon.click_count} shoppers used`, icon: 'star' };
        }
        return { text: `Verified on ${coupon.store_name || 'Store'}`, icon: 'check' };
    }, [coupon, rank]);

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't trigger if clicked on favorite button
        if ((e.target as HTMLElement).closest('.favorite-btn')) {
            return;
        }

        if (onCouponClick) {
            onCouponClick(coupon);
            return;
        }

        void trackClick('coupon', coupon.id);
        const target = coupon.affiliate_link || coupon.store_website_url || getStorePath(coupon.store_slug);
        if (target) {
            window.open(target, '_blank', 'noopener,noreferrer');
        }
    };

    const toggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFavorite((prev) => !prev);
    };

    // Render rank ribbon / badge
    const renderRankBadge = () => {
        if (!rank) return null;

        if (rank === 1) {
            return (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 10,
                        zIndex: 3,
                        width: 32,
                        height: 40,
                        background: 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        pt: 0.5,
                        boxShadow: '0 2px 6px rgba(217, 119, 6, 0.4)',
                    }}
                >
                    <Typography sx={{ fontSize: '8px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1, letterSpacing: '0.5px' }}>
                        TOP
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
                        1
                    </Typography>
                </Box>
            );
        }

        if (rank === 2) {
            return (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 10,
                        zIndex: 3,
                        width: 32,
                        height: 40,
                        background: 'linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        pt: 0.5,
                        boxShadow: '0 2px 6px rgba(59, 130, 246, 0.35)',
                    }}
                >
                    <Typography sx={{ fontSize: '8px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1, letterSpacing: '0.5px' }}>
                        TOP
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
                        2
                    </Typography>
                </Box>
            );
        }

        if (rank === 3) {
            return (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 10,
                        zIndex: 3,
                        width: 32,
                        height: 40,
                        background: 'linear-gradient(180deg, #F97316 0%, #EA580C 100%)',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        pt: 0.5,
                        boxShadow: '0 2px 6px rgba(234, 88, 12, 0.35)',
                    }}
                >
                    <Typography sx={{ fontSize: '8px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1, letterSpacing: '0.5px' }}>
                        TOP
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
                        3
                    </Typography>
                </Box>
            );
        }

        // Rank 4+
        return (
            <Box
                sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 3,
                    width: 24,
                    height: 24,
                    borderRadius: '6px',
                    bgcolor: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#475569', lineHeight: 1 }}>
                    {rank}
                </Typography>
            </Box>
        );
    };

    // Render custom tag badges (e.g. Top Pick, Exclusive, Popular, Super Save)
    const renderTagBadge = () => {
        if (rank) return null;
        if (!badgeLabel && !badgeType) return null;

        const label = badgeLabel || (
            badgeType === 'top-pick' ? 'Top Pick' :
            badgeType === 'exclusive' ? 'Exclusive' :
            badgeType === 'popular' ? 'Popular' :
            badgeType === 'super-save' ? 'Super Save' : ''
        );

        if (!label) return null;

        let bg = '#E0F2FE';
        let color = '#0284C7';
        let borderColor = '#BAE6FD';

        if (label.toLowerCase().includes('exclusive')) {
            bg = '#DCFCE7';
            color = '#16A34A';
            borderColor = '#BBF7D0';
        } else if (label.toLowerCase().includes('popular')) {
            bg = '#CCFBF1';
            color = '#0D9488';
            borderColor = '#99F6E4';
        } else if (label.toLowerCase().includes('super save') || label.toLowerCase().includes('hot')) {
            bg = '#FEE2E2';
            color = '#DC2626';
            borderColor = '#FECACA';
        }

        return (
            <Box
                sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 3,
                    px: 1,
                    py: 0.35,
                    borderRadius: '5px',
                    bgcolor: bg,
                    border: `1px solid ${borderColor}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                }}
            >
                <Typography sx={{ fontSize: '10px', fontWeight: 700, color, lineHeight: 1, textTransform: 'capitalize' }}>
                    {label}
                </Typography>
            </Box>
        );
    };

    return (
        <Paper
            elevation={0}
            onClick={handleCardClick}
            sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: { xs: '310px', sm: '330px', md: '340px' },
                display: 'flex',
                flexDirection: 'column',
                p: { xs: 1.25, sm: 1.5 },
                bgcolor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #F0F2F5',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.08)',
                    borderColor: '#E2E8F0',
                    '& .product-img': {
                        transform: 'scale(1.04)',
                    },
                    '& .card-title': {
                        color: '#FF6B35',
                    },
                },
            }}
        >
            {/* Top Left Badge: Rank or Tag */}
            {renderRankBadge()}
            {renderTagBadge()}

            {/* Top Right Wishlist / Favorite Button */}
            <IconButton
                size="small"
                className="favorite-btn"
                onClick={toggleFavorite}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 3,
                    width: 30,
                    height: 30,
                    bgcolor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                        bgcolor: '#FFFFFF',
                        transform: 'scale(1.1)',
                    },
                }}
            >
                {isFavorite ? (
                    <FavoriteIcon sx={{ fontSize: 17, color: '#EF4444' }} />
                ) : (
                    <FavoriteBorderIcon sx={{ fontSize: 17, color: '#9CA3AF' }} />
                )}
            </IconButton>

            {/* Product Image Area */}
            <Box
                sx={{
                    width: '100%',
                    height: { xs: '135px', sm: '150px' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.25,
                    pt: 1,
                    overflow: 'hidden',
                    borderRadius: '8px',
                    bgcolor: '#FAFBFC',
                }}
            >
                {displayImg ? (
                    <Box
                        component="img"
                        className="product-img"
                        src={displayImg}
                        alt={coupon.title}
                        loading="lazy"
                        decoding="async"
                        onError={() => setImgFailed(true)}
                        sx={{
                            maxHeight: '85%',
                            maxWidth: '85%',
                            objectFit: 'contain',
                            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                            color: '#9CA3AF',
                        }}
                    >
                        <LocalFireDepartmentRoundedIcon sx={{ fontSize: 36, color: '#FF8C5A' }} />
                        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6B7280' }}>
                            {coupon.store_name}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Discount & Promo Code Badge Row */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexWrap: 'nowrap',
                    mb: 0.5,
                }}
            >
                <Typography
                    sx={{
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        color: '#E11D48',
                        letterSpacing: '0.2px',
                        lineHeight: 1.2,
                    }}
                >
                    {discountText}
                </Typography>

                <Typography
                    sx={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#16A34A',
                        letterSpacing: '0.4px',
                        lineHeight: 1.2,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {hasCode ? 'PROMO CODE' : 'DEAL'}
                </Typography>
            </Box>

            {/* Price Row: Current Price + Strikethrough Original Price */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 1,
                    mb: 0.75,
                }}
            >
                <Typography
                    sx={{
                        fontSize: { xs: '1.05rem', sm: '1.15rem' },
                        fontWeight: 800,
                        color: '#111827',
                        lineHeight: 1.2,
                        letterSpacing: '-0.3px',
                    }}
                >
                    {formattedSalePrice}
                </Typography>

                {formattedOriginalPrice && (
                    <Typography
                        sx={{
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: '#9CA3AF',
                            textDecoration: 'line-through',
                            lineHeight: 1.2,
                        }}
                    >
                        {formattedOriginalPrice}
                    </Typography>
                )}
            </Box>

            {/* Title Clamped to 2 Lines */}
            <Typography
                className="card-title"
                sx={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: '#374151',
                    lineHeight: 1.35,
                    height: '36px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 'auto',
                    transition: 'color 0.18s ease',
                }}
            >
                {coupon.title}
            </Typography>

            {/* Footer Trust / Social Proof Tag */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.6,
                    pt: 1,
                    mt: 1,
                    borderTop: '1px solid #F3F4F6',
                }}
            >
                {trustBadge.icon === 'amazon' ? (
                    <Box
                        sx={{
                            width: 13,
                            height: 13,
                            borderRadius: '50%',
                            bgcolor: '#F59E0B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Typography sx={{ fontSize: '8px', color: '#FFF', fontWeight: 900, lineHeight: 1 }}>
                            a
                        </Typography>
                    </Box>
                ) : trustBadge.icon === 'check' ? (
                    <CheckCircleRoundedIcon sx={{ fontSize: 13, color: '#16A34A', flexShrink: 0 }} />
                ) : (
                    <StarRoundedIcon sx={{ fontSize: 14, color: '#F59E0B', flexShrink: 0 }} />
                )}

                <Typography
                    sx={{
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        color: '#6B7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.2,
                    }}
                >
                    {trustBadge.text}
                </Typography>
            </Box>
        </Paper>
    );
}

export default TrendingProductCard;
