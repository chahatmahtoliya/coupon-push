'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './CouponDescription.module.css';

export function CouponDescription({ children, className = '', collapsed = false }: { children: string; className?: string; collapsed?: boolean }) {
    const id = useId();
    const paragraph = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflowing, setOverflowing] = useState(false);

    useEffect(() => {
        if (collapsed) return;
        const element = paragraph.current;
        if (!element) return;
        const measure = () => {
            const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
            setOverflowing(element.scrollHeight > lineHeight * 3 + 1);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        measure();
        return () => observer.disconnect();
    }, [children, collapsed]);

    if (collapsed) return <details className={styles.disclosure}>
        <summary><span className={styles.more}>Read more</span><span className={styles.less}>Read less</span></summary>
        <p className={className}>{children}</p>
    </details>;

    return <>
        <p ref={paragraph} id={id} className={`${className} ${styles.text}`} data-expanded={expanded}>{children}</p>
        {(overflowing || expanded) && <button type="button" className={styles.toggle} aria-expanded={expanded} aria-controls={id} onClick={(event) => { event.stopPropagation(); setExpanded(value => !value); }}>{expanded ? 'Read less' : 'Read more'}</button>}
    </>;
}
