"""Regression checks for failure-safe catalog preparation, using isolated fixtures."""
import http.server
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest

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

if __name__ == '__main__': unittest.main()
