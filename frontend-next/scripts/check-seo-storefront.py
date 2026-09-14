"""Regression checks for the storefront SEO rollout, independent of blog URL work."""
import json
import sys
from pathlib import Path
from html.parser import HTMLParser
import xml.etree.ElementTree as ET

out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'out'
class Page(HTMLParser):
    def __init__(self, file):
        super().__init__()
        self.title = ''; self.in_title = False; self.h1 = 0
        self.canonical = []; self.links = []; self.robots = ''; self.description = ''
        self.feed(file.read_text(encoding='utf-8'))
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title': self.in_title = True
        if tag == 'h1': self.h1 += 1
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonical.append(attrs.get('href'))
        if tag == 'a': self.links.append(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('name') == 'robots': self.robots = attrs.get('content', '')
        if tag == 'meta' and attrs.get('name') == 'description': self.description = attrs.get('content', '')
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
    def handle_data(self, value):
        if self.in_title: self.title += value

for slug in ['deconstruct', 'snitch', 'foxtale', 'kapiva-coupon-code', 'newme', 'pilgrim']:
    file = out / 'store' / slug / 'index.html'
    page = Page(file)
    assert page.h1 == 1, slug
    assert 'noindex' not in page.robots, slug
    assert page.canonical == [f'https://couponpush.com/store/{slug}/'], slug
    assert page.description and 'in India | CouponPush' in page.title, slug
    html = file.read_text(encoding='utf-8')
    assert 'store-ui-shopping-guide' in html and 'FAQPage' in html, slug
    assert 'Check date not recorded' in html, slug
    assert any(link.startswith('mailto:contact@couponpush.com?subject=') for link in page.links), slug
minimalist = Page(out / 'store/minimalist/index.html')
assert 'Offers & Deals' in minimalist.title and 'Coupon Codes' not in minimalist.title
home = Page(out / 'index.html')
for slug in ['amazon', 'flipkart', 'ajio']:
    assert f'/store/{slug}/' in home.links
    assert not any(link.startswith(f'/coupons/?store={slug}') for link in home.links)
assert not any(link in ['https://facebook.com', 'https://twitter.com', 'https://instagram.com', 'https://youtube.com'] for link in home.links)
assert 'backend offers' not in (out / 'index.html').read_text(encoding='utf-8')
redirects = (out / '_redirects').read_text(encoding='utf-8')
locations = {item.text for file in out.glob('sitemap*.xml') for item in ET.parse(file).getroot().findall('.//{*}loc')}
for alias, target in [('derma-co-coupon-code', 'the-derma-co'), ('dot-key-coupon-codes', 'dot-key')]:
    assert not (out / 'store' / alias / 'index.html').exists()
    assert f'/store/{alias}/ /store/{target}/ 301' in redirects
    assert f'https://couponpush.com/store/{alias}/' not in locations
    assert f'https://couponpush.com/store/{target}/' in locations
print('Storefront SEO export checks passed: six guides, canonicals, metadata, evidence links, aliases and merchant navigation.')
