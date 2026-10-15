// Static redirect files cannot match the request scheme or hostname.
// Run before asset lookup so existing pages and images also redirect.
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const publicHost = url.hostname === 'couponpush.com' || url.hostname === 'www.couponpush.com';
        if (publicHost && (url.protocol !== 'https:' || url.hostname !== 'couponpush.com')) {
            url.protocol = 'https:';
            url.host = 'couponpush.com';
            return Response.redirect(url.href, 301);
        }
        // This store now has a published static page. Retire only its preview URL;
        // other newly added stores still need the shared noindex preview route.
        if ((url.pathname === '/stores/view/' || url.pathname === '/stores/view')
            && url.searchParams.getAll('slug').length === 1
            && url.searchParams.get('slug') === 'amazon-great-indian-festival-2026') {
            url.pathname = '/store/amazon-great-indian-festival-2026/';
            url.searchParams.delete('slug');
            return Response.redirect(url.href, 301);
        }
        return env.ASSETS.fetch(request);
    },
};
