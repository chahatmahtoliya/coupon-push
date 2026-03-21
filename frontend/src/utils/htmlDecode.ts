/**
 * Decode HTML entities like &amp; &lt; &gt; &quot; etc.
 * Handles double-encoded entities
 */
export function decodeHTML(html: string): string {
    if (!html) return html;

    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

/**
 * Decode HTML entities in an object's string properties
 */
export function decodeHTMLInObject<T>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj;

    const decoded = { ...obj } as any;

    for (const key in decoded) {
        if (typeof decoded[key] === 'string') {
            decoded[key] = decodeHTML(decoded[key]);
        }
    }

    return decoded as T;
}
