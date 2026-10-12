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
        return env.ASSETS.fetch(request);
    },
};
