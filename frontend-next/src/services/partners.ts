import type { PartnerAccount, PartnerDashboard } from '@/types/partners';

const base = (process.env.NEXT_PUBLIC_PARTNER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.couponpush.com/api').replace(/\/$/, '');
let csrf = '';
export class PartnerApiError extends Error {
    constructor(message: string, public status: number, public fields: Record<string, string> = {}) { super(message); }
}
interface Session { account: PartnerAccount | null; csrf: string }
async function request<T>(action: string, body?: Record<string, unknown> | FormData): Promise<T> {
    const response = await fetch(`${base}/partners.php?action=${encodeURIComponent(action)}`, {
        method: body ? 'POST' : 'GET', credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(20000),
        headers: body instanceof FormData ? { 'X-Partner-CSRF': csrf } : body ? { 'Content-Type': 'application/json', 'X-Partner-CSRF': csrf } : {},
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) throw new PartnerApiError(payload?.message || 'We could not reach your brand workspace. Please try again.', response.status, payload?.fields || {});
    if (payload.data?.csrf) csrf = payload.data.csrf;
    return payload.data as T;
}
export const partnerApi = {
    session: () => request<Session>('session'),
    dashboard: () => request<PartnerDashboard>('dashboard'),
    action: (action: string, body: Record<string, unknown> = {}) => request<Session>(action, body),
    uploadLogo: (file: File) => { const data = new FormData(); data.append('logo', file); return request<{ url: string }>('upload_logo', data); },
};
