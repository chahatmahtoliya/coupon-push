'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './CouponDescription.module.css';

export function CouponDescription({ children, className = '', previewLines = 3 }: { children: string; className?: string; previewLines?: 2 | 3 }) {
    const id = useId();
    const paragraph = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflowing, setOverflowing] = useState(false);

    useEffect(() => {
        const element = paragraph.current;
        if (!element) return;
        const measure = () => {
            const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
            setOverflowing(element.scrollHeight > lineHeight * previewLines + 1);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        measure();
        return () => observer.disconnect();
    }, [children, previewLines]);

    return <>
        <p ref={paragraph} id={id} className={`${className} ${styles.text}`} data-preview-lines={previewLines} data-expanded={expanded}>{children}</p>
        {(overflowing || expanded) && <button type="button" className={styles.toggle} aria-expanded={expanded} aria-controls={id} onClick={(event) => { event.stopPropagation(); setExpanded(value => !value); }}>{expanded ? 'Read less' : 'Read more'}</button>}
    </>;
}
