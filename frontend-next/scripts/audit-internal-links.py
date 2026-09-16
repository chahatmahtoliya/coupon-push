"""Check exported HTML links and crawl depth without relying on XML discovery."""
from collections import Counter, deque
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out'
ORIGIN = 'https://couponpush.com'

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.canonical, self.noindex = [], None, False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and attrs.get('href'): self.links.append(attrs['href'])
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonical = attrs.get('href')
        if tag == 'meta' and attrs.get('name') in ('robots', 'googlebot') and 'noindex' in attrs.get('content', ''): self.noindex = True

def audit():
    pages, aliases = {}, {}
    for file in OUT.rglob('*.html'):
        relative = file.relative_to(OUT).as_posix()
        if relative in ('404.html', '404/index.html') or relative.startswith('_not-found/'): continue
        page = Page(); page.feed(file.read_text(encoding='utf-8'))
        route = '/' + relative.removesuffix('index.html')
        canonical = urlparse(page.canonical or ORIGIN + route).path
        pages[canonical] = page
        aliases[route] = canonical
        aliases['/' + relative] = canonical
        if relative.endswith('/index.html'): aliases[route.rstrip('/')] = canonical
        elif relative.endswith('.html'): aliases[route.removesuffix('.html')] = canonical
    redirects = {}
    for line in (OUT / '_redirects').read_text().splitlines():
        if line.strip() and not line.startswith('#'):
            source, target, _ = line.split(); redirects[source] = target
    missing, indirect, edges = [], [], {}
    for route, page in pages.items():
        edges[route] = set()
        for href in page.links:
            url = urlparse(urljoin(ORIGIN + route, href))
            if url.netloc != 'couponpush.com' or url.scheme not in ('http', 'https'): continue
            path = unquote(url.path)
            target = aliases.get(redirects.get(path, path))
            if target:
                edges[route].add(target)
                if path != target: indirect.append({'source': route, 'href': href, 'canonical': target})
            elif not (OUT / path.lstrip('/')).is_file(): missing.append({'source': route, 'href': href})
    depths, queue = {'/': 0}, deque(['/'])
    while queue:
        for target in edges.get(queue.popleft(), []):
            if target not in depths:
                # Every known parent is already in the BFS depth map.
                parents = [depths[parent] for parent in edges if parent in depths and target in edges[parent]]
                depths[target] = min(parents) + 1
                queue.append(target)
    indexable = {route for route, page in pages.items() if not page.noindex}
    orphan = sorted(indexable - depths.keys())
    deep = {route: depth for route, depth in depths.items() if route in indexable and depth > 3}
    report = {'indexable_pages': len(indexable), 'broken_links': missing, 'noncanonical_links': indirect, 'orphan_pages': orphan, 'pages_beyond_three_clicks': deep, 'depths': {route: depths.get(route) for route in sorted(indexable)}}
    dest = ROOT.parent / 'output/seo/internal-links.json'; dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps({key: value if not isinstance(value, (list, dict)) else len(value) for key, value in report.items() if key != 'depths'}))
    if missing: print('Broken targets:', Counter(item['href'] for item in missing).most_common(15))
    if orphan: print('Orphans:', orphan)
    if deep: print('Beyond three clicks:', deep)
    return int(bool(missing or indirect or orphan or deep))

if __name__ == '__main__': sys.exit(audit())
