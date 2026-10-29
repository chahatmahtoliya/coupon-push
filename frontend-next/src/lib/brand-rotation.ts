/** Interleave brands while retaining the ranked order of each brand's offers. */
export function rotateOffersByBrand<T extends { store_slug: string }>(offers: readonly T[]): T[] {
    const brands = new Map<string, T[]>();
    for (const offer of offers) {
        const queue = brands.get(offer.store_slug) || [];
        queue.push(offer);
        brands.set(offer.store_slug, queue);
    }

    const result: T[] = [];
    let active = [...brands.values()];
    for (let round = 0; active.length; round++) {
        active = active.filter(queue => round < queue.length);
        for (const queue of active) result.push(queue[round]);
    }
    return result;
}
