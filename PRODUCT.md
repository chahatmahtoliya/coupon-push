# CouponPush

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Shoppers compare coupons and offers. Brand representatives submit their store and offers, follow review progress, and manage approved listings. CouponPush administrators review submissions before publication.

## Product Purpose

Help shoppers find offers with clear conditions and give brands a reviewed route into the CouponPush catalog.

## Operating Context

The frontend is a Next.js static export. The existing PHP API, MySQL catalog, and PHP admin panel are hosted separately. Merchant sessions must remain separate from admin credentials. The user confirmed hosting PHP mail for account verification and password resets.

## Capabilities and Constraints

The approved scope includes account creation, store onboarding, coupons and no-code offers, review tracking, editing, withdrawal, click/view reporting, notifications, and admin approval. Reviews precede changes to public content. Approval and completion of a website update are separate states. Purchase/redemption reporting is unavailable without merchant or affiliate integration. One store per account is the initial implementation scope; payment and subscription plans remain undecided.

## Brand Commitments

Preserve the established CouponPush name, assets, public navigation, and current interface conventions. This feature extends the existing product.

## Evidence on Hand

`README.md`, `list-a-store-feature-plan.md`, existing store/coupon APIs, admin pages, public store pages, and catalog snapshots. No partner testimonials, traffic guarantees, or review deadlines have been provided.
