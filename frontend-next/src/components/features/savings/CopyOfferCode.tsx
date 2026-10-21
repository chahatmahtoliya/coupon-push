'use client';

import { useState } from 'react';
import styles from './savings.module.css';

export function CopyOfferCode({ code }: { code: string }) {
    const [message, setMessage] = useState('');
    async function copy() {
        try { await navigator.clipboard.writeText(code); setMessage('Copied'); }
        catch { setMessage('Select the code to copy it manually.'); }
    }
    return <div className={styles.codeRow}><code>{code}</code><button type="button" onClick={copy} aria-label={`Copy code ${code}`}>Copy code<i className="far fa-copy" aria-hidden="true" /></button><span role="status">{message}</span></div>;
}
