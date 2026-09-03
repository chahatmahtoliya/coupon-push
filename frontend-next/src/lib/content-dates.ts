interface DatedRecord {
    created_at?: string | null;
    updated_at?: string | null;
}

function validTimestamp(value?: string | null): number | null {
    if (!value) return null;
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return null;

    // Ignore impossible future dates instead of publishing a misleading lastmod.
    return timestamp <= Date.now() + 86_400_000 ? timestamp : null;
}

export function getLatestContentUpdate(...records: Array<DatedRecord | null | undefined>): string | undefined {
    const timestamps = records.flatMap((record) => {
        if (!record) return [];
        return [validTimestamp(record.updated_at), validTimestamp(record.created_at)]
            .filter((timestamp): timestamp is number => timestamp !== null);
    });

    return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : undefined;
}
