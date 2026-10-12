'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from '@/components/common/SiteLink';
import { PartnerApiError, partnerApi } from '@/services/partners';
import { emptyBrand, emptyOffer, type BrandDetails, type BrandOffer, type PartnerAccount, type PartnerDashboard, type PartnerOffer, type PartnerStatus } from '@/types/partners';
import styles from './partners.module.css';

type Tab = 'overview' | 'store' | 'offers' | 'activity';
type AuthMode = 'login' | 'signup' | 'forgot' | 'verify' | 'reset';
const labels: Record<PartnerStatus, string> = { draft: 'Draft', pending_review: 'In review', changes_requested: 'Changes requested', approved: 'Approved', rejected: 'Not approved', withdrawn: 'Withdrawn', suspended: 'Suspended' };
const readable = (value: string) => value.replaceAll('_', ' ').replace(/^./, character => character.toUpperCase());
function formatDate(value: string) {
    const date = new Date(value.includes(' ') ? value.replace(' ', 'T') + 'Z' : value + 'T00:00:00');
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function Status({ value, expired = false, scheduled = false }: { value: PartnerStatus; expired?: boolean; scheduled?: boolean }) {
    const text = expired ? 'Expired' : scheduled ? 'Scheduled' : value === 'approved' ? 'Active' : labels[value];
    return <span className={`${styles.status} ${styles[expired ? 'expired' : value] || ''}`}>{text}</span>;
}
function ReviewLock({ status, onOverview }: { status: PartnerStatus; onOverview: () => void }) {
    return <div className={styles.reviewLock}><p>{status === 'pending_review' ? <><strong>This submission is in review.</strong> To make changes, withdraw the submission from Overview, edit your draft, then submit it again.</> : <><strong>Editing is unavailable for this listing.</strong> Open Overview for review feedback or <Link href="/contact/">contact CouponPush</Link> for help.</>}</p><button className={styles.secondary} onClick={onOverview} type="button">Open Overview</button></div>;
}
interface TextFieldProps {
    name: string; label: string; value: string | number; onChange: (value: string) => void;
    error?: string; hint?: string; type?: string; required?: boolean; minLength?: number; maxLength?: number;
    multiline?: boolean; autoComplete?: string; disabled?: boolean; min?: string; max?: string; step?: string;
}
function TextField({ name, label, value, onChange, error, hint, multiline, ...props }: TextFieldProps) {
    const id = `partner-${name}`;
    const shared = { id, name, value, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), 'aria-invalid': Boolean(error), 'aria-describedby': error || hint ? `${id}-help` : undefined };
    return <div className={styles.field}><label htmlFor={id}>{label}{props.required && <span className={styles.required}> (required)</span>}</label>{multiline ? <textarea {...shared} {...props} rows={4} /> : <input {...shared} {...props} />}{(error || hint) && <p id={`${id}-help`} className={error ? styles.fieldError : styles.fieldHint}>{error || hint}</p>}</div>;
}

