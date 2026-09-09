"""Verify initial-HTML images in the release export, including remote responses."""
import concurrent.futures
import importlib.util
import json
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote

spec = importlib.util.spec_from_file_location('audit', Path(__file__).with_name('audit-live-indexing.py'))
audit = importlib.util.module_from_spec(spec); spec.loader.exec_module(audit)
root = Path(__file__).resolve().parents[1] / 'out'
images = set()
for file in root.rglob('*.html'):
    page = audit.Page(); page.feed(file.read_text(encoding='utf-8'))
    url = 'https://couponpush.com/' + file.relative_to(root).as_posix()
    images.update(urljoin(url, src) for src in page.images if not src.startswith('data:'))
errors, remote = [], []
for url in sorted(images):
    parsed = urlparse(url)
    if parsed.hostname == 'couponpush.com':
        file = (root / unquote(parsed.path).lstrip('/')).resolve()
        if not file.is_relative_to(root.resolve()) or not file.is_file(): errors.append({'url': url, 'error': 'Missing exported file'})
    else: remote.append(url)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    for result in pool.map(audit.fetch, remote):
        if result.get('status') != 200 or not result.get('type', '').startswith('image/'):
            errors.append({k: v for k, v in result.items() if k != 'body'})
report = {'unique_images': len(images), 'remote_images': len(remote), 'errors': errors}
(root.parents[1] / 'output/seo/export-image-check.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
raise SystemExit(bool(errors))
