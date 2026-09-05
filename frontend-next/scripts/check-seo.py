"""Validate exported SEO and write a reviewable indexability inventory."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import csv
import datetime
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out'
REPORT = ROOT.parent / 'output' / 'seo'

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.robots, self.canonicals, self.h1, self.title, self.description = [], [], 0, '', ''
        self.in_title = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title': self.in_title = True
        if tag == 'h1': self.h1 += 1
        if tag == 'meta':
            if attrs.get('name') in ('robots', 'googlebot'): self.robots.append(attrs.get('content', '').lower())
            if attrs.get('name') == 'description': self.description = attrs.get('content', '')
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonicals.append(attrs.get('href'))
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
    def handle_data(self, data):
        if self.in_title: self.title += data
    @property
    def noindex(self): return any('noindex' in item for item in self.robots)

def check():
    errors, rows, indexable = [], [], set()
    snapshot = json.loads((ROOT / 'src/data/deployed-snapshot.json').read_text(encoding='utf-8'))
    urls = [item.text for item in ET.parse(OUT / 'sitemap.xml').findall('.//{*}loc')]
    if len(urls) != len(set(urls)): errors.append('Duplicate sitemap URL')
    for file in OUT.rglob('*.html'):
        relative = file.relative_to(OUT).as_posix()
        if relative in ('404.html', '404/index.html') or relative.startswith('_not-found/'): continue
        route = '/' if relative == 'index.html' else '/' + relative.removesuffix('index.html')
        html = file.read_text(encoding='utf-8')
        page = Page(); page.feed(html)
        canonical = 'https://couponpush.com' + route
        if not page.noindex:
            indexable.add(canonical)
            if page.canonicals != [canonical]: errors.append(f'{route}: missing/incorrect canonical')
            if page.h1 != 1: errors.append(f'{route}: expected one H1, found {page.h1}')
            if not page.title or not page.description: errors.append(f'{route}: missing metadata')
            if page.title.startswith('Store Coupons'): errors.append(f'{route}: fallback title')
        reason = 'indexable'
        if page.noindex:
            reason = 'intentional coupon detail/search exclusion' if route.startswith(('/coupon/', '/search/')) else 'insufficient active inventory or merchant copy/URL; editorial review required'
            if route.startswith('/store/'):
                data = snapshot['stores'].get(route.split('/')[2], {})
                inventory = data.get('coupons', [])
                active = [c for c in inventory if not c.get('expiry_date') or c['expiry_date'][:10] >= datetime.date.today().isoformat()]
                merchant = data.get('store', {})
                if not inventory: reason = 'empty inventory; add supported offers before indexing'
                elif not active: reason = 'all offers expired; refresh inventory'
                elif urlparse(merchant.get('website_url', '')).scheme not in ('http', 'https'): reason = 'missing/invalid merchant URL'
                else: reason = 'small inventory without sufficient merchant-specific copy'
            elif route.startswith('/category/'):
                reason = 'fewer than three active offers; intentionally excluded'
        rows.append({'url': canonical, 'status': 'noindex' if page.noindex else 'indexable', 'reason': reason, 'title': page.title})
    for url in urls:
        if url not in indexable: errors.append(f'Sitemap URL is missing or noindex: {url}')
    for url in indexable - set(urls): errors.append(f'Indexable URL missing from sitemap: {url}')
    cetaphil = (OUT / 'store/cetaphil-coupon-code/index.html').read_text(encoding='utf-8')
    for forbidden in ('$21', '$22', 'Walmart', 'Target USA', 'Save up to 60%'):
        if forbidden in cetaphil: errors.append(f'Cetaphil contains removed claim: {forbidden}')
    if 'Cetaphil Offers &amp; Deals in India' not in cetaphil: errors.append('Cetaphil offers title missing')
    if 'Sitemap: https://couponpush.com/sitemap.xml' not in (OUT / 'robots.txt').read_text(): errors.append('robots.txt missing sitemap')
    for store in snapshot['storesPage']['initialStores']:
        if store['slug'] not in snapshot['stores']:
            rows.append({'url': f"https://couponpush.com/store/{store['slug']}/", 'status': 'not generated', 'reason': 'missing store profile in saved snapshot; refresh API before publishing', 'title': store['name']})
    REPORT.mkdir(parents=True, exist_ok=True)
    with (REPORT / 'indexability.csv').open('w', newline='', encoding='utf-8') as stream:
        writer = csv.DictWriter(stream, fieldnames=['url', 'status', 'reason', 'title']); writer.writeheader(); writer.writerows(rows)
    (REPORT / 'export-check.json').write_text(json.dumps({'indexable_pages': len(indexable), 'sitemap_urls': len(urls), 'errors': errors}, indent=2), encoding='utf-8')
    if errors:
        print('\n'.join(errors)); return 1
    print(f'SEO checks passed: {len(indexable)} indexable pages; sitemap matches. Inventory: {REPORT / "indexability.csv"}')
    return 0

if __name__ == '__main__': sys.exit(check())
