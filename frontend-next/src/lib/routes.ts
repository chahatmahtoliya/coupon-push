export function getStorePath(slug?: string | null): string {
    return slug ? `/${slug}` : '/stores';
}
