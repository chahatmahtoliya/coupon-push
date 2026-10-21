"""Check that published comparison markup matches the eligible source records."""
from pathlib import Path
from urllib.parse import urlparse
import json
import re
import runpy

root = Path(__file__).resolve().parents[1]
report_dir = root.parent / 'output/seo'
readiness = json.loads((report_dir / 'pseo-readiness.json').read_text(encoding='utf-8'))
Page = runpy.run_path(str(root / 'scripts/check-seo.py'), run_name='seo_check_library')['Page']
errors = []
for entry in readiness['pages']:
    file = root / 'out' / entry['path'].strip('/') / 'index.html'
    if not entry['generated']:
        if file.exists(): errors.append(f"Draft comparison was generated: {entry['path']}")
        continue
    if not file.exists():
        errors.append(f"Comparison missing: {entry['path']}")
        continue
    html = file.read_text(encoding='utf-8')
    page = Page(); page.feed(html)
    canonical = 'https://couponpush.com' + entry['path']
    if page.canonicals != [canonical] or page.h1 != 1 or page.noindex == entry['eligible']:
        errors.append(f"Comparison metadata mismatch: {entry['path']}")
    documents = [item for value in page.json_ld for item in (value if isinstance(value, list) else [value]) if isinstance(item, dict)]
    collections = [item for item in documents if item.get('@type') == 'CollectionPage']
    if len(collections) != 1:
        errors.append(f"Collection schema missing: {entry['path']}"); continue
    items = collections[0].get('mainEntity', {}).get('itemListElement', [])
    ids = [urlparse(item.get('url', '')).fragment for item in items]
    if sorted(ids) != sorted(entry['offerIds']): errors.append(f"Schema differs from eligible inventory: {entry['path']}")
    visible_ids = re.findall(r'\bid="([^\"]+)"', html)
    for offer_id in ids:
        if visible_ids.count(offer_id) != 1: errors.append(f"Offer missing or duplicated in initial HTML: {entry['path']}#{offer_id}")
    if entry['eligible'] and 'Not checkout-tested' not in html: errors.append(f"Evidence disclosure missing: {entry['path']}")
report = {'comparisons_checked': sum(entry['generated'] for entry in readiness['pages']), 'errors': errors}
report_dir.mkdir(parents=True, exist_ok=True)
(report_dir / 'savings-export-check.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report))
raise SystemExit(bool(errors))
