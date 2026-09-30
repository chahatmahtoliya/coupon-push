(() => {
    'use strict';

    const app = document.getElementById('gsc-app');
    if (!app) return;

    const scope = 'https://www.googleapis.com/auth/webmasters.readonly';
    const $ = (id) => document.getElementById(id);
    const connect = $('gsc-connect');
    const disconnect = $('gsc-disconnect');
    const status = $('gsc-status');
    const report = $('gsc-report');
    const property = $('gsc-property');
    const days = $('gsc-days');
    const refresh = $('gsc-refresh');
    const number = new Intl.NumberFormat();
    let tokenClient;
    let accessToken = null;
    let reportRequest = 0;

    function message(text, kind = 'info') {
        status.textContent = text;
        status.className = `alert alert-${kind}`;
        status.classList.remove('d-none');
    }

    function apiError(error) {
        const detail = error && (error.result?.error?.message || error.message || error.error);
        return typeof detail === 'string' ? detail : 'Google could not complete the request.';
    }

    function expired(error) {
        return error?.status === 401 || error?.result?.error?.code === 401;
    }

    function clearReport(hide = true) {
        if (hide) report.classList.add('d-none');
        ['gsc-clicks', 'gsc-impressions', 'gsc-ctr', 'gsc-position'].forEach(id => { $(id).textContent = '—'; });
        $('gsc-queries').replaceChildren();
        $('gsc-pages').replaceChildren();
    }

    function setDisconnected(text) {
        reportRequest += 1;
        accessToken = null;
        if (window.gapi?.client) gapi.client.setToken(null);
        connect.classList.remove('d-none');
        disconnect.classList.add('d-none');
        clearReport();
        message(text);
    }

    function makeDate(offset) {
        const date = new Date();
        date.setUTCHours(12, 0, 0, 0);
        date.setUTCDate(date.getUTCDate() - offset);
        return date.toISOString().slice(0, 10);
    }

    function addCell(row, value, className = '') {
        const cell = document.createElement('td');
        cell.textContent = value;
        if (className) cell.className = className;
        row.appendChild(cell);
    }

    function fillRows(id, rows, isPage) {
        const body = $(id);
        body.replaceChildren();
        if (!rows.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.className = 'text-muted';
            cell.textContent = 'No data for this period.';
            row.appendChild(cell);
            body.appendChild(row);
            return;
        }
        rows.forEach(item => {
            const row = document.createElement('tr');
            const label = String(item.keys?.[0] ?? '');
            if (isPage && /^https?:\/\//i.test(label)) {
                const cell = document.createElement('td');
                const link = document.createElement('a');
                link.href = label;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = label;
                link.className = 'text-break';
                cell.appendChild(link);
                row.appendChild(cell);
            } else {
                addCell(row, label, 'text-break');
            }
            addCell(row, number.format(item.clicks || 0), 'text-end');
            addCell(row, number.format(item.impressions || 0), 'text-end');
            body.appendChild(row);
        });
    }

    async function request(path, method = 'GET', body) {
        const response = await gapi.client.request({ path, method, ...(body ? { body } : {}) });
        return response.result || {};
    }

    async function loadProperties() {
        message('Loading Search Console properties…');
        const result = await request('/webmasters/v3/sites');
        const entries = (result.siteEntry || []).filter(item => item.siteUrl && item.permissionLevel !== 'siteUnverifiedUser');
        property.replaceChildren();
        entries.forEach(item => {
            const option = document.createElement('option');
            option.value = item.siteUrl;
            option.textContent = item.siteUrl;
            property.appendChild(option);
        });
        if (!entries.length) {
            clearReport();
            message('This Google account has no verified Search Console properties. Grant it access in Search Console, then reconnect.', 'warning');
            return;
        }
        const preferred = entries.find(item => item.siteUrl === 'sc-domain:couponpush.com') ||
            entries.find(item => item.siteUrl === 'https://couponpush.com/');
        if (preferred) property.value = preferred.siteUrl;
        report.classList.remove('d-none');
        await loadReport();
    }

    async function loadReport() {
        if (!accessToken || !property.value) return;
        const currentRequest = ++reportRequest;
        refresh.disabled = true;
        message('Loading search performance…');
        const endDate = makeDate(3);
        const startDate = makeDate(Number(days.value) + 2);
        $('gsc-dates').textContent = `${startDate} to ${endDate} · Search Console complete days`;
        const path = `/webmasters/v3/sites/${encodeURIComponent(property.value)}/searchAnalytics/query`;
        const range = { startDate, endDate, type: 'web' };
        try {
            const [totals, queries, pages] = await Promise.all([
                request(path, 'POST', { ...range, rowLimit: 1 }),
                request(path, 'POST', { ...range, dimensions: ['query'], rowLimit: 10 }),
                request(path, 'POST', { ...range, dimensions: ['page'], rowLimit: 10 })
            ]);
            if (currentRequest !== reportRequest) return;
            const total = totals.rows?.[0] || {};
            $('gsc-clicks').textContent = number.format(total.clicks || 0);
            $('gsc-impressions').textContent = number.format(total.impressions || 0);
            $('gsc-ctr').textContent = `${((total.ctr || 0) * 100).toFixed(1)}%`;
            $('gsc-position').textContent = total.position ? Number(total.position).toFixed(1) : '—';
            fillRows('gsc-queries', queries.rows || [], false);
            fillRows('gsc-pages', pages.rows || [], true);
            status.classList.add('d-none');
        } catch (error) {
            if (currentRequest !== reportRequest) return;
            clearReport(false);
            if (expired(error)) setDisconnected('Google access expired. Connect again to refresh the report.');
            else message(`Search Console request failed: ${apiError(error)}`, 'danger');
        } finally {
            if (currentRequest === reportRequest) refresh.disabled = false;
        }
    }

    async function initialize() {
        try {
            await new Promise((resolve, reject) => {
                const start = Date.now();
                const timer = setInterval(() => {
                    if (window.gapi && window.google?.accounts?.oauth2) {
                        clearInterval(timer);
                        resolve();
                    } else if (Date.now() - start > 15000) {
                        clearInterval(timer);
                        reject(new Error('Google scripts could not load. Check your connection or content security policy.'));
                    }
                }, 100);
            });
            await new Promise((resolve, reject) => gapi.load('client', { callback: resolve, onerror: reject, timeout: 15000, ontimeout: reject }));
            await gapi.client.init({});
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: app.dataset.clientId,
                scope,
                callback: async response => {
                    if (response.error) {
                        message(`Google authorization failed: ${response.error}`, 'danger');
                        return;
                    }
                    accessToken = response.access_token;
                    gapi.client.setToken({ access_token: accessToken });
                    connect.classList.add('d-none');
                    disconnect.classList.remove('d-none');
                    try { await loadProperties(); }
                    catch (error) {
                        if (expired(error)) setDisconnected('Google access expired. Connect again.');
                        else message(`Could not list properties: ${apiError(error)}`, 'danger');
                    }
                }
            });
            connect.disabled = false;
            message('Ready. Connect Google to view Search Console data.');
        } catch (error) {
            message(error.message || 'Could not load Google API libraries.', 'danger');
        }
    }

    connect.addEventListener('click', () => tokenClient?.requestAccessToken({ prompt: 'consent' }));
    disconnect.addEventListener('click', () => {
        if (accessToken) google.accounts.oauth2.revoke(accessToken, () => {});
        setDisconnected('Disconnected. Connect Google to view Search Console data.');
    });
    property.addEventListener('change', loadReport);
    days.addEventListener('change', loadReport);
    refresh.addEventListener('click', loadReport);
    initialize();
})();