export default function PartnerPortal() {
    const [account, setAccount] = useState<PartnerAccount | null>(null);
    const [dashboard, setDashboard] = useState<PartnerDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [mode, setMode] = useState<AuthMode>('login');
    const [token, setToken] = useState('');
    const [tokenScreen, setTokenScreen] = useState(false);
    const [tab, setTab] = useState<Tab>('overview');
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [brand, setBrand] = useState<BrandDetails>(emptyBrand);
    const [storeDirty, setStoreDirty] = useState(false);
    const [offer, setOffer] = useState<BrandOffer>(emptyOffer);
    const [offerDirty, setOfferDirty] = useState(false);
    const [editingOffer, setEditingOffer] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const errorRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLHeadingElement>(null);
    const mounted = useRef(true);

    async function loadWorkspace() {
        const data = await partnerApi.dashboard();
        if (!mounted.current) return;
        setDashboard(data); setBrand({ ...emptyBrand, ...data.listing.payload }); setStoreDirty(false);
    }
    async function initialize() {
        setLoading(true); setError('');
        try {
            const session = await partnerApi.session();
            if (!mounted.current) return;
            setAccount(session.account);
            if (session.account) await loadWorkspace();
        } catch (failure) { showError(failure); }
        finally { if (mounted.current) setLoading(false); }
    }
    useEffect(() => {
        mounted.current = true;
        const parameters = new URLSearchParams(window.location.search);
        const emailed = new URLSearchParams(window.location.hash.slice(1));
        if (parameters.get('mode') === 'signup') setMode('signup');
        const action = emailed.get('action') || parameters.get('action');
        const emailedToken = emailed.get('token') || parameters.get('token');
        if ((action === 'verify' || action === 'reset') && emailedToken) {
            setMode(action); setToken(emailedToken); setTokenScreen(true);
            window.history.replaceState(null, '', '/partners/');
        }
        void initialize();
        return () => { mounted.current = false; };
        // Initial session and emailed tokens are read once; credentials stay in memory.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
    useEffect(() => { if (editingOffer !== null) editorRef.current?.focus(); }, [editingOffer]);
    useEffect(() => {
        if (!storeDirty && !offerDirty) return;
        const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [storeDirty, offerDirty]);
    function showError(failure: unknown) {
        if (!mounted.current) return;
        setError(failure instanceof Error ? failure.message : 'We could not complete that request. Please try again.');
        setErrors(failure instanceof PartnerApiError ? failure.fields : {});
        if (failure instanceof PartnerApiError && failure.fields._form === 'store') setTab('store');
        if (failure instanceof PartnerApiError && failure.fields._form === 'offer') {
            const row = dashboard?.offers.find(item => item.id === Number(failure.fields._offer_id));
            if (row) { setOffer({ ...emptyOffer, ...row.payload }); setEditingOffer(row.id); setOfferDirty(false); }
            setTab('offers');
        }
        if (failure instanceof PartnerApiError && failure.status === 401) { setAccount(null); setDashboard(null); }
    }
    function clearMessages() { setError(''); setErrors({}); setNotice(''); }
    async function act(action: string, body: Record<string, unknown>, message: string): Promise<boolean> {
        setBusy(true); clearMessages();
        try {
            const result = await partnerApi.action(action, body);
            setAccount(result.account); setNotice(message);
            if (result.account) await loadWorkspace(); else setDashboard(null);
            return true;
        } catch (failure) { showError(failure); return false; }
        finally { if (mounted.current) setBusy(false); }
    }
    function changeTab(next: Tab) {
        if ((storeDirty || offerDirty) && !window.confirm('Leave without saving these changes? Your last saved draft will still be available.')) return;
        setStoreDirty(false); setOfferDirty(false); setEditingOffer(null); clearMessages();
        if (dashboard) setBrand({ ...emptyBrand, ...dashboard.listing.payload });
        setTab(next);
    }
    function setBrandField<K extends keyof BrandDetails>(key: K, value: BrandDetails[K]) { setBrand(current => ({ ...current, [key]: value })); setStoreDirty(true); }
    function setOfferField<K extends keyof BrandOffer>(key: K, value: BrandOffer[K]) { setOffer(current => ({ ...current, [key]: value })); setOfferDirty(true); }
    async function authSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const body = { name: values.get('name'), email: values.get('email'), password: values.get('password'), accept_terms: values.get('accept_terms') === 'on', token };
        const messages = { signup: 'Account created. Check your email to verify your account.', login: 'Welcome back.', forgot: 'If an account exists, a reset link is on its way.', verify: 'Your email is verified. You can now submit your store.', reset: 'Password updated. Sign in with your new password.' };
        const success = await act(mode === 'signup' ? 'register' : mode, body, messages[mode]);
        if (success && (mode === 'verify' || mode === 'reset')) { setTokenScreen(false); setToken(''); setMode('login'); }
    }
    async function saveStore(event: FormEvent) { event.preventDefault(); await act('save_store', { revision: dashboard?.listing.revision, store: brand }, 'Store details saved. You can return to this draft anytime.'); }
    async function saveOffer(event: FormEvent) {
        event.preventDefault();
        if (await act('save_offer', { revision: dashboard?.listing.revision, id: editingOffer || 0, offer }, 'Offer saved as a draft. Submit your changes when they are ready.')) { setEditingOffer(null); setOfferDirty(false); }
    }
    async function upload(file?: File) {
        if (!file) return;
        setBusy(true); clearMessages();
        try { const result = await partnerApi.uploadLogo(file); setBrandField('logo', result.url); setNotice('Logo uploaded. Save your store details to keep this change.'); }
        catch (failure) { showError(failure); }
        finally { setBusy(false); }
    }
    function editOffer(row?: PartnerOffer) {
        if (offerDirty && !window.confirm('Discard the unsaved offer changes?')) return;
        clearMessages(); setOffer({ ...emptyOffer, ...(row?.payload || {}) }); setEditingOffer(row?.id || 0); setOfferDirty(false); setTab('offers');
    }
    const locked = dashboard?.listing.status === 'pending_review' || dashboard?.listing.status === 'suspended';
    const publicStore = Boolean(dashboard?.listing.public_url);
    const visibleOffers = (dashboard?.offers || []).filter(row => {
        const status = row.expired ? 'expired' : row.scheduled ? 'scheduled' : row.status;
        return (filter === 'all' || status === filter) && `${row.payload.title} ${row.payload.code}`.toLowerCase().includes(query.toLowerCase());
    });
    const activeCount = dashboard?.offers.filter(row => row.status === 'approved' && !row.expired && !row.scheduled).length || 0;
    const pendingCount = dashboard?.offers.filter(row => row.status === 'pending_review').length || 0;
    const authVisible = !account || tokenScreen;
    const formTitle = { login: 'Welcome back to your brand.', signup: 'Start your brand workspace.', forgot: 'Reset your password.', verify: 'Confirm your business email.', reset: 'Choose a new password.' }[mode];

    return <div className={styles.page}><div className={styles.shell}>
        <div className={styles.pageHeader}><div><nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">CouponPush</Link><span aria-hidden="true">/</span><Link href="/list-a-store/">For brands</Link></nav><h1>{account && !tokenScreen ? (dashboard?.listing.payload.name || 'Your brand workspace') : 'Brand workspace'}</h1><p>{account && !tokenScreen ? 'Your store, offers and review updates, together.' : 'A clear view of your store and every offer you share.'}</p></div>{account && !tokenScreen && <div className={styles.accountMenu}><span>{account.email}</span><button className={styles.textButton} disabled={busy} onClick={() => { if ((!storeDirty && !offerDirty) || window.confirm('Sign out without saving your changes?')) { setStoreDirty(false); setOfferDirty(false); void act('logout', {}, 'You are signed out.'); } }}>Sign out</button></div>}</div>
        {error && <div ref={errorRef} tabIndex={-1} role="alert" className={styles.error}><p>{error}</p>{loading === false && !account && <button className={styles.textButton} disabled={busy} onClick={() => void initialize()}>Retry connection</button>}</div>}
        {notice && <div className={styles.notice} role="status">{notice}</div>}
        {loading ? <div className={styles.loading} aria-busy="true" aria-label="Loading brand workspace"><div /><div /><div /><span>Opening your workspace…</span></div> : authVisible ?
            <div className={styles.authGrid}><section className={styles.authAside}><h2>Everything you submit.<br />Every update that follows.</h2><p>Create your account once. Save your store details, submit offers for review and return here whenever your brand has something new to share.</p><ul><li><i className="fas fa-check" aria-hidden="true" /> Drafts you can save and resume</li><li><i className="fas fa-check" aria-hidden="true" /> Feedback from the CouponPush team</li><li><i className="fas fa-check" aria-hidden="true" /> Offer views, clicks and expiry tracking</li></ul><Link href="/list-a-store/">How brand submissions work <i className="fas fa-arrow-right" aria-hidden="true" /></Link></section>
                <section className={styles.authForm}><h2>{formTitle}</h2><p>{mode === 'signup' ? 'Use an email you can access. We will send a verification link.' : mode === 'verify' ? 'Confirm below to activate submissions for this account.' : mode === 'reset' ? 'Use at least 12 characters. Updating your password signs out existing sessions.' : mode === 'forgot' ? 'Enter the email you used for your brand account.' : 'Sign in to continue where you left off.'}</p><form onSubmit={authSubmit} key={mode}>
                    {mode === 'signup' && <div className={styles.field}><label htmlFor="auth-name">Your name</label><input id="auth-name" name="name" autoComplete="name" required maxLength={100} /></div>}
                    {['login', 'signup', 'forgot'].includes(mode) && <div className={styles.field}><label htmlFor="auth-email">Business email</label><input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={190} /></div>}
                    {['login', 'signup', 'reset'].includes(mode) && <div className={styles.field}><label htmlFor="auth-password">{mode === 'reset' ? 'New password' : 'Password'}</label><input id="auth-password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? undefined : 12} maxLength={72} aria-describedby={mode !== 'login' ? 'password-help' : undefined} />{mode !== 'login' && <p className={styles.fieldHint} id="password-help">Use 12–72 characters. Spaces and password managers are welcome.</p>}</div>}
                    {mode === 'signup' && <label className={styles.checkbox}><input name="accept_terms" type="checkbox" required /><span>I agree to the <Link href="/list-a-store/#brand-questions" target="_blank" rel="noopener noreferrer">brand submission terms</Link> and <Link href="/privacy-policy/" target="_blank" rel="noopener noreferrer">privacy policy</Link>.</span></label>}
                    <button className={styles.primary} disabled={busy || (mode === 'verify' && !token)} type="submit">{busy ? 'Please wait…' : { login: 'Sign in', signup: 'Create account', forgot: 'Send reset link', verify: 'Verify my email', reset: 'Update password' }[mode]}<i className="fas fa-arrow-right" aria-hidden="true" /></button>
                </form><div className={styles.authLinks}>{mode === 'login' ? <><button type="button" onClick={() => { clearMessages(); setMode('signup'); }}>Create a brand account</button><button type="button" onClick={() => { clearMessages(); setMode('forgot'); }}>Forgot password?</button></> : <button type="button" onClick={() => { clearMessages(); setTokenScreen(false); setMode('login'); }}>Back to sign in</button>}</div></section>
            </div> : dashboard ? <>
                {!account.verified_at && <div className={styles.verification}><div><strong>Check your inbox to verify your email.</strong><p>You can prepare your draft now. Verification is required to upload a logo and submit for review.</p></div><button className={styles.secondary} disabled={busy} onClick={() => void act('resend', {}, 'A verification email is on its way. Check your inbox and spam folder.')}>Resend email</button></div>}
                <div className={styles.workspace}><nav className={styles.workspaceNav} aria-label="Brand workspace"><p className={styles.navLabel}>Your workspace</p>{(['overview', 'store', 'offers', 'activity'] as Tab[]).map(item => <button key={item} className={tab === item ? styles.currentTab : ''} onClick={() => changeTab(item)} aria-current={tab === item ? 'page' : undefined}><i className={`fas ${{ overview: 'fa-border-all', store: 'fa-store', offers: 'fa-ticket-alt', activity: 'fa-clock' }[item]}`} aria-hidden="true" />{{ overview: 'Overview', store: 'Store details', offers: 'Coupons & offers', activity: 'Activity' }[item]}{item === 'offers' && <span>{dashboard.offers.length}</span>}</button>)}<div className={styles.workspaceHelp}><p>Need help with your listing?</p><Link href="/contact/">Contact CouponPush <i className="fas fa-arrow-right" aria-hidden="true" /></Link></div></nav>
                    <div className={styles.workspaceContent}>
                        {dashboard.listing.feedback && <div className={styles.feedback}><h2>Review feedback</h2><p>{dashboard.listing.feedback}</p></div>}
                        {tab === 'overview' && <>
                            <div className={styles.sectionHeading}><div><h2>Your store at a glance</h2><p>{publicStore ? 'Follow proposed changes and the version currently available to shoppers.' : 'Build your listing, then send it to the CouponPush team.'}</p></div><Status value={dashboard.listing.status} /></div>
                            <dl className={styles.metrics}><div><dt>Active offers</dt><dd>{activeCount}</dd></div><div><dt>Offers in review</dt><dd>{pendingCount}</dd></div><div><dt>Offer views</dt><dd>{dashboard.metrics.offer_views.toLocaleString('en-IN')}</dd></div><div><dt>Offer clicks</dt><dd>{dashboard.metrics.offer_clicks.toLocaleString('en-IN')}</dd></div></dl><p className={styles.metricNote}>Views and clicks reflect shopper engagement with published offers. Clicks include opening offer details. They do not measure purchases or coupon redemptions. Views are counted once per browser session per day.</p>
                            <section className={styles.nextStep}><h3>{dashboard.listing.status === 'suspended' ? 'Your listing is unavailable for editing.' : locked ? 'Your submission is with our team.' : publicStore ? 'Keep your next offer moving.' : 'Let’s get your brand ready.'}</h3><ol className={styles.checklist}><li><i className={`fas ${account.verified_at ? 'fa-check-circle' : 'fa-circle'}`} aria-hidden="true" /><span>Verify your business email</span><span>{account.verified_at ? 'Complete' : 'Check your inbox'}</span></li><li><i className={`fas ${dashboard.listing.payload.name && dashboard.listing.payload.website_url ? 'fa-check-circle' : 'fa-circle'}`} aria-hidden="true" /><button onClick={() => changeTab('store')}>Add your store details</button><span>{dashboard.listing.payload.name ? 'Draft saved' : 'Not started'}</span></li><li><i className={`fas ${dashboard.offers.some(row => row.status !== 'withdrawn') ? 'fa-check-circle' : 'fa-circle'}`} aria-hidden="true" /><button onClick={() => changeTab('offers')}>Add coupons or no-code deals</button><span>{dashboard.offers.filter(row => row.status !== 'withdrawn').length} offers</span></li></ol>
                                <div className={styles.submitRow}>{dashboard.listing.status === 'suspended' ? <><p>Check the review feedback above and contact our team before making changes.</p><Link className={styles.secondary} href="/contact/">Contact CouponPush</Link></> : dashboard.listing.status === 'pending_review' ? <><p>We’ll post feedback here. You can withdraw this submission if you need to make a correction.</p><button className={styles.secondary} disabled={busy} onClick={() => { if (window.confirm('Withdraw this submission from review so you can edit it?')) void act('withdraw', { revision: dashboard.listing.revision }, 'Submission withdrawn. You can edit and resubmit it.'); }}>Withdraw submission</button></> : <><p>Submit when your store details and offers are ready. Every proposed change is reviewed.</p><button className={styles.primary} disabled={busy || !account.verified_at || dashboard.offers.every(row => row.status === 'withdrawn')} onClick={() => void act('submit', { revision: dashboard.listing.revision }, 'Submitted for review. Updates will appear here and by email.')}>{busy ? 'Submitting…' : 'Submit for review'}<i className="fas fa-arrow-right" aria-hidden="true" /></button></>}</div>
                            </section>
                            {dashboard.publication && <section className={styles.publication}><div><h3>{dashboard.publication.status === 'succeeded' ? 'Approved version published' : 'Website update pending'}</h3><p>{dashboard.publication.status === 'succeeded' ? 'Your approved website update is available to shoppers.' : 'Your approved changes are in the live directory. We’ll notify you when the website update is published.'}</p></div>{dashboard.listing.public_url && <a className={styles.secondary} href={dashboard.publication.status === 'succeeded' ? dashboard.listing.canonical_url || dashboard.listing.public_url : dashboard.listing.public_url} target="_blank" rel="noopener noreferrer">View your store <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" /></a>}</section>}
                            <section className={styles.recent}><div className={styles.sectionHeading}><h3>Latest activity</h3><button className={styles.textButton} onClick={() => changeTab('activity')}>View all activity</button></div>{dashboard.activity.length ? dashboard.activity.slice(0, 3).map((item, index) => <div className={styles.activityRow} key={`${item.event}-${item.created_at}-${index}`}><div><strong>{readable(item.event)}</strong><p>{item.message}</p></div><time>{formatDate(item.created_at)}</time></div>) : <p className={styles.emptyInline}>Your review history will appear here after your first submission.</p>}</section>
                        </>}
                        {tab === 'store' && <><div className={styles.sectionHeading}><div><h2>Introduce your store</h2><p>Tell shoppers what your brand offers. Authorization details stay private to you and our reviewers.</p></div>{storeDirty && <span className={styles.unsaved}>Unsaved changes</span>}</div>{locked && <ReviewLock status={dashboard.listing.status} onOverview={() => changeTab('overview')} />}<form onSubmit={saveStore} className={styles.editor} noValidate><fieldset disabled={busy || locked}>
                            <div className={styles.formGrid}><TextField name="name" label="Store name" value={brand.name} onChange={value => setBrandField('name', value)} required maxLength={100} error={errors.name} /><TextField name="website_url" label="Official website" value={brand.website_url} onChange={value => setBrandField('website_url', value)} type="url" required maxLength={255} error={errors.website_url} hint="Use your official HTTPS website. Existing listings need a separate ownership review." /></div>
                            <div className={styles.formGrid}><div className={styles.field}><label htmlFor="brand-category">Category <span className={styles.required}>(required)</span></label><select id="brand-category" value={brand.category_id || ''} onChange={event => setBrandField('category_id', Number(event.target.value))} required aria-invalid={Boolean(errors.category_id)}><option value="">Choose a category</option>{dashboard.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{errors.category_id && <p className={styles.fieldError}>{errors.category_id}</p>}</div><div className={styles.field}><label htmlFor="brand-logo">Brand logo <span className={styles.required}>(optional)</span></label><div className={styles.logoUpload}>{brand.logo && <img src={brand.logo} alt="Your uploaded brand logo" width={52} height={52} />}<input id="brand-logo" type="file" accept="image/png,image/jpeg,image/webp" disabled={!account.verified_at || busy || locked} onChange={event => void upload(event.target.files?.[0])} /><p className={styles.fieldHint}>PNG, JPEG or WebP, up to 2 MB. Verify your email to upload.</p></div></div></div>
                            <TextField name="short_description" label="Short introduction" value={brand.short_description} onChange={value => setBrandField('short_description', value)} required minLength={20} maxLength={255} hint="20–255 characters describing what shoppers can find at your store." error={errors.short_description} />
                            <TextField name="description" label="About your brand" value={brand.description} onChange={value => setBrandField('description', value)} required minLength={80} maxLength={5000} multiline hint="At least 80 characters. Describe your products, audience and what makes the store useful." error={errors.description} />
                            <div className={styles.formDivider}><h3>Who’s representing the brand?</h3><p>Mailbox verification confirms your email access. Our team checks brand authorization separately.</p></div>
                            <div className={styles.field}><label htmlFor="brand-relationship">Your relationship <span className={styles.required}>(required)</span></label><select id="brand-relationship" value={brand.relationship} onChange={event => setBrandField('relationship', event.target.value)} required><option value="">Choose your relationship</option><option value="owner">Store owner</option><option value="employee">Brand employee</option><option value="agency">Authorized agency</option></select></div>
                            <TextField name="authorization" label="Authorization details" value={brand.authorization} onChange={value => setBrandField('authorization', value)} multiline required minLength={40} maxLength={2000} error={errors.authorization} hint="Explain your role and provide an official business contact or a way our team can confirm your authorization. This stays private." />
                            <label className={styles.checkbox}><input type="checkbox" checked={brand.authority_confirmed} onChange={event => setBrandField('authority_confirmed', event.target.checked)} required /><span>I am authorized to represent this brand and submit these offers.</span></label>
                            <div className={styles.formActions}><button className={styles.primary} type="submit">{busy ? 'Saving…' : 'Save store details'}</button><button className={styles.textButton} type="button" onClick={() => { void act('save_store', { revision: dashboard.listing.revision, store: brand }, 'Store draft saved.').then(saved => { if (saved) setTab('offers'); }); }}>Save & continue to offers <i className="fas fa-arrow-right" aria-hidden="true" /></button></div>
                        </fieldset></form></>}
                        {tab === 'offers' && <><div className={styles.sectionHeading}><div><h2>Coupons & offers</h2><p>Keep conditions clear. Saved changes become drafts until you submit them for review.</p></div><button className={styles.primary} disabled={busy || locked} onClick={() => editOffer()}>Add an offer <i className="fas fa-plus" aria-hidden="true" /></button></div>
                            {locked && <ReviewLock status={dashboard.listing.status} onOverview={() => changeTab('overview')} />}
                            {dashboard.offers.length > 0 && <div className={styles.toolbar}><div className={styles.field}><label htmlFor="offer-search">Find an offer</label><input id="offer-search" type="search" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" /></div><div className={styles.field}><label htmlFor="offer-filter">Status</label><select id="offer-filter" value={filter} onChange={event => setFilter(event.target.value)}>{[['all', 'All offers'], ['draft', 'Drafts'], ['pending_review', 'In review'], ['approved', 'Active'], ['scheduled', 'Scheduled'], ['expired', 'Expired'], ['changes_requested', 'Changes requested'], ['rejected', 'Not approved'], ['withdrawn', 'Withdrawn']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>}
                            {visibleOffers.length ? <div className={styles.tableWrap}><table className={styles.offerTable}><caption className="visually-hidden">Your offers and their review status, views and clicks</caption><thead><tr><th scope="col">Offer</th><th scope="col">Status</th><th scope="col">Views</th><th scope="col">Clicks</th><th scope="col">Manage</th></tr></thead><tbody>{visibleOffers.map(row => <tr key={row.id}><th scope="row"><strong>{row.payload.title}</strong><span>{row.payload.code || 'No-code deal'}{row.payload.expiry_date ? ` · Ends ${formatDate(row.payload.expiry_date)}` : ' · No expiry supplied'}</span>{row.feedback && ['changes_requested', 'rejected'].includes(row.status) && <p className={styles.offerFeedback}>{row.feedback}</p>}</th><td data-label="Status"><Status value={row.status} expired={row.expired} scheduled={row.scheduled} /></td><td data-label="Views">{row.views}</td><td data-label="Clicks">{row.clicks}</td><td data-label="Manage"><div className={styles.tableActions}><button className={styles.textButton} disabled={busy || locked} onClick={() => editOffer(row)} aria-label={`Edit ${row.payload.title}`}>{row.expired ? 'Renew' : 'Edit'}</button>{row.status !== 'withdrawn' && <button className={styles.withdrawButton} disabled={busy || locked} aria-label={`Withdraw ${row.payload.title}`} onClick={() => { if (window.confirm('Withdraw this offer? It will stop appearing in live results. Any website update will be tracked in your workspace.')) void act('withdraw', { revision: dashboard.listing.revision, id: row.id }, 'Offer withdrawn. Publication progress is shown in Overview.'); }}>Withdraw</button>}</div></td></tr>)}</tbody></table></div> : <div className={styles.empty}><i className="fas fa-ticket-alt" aria-hidden="true" /><h3>{dashboard.offers.length ? 'No offers match this view.' : 'Your first offer starts here.'}</h3><p>{dashboard.offers.length ? 'Try a different status or search term.' : 'Add a coupon code or no-code deal with its destination, dates and conditions.'}</p>{!dashboard.offers.length && <button className={styles.secondary} disabled={busy || locked} onClick={() => editOffer()}>Add your first offer</button>}</div>}
                            {editingOffer !== null && <section className={styles.offerEditor}><div className={styles.sectionHeading}><h3 ref={editorRef} tabIndex={-1}>{editingOffer ? 'Edit offer' : 'New offer'}</h3><button className={styles.textButton} disabled={busy} onClick={() => { if (!offerDirty || window.confirm('Discard this unsaved offer?')) { setEditingOffer(null); setOfferDirty(false); clearMessages(); } }}>Close editor</button></div><form onSubmit={saveOffer} noValidate><fieldset disabled={busy || locked}><p className={styles.small}>You can save an unfinished draft. Complete all required details before submitting for review.</p><div className={styles.formGrid}><div className={styles.field}><label htmlFor="offer-type">Offer type</label><select id="offer-type" value={offer.coupon_type} onChange={event => setOfferField('coupon_type', event.target.value as BrandOffer['coupon_type'])}><option value="code">Coupon code</option><option value="deal">No-code deal</option></select></div>{offer.coupon_type === 'code' && <TextField name="code" label="Coupon code" value={offer.code} onChange={value => setOfferField('code', value)} required maxLength={50} error={errors.code} />}</div>
                                <TextField name="title" label="Offer title" value={offer.title} onChange={value => setOfferField('title', value)} required minLength={5} maxLength={255} error={errors.title} hint="Describe the saving accurately, including any important limit." />
                                <TextField name="description" label="Offer description" value={offer.description} onChange={value => setOfferField('description', value)} required minLength={20} maxLength={2000} multiline error={errors.description} />
                                <TextField name="affiliate_link" label="Offer destination" value={offer.affiliate_link} onChange={value => setOfferField('affiliate_link', value)} type="url" required maxLength={500} error={errors.affiliate_link} hint="A public HTTPS link where shoppers can use this offer." />
                                <div className={styles.formGrid}><div className={styles.field}><label htmlFor="offer-saving">Saving type</label><select id="offer-saving" value={offer.discount_type} onChange={event => setOfferField('discount_type', event.target.value as BrandOffer['discount_type'])}><option value="percentage">Percentage off</option><option value="flat">Amount off (INR)</option><option value="cashback">Cashback (INR)</option><option value="freebie">Freebie / other benefit</option></select></div><TextField name="discount_value" label={offer.discount_type === 'percentage' ? 'Saving (%)' : 'Saving amount (INR, optional)'} type="number" min="0" max={offer.discount_type === 'percentage' ? '100' : '100000000'} step="0.01" value={offer.discount_value ?? ''} onChange={value => setOfferField('discount_value', value === '' ? null : Number(value))} error={errors.discount_value} /></div>
                                <div className={styles.formGrid}><TextField name="min_order_value" label="Minimum spend (INR, optional)" type="number" min="0" max="100000000" step="0.01" value={offer.min_order_value ?? ''} onChange={value => setOfferField('min_order_value', value === '' ? null : Number(value))} error={errors.min_order_value} /><TextField name="max_discount" label="Maximum saving (INR, optional)" type="number" min="0" max="100000000" step="0.01" value={offer.max_discount ?? ''} onChange={value => setOfferField('max_discount', value === '' ? null : Number(value))} error={errors.max_discount} /></div>
                                <div className={styles.formGrid}><TextField name="start_date" label="Starts on (optional)" type="date" value={offer.start_date} onChange={value => setOfferField('start_date', value)} error={errors.start_date} /><TextField name="expiry_date" label="Ends on (optional)" type="date" value={offer.expiry_date} onChange={value => setOfferField('expiry_date', value)} error={errors.expiry_date} hint="Leave blank only when no expiry has been supplied." /></div>
                                <TextField name="terms_conditions" label="Eligibility & restrictions" value={offer.terms_conditions} onChange={value => setOfferField('terms_conditions', value)} required minLength={20} maxLength={2000} multiline error={errors.terms_conditions} hint="Include customer eligibility, excluded items, payment conditions and whether offers combine." />
                                <div className={styles.formActions}><button className={styles.primary} type="submit">{busy ? 'Saving…' : 'Save offer draft'}</button><p className={styles.small}>Submit your saved changes from Overview.</p></div></fieldset></form></section>}
                        </>}
                        {tab === 'activity' && <><div className={styles.sectionHeading}><div><h2>Your review history</h2><p>Submissions, decisions and website updates, in one place.</p></div><button className={styles.secondary} disabled={busy} onClick={() => { setBusy(true); clearMessages(); void loadWorkspace().catch(showError).finally(() => setBusy(false)); }}>Refresh updates</button></div>{dashboard.activity.length ? <ol className={styles.activityList}>{dashboard.activity.map((item, index) => <li className={styles.activityRow} key={`${item.event}-${item.created_at}-${index}`}><div><strong>{readable(item.event)}</strong><p>{item.message}</p><span className={styles.small}>Version {item.revision}</span></div><time>{formatDate(item.created_at)}</time></li>)}</ol> : <div className={styles.empty}><i className="fas fa-clock" aria-hidden="true" /><h3>Your story is just getting started.</h3><p>Send your first submission to start a review history. Every decision and publication update will appear here.</p><button className={styles.secondary} onClick={() => changeTab('overview')}>Return to Overview</button></div>}</>}
                    </div>
                </div>
            </> : <div className={styles.empty}><h2>We couldn’t open your workspace.</h2><p>Your saved drafts are kept in your account. Try loading them again.</p><button className={styles.primary} onClick={() => void initialize()}>Reload workspace</button></div>}
    </div></div>;
}
