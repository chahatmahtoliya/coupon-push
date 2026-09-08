'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styles from './CouponDescription.module.css';

export function CouponDescription({ children, className = '' }: { children: string; className?: string }) {
    const id = useId();
    const paragraph = useRef<HTMLParagraphElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [overflowing, setOverflowing] = useState(false);

    useEffect(() => {
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
    }, [children]);

    return <>
        <p ref={paragraph} id={id} className={`${className} ${styles.text}`} data-expanded={expanded}>{children}</p>
        {(overflowing || expanded) && <button type="button" className={styles.toggle} aria-expanded={expanded} aria-controls={id} onClick={(event) => { event.stopPropagation(); setExpanded(value => !value); }}>{expanded ? 'Read less' : 'Read more'}</button>}
    </>;
}
