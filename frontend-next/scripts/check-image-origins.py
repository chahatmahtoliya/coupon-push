"""Find working copies of the broken first-party images found by the live audit."""
import concurrent.futures
import importlib.util
import json
from pathlib import Path
from urllib.parse import urlparse

spec = importlib.util.spec_from_file_location('audit', Path(__file__).with_name('audit-live-indexing.py'))
audit = importlib.util.module_from_spec(spec); spec.loader.exec_module(audit)
report_dir = Path(__file__).resolve().parents[2] / 'output/seo'
report = json.loads((report_dir / 'live-indexing-audit.json').read_text())
urls = {origin + urlparse(image['url']).path for image in report['images'] if image.get('status') == 404 and urlparse(image['url']).hostname.endswith('couponpush.com') for origin in ('https://couponpush.com', 'https://media.couponpush.com', 'https://api.couponpush.com')}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = [{k: v for k, v in result.items() if k != 'body'} for result in pool.map(audit.fetch, sorted(urls))]
(report_dir / 'image-origin-check.json').write_text(json.dumps(results, indent=2))
print(json.dumps([result for result in results if result.get('status') == 200], indent=2))
