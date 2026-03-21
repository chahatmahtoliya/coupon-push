/**
 * CouponHub - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', function () {

    // Initialize all components
    initBackToTop();
    initCouponModal();
    initMobileSearch();
    initScrollAnimations();

});

/**
 * Back to Top Button
 */
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    if (!backToTopBtn) return;

    window.addEventListener('scroll', function () {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', function () {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Coupon Modal Handler
 */
function initCouponModal() {
    const couponModal = document.getElementById('couponModal');

    if (!couponModal) return;

    couponModal.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;

        // Get data from button attributes
        const storeName = button.getAttribute('data-store-name');
        const storeLogo = button.getAttribute('data-store-logo');
        const couponTitle = button.getAttribute('data-coupon-title');
        const couponCode = button.getAttribute('data-coupon-code');
        const affiliateLink = button.getAttribute('data-affiliate-link');

        // Update modal content
        document.getElementById('modalStoreName').textContent = storeName;
        document.getElementById('modalStoreLogo').src = storeLogo;
        document.getElementById('modalCouponTitle').textContent = couponTitle;
        document.getElementById('modalCouponCode').textContent = couponCode;
        document.getElementById('modalAffiliateLink').href = affiliateLink;

        // Reset copy message
        document.getElementById('copyMessage').textContent = '';
    });
}

/**
 * Copy Coupon Code
 */
function copyCode() {
    const codeElement = document.getElementById('modalCouponCode');
    const copyBtn = document.getElementById('copyCodeBtn');
    const copyMessage = document.getElementById('copyMessage');
    const code = codeElement.textContent;

    navigator.clipboard.writeText(code).then(function () {
        // Success
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyBtn.classList.add('copied');
        copyMessage.textContent = 'Code copied to clipboard!';
        copyMessage.style.color = '#10b981';

        // Reset after 3 seconds
        setTimeout(function () {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
            copyBtn.classList.remove('copied');
        }, 3000);
    }).catch(function (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);

        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyMessage.textContent = 'Code copied to clipboard!';
        copyMessage.style.color = '#10b981';
    });
}

/**
 * Get Coupon (for deals without code)
 */
function getDeal(affiliateLink, dealId) {
    // Track click
    fetch('/track-click.php?type=deal&id=' + dealId, {
        method: 'POST'
    });

    // Open affiliate link
    window.open(affiliateLink, '_blank');
}

/**
 * Track Coupon Click
 */
function trackCouponClick(couponId) {
    fetch('/track-click.php?type=coupon&id=' + couponId, {
        method: 'POST'
    });
}

/**
 * Toggle Coupon Details Dropdown
 */
function toggleDetails(button) {
    // Toggle button active state
    button.classList.toggle('active');
    
    // Update button text
    const isActive = button.classList.contains('active');
    button.innerHTML = isActive 
        ? 'Hide Details <i class="fas fa-chevron-up"></i>'
        : 'Show Details <i class="fas fa-chevron-down"></i>';
    
    // Find the dropdown (next sibling of parent meta div)
    const couponContent = button.closest('.coupon-content-new');
    const dropdown = couponContent.querySelector('.coupon-details-dropdown');
    
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

/**
 * Mobile Search Toggle
 */
function initMobileSearch() {
    const mobileSearchToggle = document.getElementById('mobileSearchToggle');
    const mobileSearchForm = document.getElementById('mobileSearchForm');

    if (!mobileSearchToggle || !mobileSearchForm) return;

    mobileSearchToggle.addEventListener('click', function () {
        mobileSearchForm.classList.toggle('active');
    });
}

/**
 * Scroll Animations
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (!animatedElements.length) return;

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1
    });

    animatedElements.forEach(function (element) {
        observer.observe(element);
    });
}

/**
 * Countdown Timer for Expiring Coupons
 */
function initCountdowns() {
    const countdowns = document.querySelectorAll('[data-countdown]');

    countdowns.forEach(function (element) {
        const expiryDate = new Date(element.getAttribute('data-countdown')).getTime();

        const interval = setInterval(function () {
            const now = new Date().getTime();
            const distance = expiryDate - now;

            if (distance < 0) {
                clearInterval(interval);
                element.textContent = 'Expired';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                element.textContent = days + 'd ' + hours + 'h left';
            } else if (hours > 0) {
                element.textContent = hours + 'h ' + minutes + 'm left';
            } else {
                element.textContent = minutes + ' min left';
            }
        }, 60000);
    });
}

/**
 * Lazy Load Images
 */
function initLazyLoad() {
    const lazyImages = document.querySelectorAll('img[data-src]');

    if (!lazyImages.length) return;

    const imageObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(function (img) {
        imageObserver.observe(img);
    });
}

/**
 * Search Autocomplete
 */
function initSearchAutocomplete() {
    const searchInput = document.querySelector('.search-input');

    if (!searchInput) return;

    let timeout;

    searchInput.addEventListener('input', function () {
        clearTimeout(timeout);
        const query = this.value.trim();

        if (query.length < 2) {
            hideAutocomplete();
            return;
        }

        timeout = setTimeout(function () {
            fetch('/api/search-suggest.php?q=' + encodeURIComponent(query))
                .then(response => response.json())
                .then(data => {
                    showAutocomplete(data);
                });
        }, 300);
    });
}

function showAutocomplete(results) {
    // Implementation for showing autocomplete dropdown
}

function hideAutocomplete() {
    // Implementation for hiding autocomplete dropdown
}

/**
 * Format Numbers
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Show Toast Notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-' + type;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Debounce Function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle Function
 */
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
