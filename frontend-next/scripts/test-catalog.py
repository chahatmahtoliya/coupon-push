"""Regression checks for failure-safe catalog preparation, using isolated fixtures."""
import http.server
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts/prepare-catalog.mjs'

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"success":true,"data":[]}')
    def log_message(self, *args): pass

class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name) / 'frontend'
        self.file = self.root / 'src/data/deployed-snapshot.json'
        self.file.parent.mkdir(parents=True)
        self.file.write_bytes((ROOT / 'src/data/deployed-snapshot.json').read_bytes())
        (self.file.parent / 'store-redirects.json').write_bytes((ROOT / 'src/data/store-redirects.json').read_bytes())
    def tearDown(self): self.temp.cleanup()
    def run_prepare(self, *args, api=None):
        env = os.environ.copy()
        if api: env['API_URL'] = api
        return subprocess.run(['node', str(SCRIPT), *args], cwd=self.root, env=env, capture_output=True, text=True, timeout=25)
    def test_connection_failure_preserves_snapshot(self):
        before = self.file.read_bytes()
        result = self.run_prepare('--refresh', api='http://127.0.0.1:1/api')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(before, self.file.read_bytes())
    def test_successful_but_empty_api_preserves_snapshot(self):
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            before = self.file.read_bytes()
            result = self.run_prepare('--refresh', api=f'http://127.0.0.1:{server.server_port}')
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(before, self.file.read_bytes())
        finally:
            server.shutdown(); server.server_close(); thread.join()
    def test_saved_snapshot_removes_unsupported_cetaphil_offer_everywhere(self):
        snapshot = json.loads(self.file.read_text(encoding='utf-8'))
        bad = dict(snapshot['stores']['cetaphil-coupon-code']['coupons'][0], id=99999, title='Cetaphil at Walmart USA', source_url=None)
        snapshot['stores']['cetaphil-coupon-code']['coupons'].append(bad)
        snapshot['categories']['beauty-health']['coupons'].append(bad)
        snapshot['coupons']['99999'] = bad
        self.file.write_text(json.dumps(snapshot), encoding='utf-8')
        result = self.run_prepare()
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(self.file.read_text(encoding='utf-8'))
        self.assertIsNone(data['coupons']['99999'])
        self.assertNotIn('Walmart USA', self.file.read_text(encoding='utf-8'))
        self.assertEqual(data['stores']['cetaphil-coupon-code']['coupons'][0]['code'], '')
        self.assertTrue(list((self.root.parent / 'output/seo').glob('cetaphil-quarantine-*.json')))

    def paged_server(self, repeat=False):
        snapshot = json.loads(self.file.read_text(encoding='utf-8'))
        pages = dict(snapshot['stores'])
        directory = [page['store'] for page in pages.values()]
        next_id = max(store['id'] for store in directory) + 1
        while len(directory) < 501:
            store = dict(directory[0], id=next_id, slug=f'isolated-brand-{next_id}', name=f'Isolated Brand {next_id}')
            directory.append(store); pages[store['slug']] = {'store': store, 'coupons': []}; next_id += 1
        offsets = []
        class PagedHandler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                parsed = urlparse(self.path); query = parse_qs(parsed.query)
                endpoint = parsed.path.rsplit('/', 1)[-1]
                if endpoint == 'stores.php':
                    offset = int(query.get('offset', ['0'])[0]); offsets.append(offset)
                    data = directory[0:500] if repeat else directory[offset:offset + 500]
                elif endpoint == 'store.php': data = pages[query['slug'][0]]
                elif endpoint == 'categories.php': data = snapshot['categoriesPage']['initialCategories']
                elif endpoint == 'coupons.php': data = snapshot['categories'].get(query['category'][0], {}).get('coupons', [])
                elif endpoint == 'deals.php': data = snapshot['dealsPage']['initialDeals']
                else: data = []
                self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'data': data}).encode())
            def log_message(self, *args): pass
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), PagedHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        self.addCleanup(thread.join); self.addCleanup(server.server_close); self.addCleanup(server.shutdown)
        return f'http://127.0.0.1:{server.server_port}', offsets, directory[-1]['slug']

    def test_refresh_includes_brand_beyond_first_directory_page(self):
        api, offsets, last_slug = self.paged_server()
        result = self.run_prepare('--refresh', '--preserve-promotions', api=api)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(offsets, [0, 500])
        data = json.loads(self.file.read_text(encoding='utf-8'))
        self.assertIn(last_slug, data['stores'])
        self.assertTrue(any(store['slug'] == last_slug for store in data['storesPage']['initialStores']))

    def test_repeated_directory_page_preserves_snapshot(self):
        api, offsets, _ = self.paged_server(repeat=True)
        before = self.file.read_bytes()
        result = self.run_prepare('--refresh', '--preserve-promotions', api=api)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('pagination repeated', result.stderr)
        self.assertEqual(offsets, [0, 500])
        self.assertEqual(before, self.file.read_bytes())

if __name__ == '__main__': unittest.main()
