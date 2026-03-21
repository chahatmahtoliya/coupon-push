import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component with smooth page transition animation.
 * Triggers a fade-in/slide-up animation on every route change.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll to top instantly
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });

        // Add page transition class to main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            // Remove animation class first to reset
            mainContent.classList.remove('page-transition-active');

            // Force reflow to restart animation
            void (mainContent as HTMLElement).offsetWidth;

            // Add animation class
            mainContent.classList.add('page-transition-active');
        }
    }, [pathname]);

    return null;
};

export default ScrollToTop;

