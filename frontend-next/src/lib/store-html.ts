import sanitizeHtml from 'sanitize-html';

export function sanitizeStoreHtml(value: string): string {
    return sanitizeHtml(value, {
        allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
        allowedAttributes: { a: ['href', 'title'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'] },
        allowedSchemes: ['https', 'http', 'mailto'],
        nonTextTags: ['head', 'script', 'style', 'textarea', 'option', 'title'],
        transformTags: { h1: 'h2' },
    });
}
