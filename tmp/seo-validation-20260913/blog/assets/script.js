const menuButton = document.querySelector('[data-menu-button]');
const mobileNav = document.querySelector('[data-mobile-nav]');
function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
  mobileNav?.classList.remove('is-open');
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileNav?.classList.toggle('is-open', open);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileNav?.classList.contains('is-open')) { closeMenu(); menuButton?.focus(); }
});
mobileNav?.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
matchMedia('(min-width: 961px)').addEventListener('change', closeMenu);
document.querySelectorAll('.desktop-nav a, .mobile-nav a').forEach((link) => {
  if (new URL(link.href).pathname === location.pathname) link.setAttribute('aria-current', 'page');
});
document.querySelectorAll('[data-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const filterItems = [...document.querySelectorAll('[data-article-topic]')];
const queryInput = document.querySelector('[data-guide-query]');
let selected = 'all';
function filterGuides() {
  const query = (queryInput?.value || '').trim().toLowerCase();
  let count = 0;
  filterItems.forEach((item) => {
    const matches = (selected === 'all' || item.dataset.articleTopic === selected) && item.textContent.toLowerCase().includes(query);
    item.hidden = !matches;
    if (matches) count++;
  });
  const status = document.querySelector('[data-search-status]');
  if (status) status.textContent = `${count} ${count === 1 ? 'guide' : 'guides'}${query ? ` matching “${queryInput.value.trim()}”` : ''}`;
  const empty = document.querySelector('[data-empty-state]');
  if (empty) empty.hidden = count > 0;
  filterButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.filter === selected);
    button.setAttribute('aria-pressed', String(button.dataset.filter === selected));
  });
}
filterButtons.forEach((button) => button.addEventListener('click', () => { selected = button.dataset.filter; filterGuides(); }));
if (queryInput) {
  queryInput.value = new URLSearchParams(location.search).get('q') || '';
  queryInput.addEventListener('input', filterGuides);
  filterGuides();
}
document.querySelectorAll('[data-search-form]').forEach((form) => form.addEventListener('submit', (event) => {
  if (!queryInput) return;
  event.preventDefault();
  const url = new URL(location.href);
  if (queryInput.value.trim()) url.searchParams.set('q', queryInput.value.trim());
  else url.searchParams.delete('q');
  history.replaceState(null, '', url);
  filterGuides();
}));
document.querySelector('[data-search-reset]')?.addEventListener('click', () => {
  selected = 'all'; queryInput.value = '';
  const url = new URL(location.href); url.searchParams.delete('q');
  history.replaceState(null, '', url); filterGuides(); queryInput.focus();
});
document.querySelectorAll('[data-copy-target]').forEach((button) => button.addEventListener('click', async () => {
  const status = document.querySelector('[data-copy-status]');
  try {
    await navigator.clipboard.writeText(document.getElementById(button.dataset.copyTarget).textContent);
    if (status) status.textContent = 'Copied. Paste the code into your website.';
  } catch {
    if (status) status.textContent = 'Copy is unavailable. Select and copy the code above.';
  }
}));
const calculator = document.querySelector('[data-calculator]');
if (calculator) {
  if (new URLSearchParams(location.search).get('embed') === '1') document.body.classList.add('calculator-embed');
  const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
  calculator.addEventListener('submit', (event) => {
    event.preventDefault();
    const [cart, pct, cap, fees, minimum] = ['cart', 'pct', 'cap', 'fees', 'minimum'].map((id) => Number(calculator.elements.namedItem(id).value));
    const output = document.querySelector('[data-calculator-result]');
    const error = document.querySelector('[data-calculator-error]');
    if (![cart, pct, cap, fees, minimum].every(Number.isFinite) || cart <= 0 || pct < 0 || pct > 100 || Math.min(cap, fees, minimum) < 0) {
      error.textContent = 'Enter a cart value above zero, a discount from 0 to 100%, and non-negative fees and limits.';
      output.hidden = true; return;
    }
    error.textContent = '';
    const eligible = cart >= minimum;
    const discount = eligible ? Math.min(cart * pct / 100, cap || Infinity) : 0;
    output.hidden = false; output.replaceChildren();
    const headline = document.createElement('strong');
    headline.textContent = `You pay ${currency.format(cart - discount + fees)}`;
    const details = document.createElement('p');
    details.textContent = `Coupon discount: ${currency.format(discount)} · ${(discount / cart * 100).toFixed(1)}% of eligible items. Includes ${currency.format(fees)} in fees.`;
    const note = document.createElement('p');
    note.textContent = eligible ? 'Compare this total with buying the same items without the offer. Merchant terms and rounding may differ.' : `This basket does not meet the ${currency.format(minimum)} minimum spend. No coupon discount applied.`;
    output.append(headline, details, note);
  });
}
