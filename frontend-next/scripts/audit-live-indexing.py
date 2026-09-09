"""Audit public sitemap HTML and image responses; does not impersonate Googlebot."""
import concurrent.futures
import datetime
import importlib.util
import json
from pathlib import Path
import urllib.request
import urllib.error
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location('seo', Path(__file__).with_name('check-seo.py'))
seo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seo)
BASE = 'https://couponpush.com'

class Page(seo.Page):
    def __init__(self):
        super().__init__()
        self.images = []
    def handle_starttag(self, tag, attrs):
        super().handle_starttag(tag, attrs)
        attrs = dict(attrs)
        if tag == 'img' and attrs.get('src'):
            self.images.append(attrs['src'])

def fetch(url):
    try:
        request = urllib.request.Request(url, headers={'User-Agent': 'CouponPush-SEO-Audit/1.0'})
        with urllib.request.urlopen(request, timeout=25) as response:
            return {'url': url, 'status': response.status, 'final_url': response.url,
                    'type': response.headers.get('Content-Type', ''),
                    'x_robots_tag': response.headers.get('X-Robots-Tag', ''),
                    'body': response.read().decode('utf-8', errors='replace') if 'image/' not in response.headers.get('Content-Type', '') else ''}
    except urllib.error.HTTPError as error:
        return {'url': url, 'status': error.code}
    except Exception as error:
        return {'url': url, 'error': str(error)}

def main():
    robots = fetch(BASE + '/robots.txt')
    maps = [line.split(':', 1)[1].strip() for line in robots.get('body', '').splitlines() if line.lower().startswith('sitemap:')]
    pending, visited, urls, sitemap_errors = list(maps), set(), set(), []
    while pending:
        url = pending.pop()
        if url in visited: continue
        visited.add(url)
        result = fetch(url)
        try:
            root = ET.fromstring(result.get('body', ''))
            locations = [entry.text for entry in root.findall('.//{*}loc')]
            if root.tag.endswith('sitemapindex'): pending.extend(locations)
            else: urls.update(locations)
        except ET.ParseError:
            sitemap_errors.append({k: v for k, v in result.items() if k != 'body'})
    images, pages = set(), []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for result in pool.map(fetch, sorted(urls)):
            page = Page(); page.feed(result.pop('body', ''))
            result.update(title=page.title, description=page.description, canonicals=page.canonicals, noindex=page.noindex, h1=page.h1)
            images.update(urljoin(result['url'], src) for src in page.images if not src.startswith('data:'))
            pages.append(result)
        image_results = [{k: v for k, v in result.items() if k != 'body'} for result in pool.map(fetch, sorted(images))]
    report = {'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'robots': robots,
              'sitemaps': sorted(visited), 'sitemap_errors': sitemap_errors, 'pages': pages, 'images': image_results}
    output = Path(__file__).resolve().parents[2] / 'output/seo/live-indexing-audit.json'
    output.write_text(json.dumps(report, indent=2), encoding='utf-8')
    bad_pages = [p for p in pages if p.get('status') != 200 or p['noindex'] or p['canonicals'] != [p['url']] or p.get('x_robots_tag')]
    bad_images = [i for i in image_results if i.get('status') != 200 or not i.get('type', '').startswith('image/')]
    print(json.dumps({'pages_checked': len(pages), 'images_checked': len(images), 'sitemap_errors': sitemap_errors, 'page_issues': bad_pages, 'image_issues': bad_images}, indent=2))

if __name__ == '__main__': main()
