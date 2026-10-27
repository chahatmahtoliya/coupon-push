// Behaviors for the shared homepage markup on standalone static blog pages.
(() => {
  const button = document.querySelector('.cp-menu-button');
  const drawer = document.querySelector('#mobile-navigation-dialog');
  const overlay = document.querySelector('.cp-site-chrome .mobile-menu-overlay');
  const closeButton = drawer?.querySelector('.mobile-menu-close');
  if (!button || !drawer) return;
  let previousOverflow = '';
  function setMenu(open) {
    if (open) previousOverflow = document.body.style.overflow;
    drawer.hidden = !open;
    drawer.classList.toggle('active', open);
    drawer.setAttribute('aria-hidden', String(!open));
    overlay?.classList.toggle('active', open);
    overlay?.setAttribute('aria-hidden', String(!open));
    button.classList.toggle('active', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : previousOverflow;
    (open ? closeButton : button)?.focus();
  }
  button.addEventListener('click', () => setMenu(drawer.hidden));
  closeButton?.addEventListener('click', () => setMenu(false));
  overlay?.addEventListener('click', () => setMenu(false));
  drawer.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (drawer.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
    if (event.key !== 'Tab') return;
    const items = [...drawer.querySelectorAll('a[href],button,input')];
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  matchMedia('(min-width: 1181px)').addEventListener('change', event => {
    if (event.matches && !drawer.hidden) setMenu(false);
  });
  document.querySelectorAll('.cp-site-chrome .cp-search form,.cp-site-chrome .mobile-menu-search form').forEach(form => {
    form.action = '/search/';
    form.method = 'get';
    form.querySelector('input').name = 'q';
    form.addEventListener('submit', event => {
      const query = form.querySelector('input').value.trim();
      event.preventDefault();
      if (query) location.assign(`/search/?q=${encodeURIComponent(query)}`);
    });
  });
})();
