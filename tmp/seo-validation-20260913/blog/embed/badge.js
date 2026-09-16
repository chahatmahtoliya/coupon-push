// Optional CouponPush link for publisher websites.
(() => {
  const script = document.currentScript;
  if (!script?.parentNode) return;
  const link = document.createElement('a');
  link.href = 'https://couponpush.com/';
  link.textContent = 'Find coupons on CouponPush';
  link.style.cssText = 'display:inline-block;padding:8px 12px;border:1px solid #c2410c;border-radius:6px;color:#c2410c;font:600 14px system-ui;text-decoration:none;background:#fff';
  script.before(link);
})();
