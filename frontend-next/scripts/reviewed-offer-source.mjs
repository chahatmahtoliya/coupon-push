import { parseDocument } from 'htmlparser2';
import { textContent } from 'domutils';

export function advertisedText(html) {
    const visible = html.replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
    return textContent(parseDocument(visible)).replace(/\s+/g, ' ').trim();
}

export function matchesAdvertisement(text, patterns) {
    return patterns.length > 0 && patterns.every(pattern => new RegExp(pattern, 'iu').test(text));
}

export function materialOffer(offer) {
    const { checkedAt, updatedAt, sourceHash, ...material } = offer;
    return JSON.stringify(material);
}
