"""Isolated merchant/API regression tests. Never connects to the production database or sends mail."""
import contextlib
import http.cookiejar
import json
import os
from pathlib import Path
import re
import socket
import sqlite3
import subprocess
import tempfile
import time
import unittest
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
PHP = os.environ.get('PHP_BIN', r'C:\xampp\php\php.exe')

def make_database(path):
    connection = sqlite3.connect(path)
    connection.executescript('''
    CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT, status INTEGER DEFAULT 1);
    INSERT INTO categories VALUES (1, 'Fashion & Lifestyle', 1);
    CREATE TABLE users (id INTEGER PRIMARY KEY, role TEXT, status INTEGER);
    INSERT INTO users VALUES (1,'admin',1),(2,'editor',1);
    CREATE TABLE stores (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, slug TEXT UNIQUE, website_url TEXT, logo TEXT,
      category_id INTEGER, short_description TEXT, description TEXT, about_content TEXT, meta_title TEXT, meta_description TEXT,
      partner_revision INTEGER, status INTEGER DEFAULT 1, is_featured INTEGER DEFAULT 0, is_popular INTEGER DEFAULT 0);
    CREATE TABLE coupons (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, description TEXT, code TEXT, coupon_type TEXT,
      discount_type TEXT, discount_value NUMERIC, min_order_value NUMERIC, max_discount NUMERIC, affiliate_link TEXT,
      terms_conditions TEXT, start_date TEXT, expiry_date TEXT, store_id INTEGER REFERENCES stores(id), category_id INTEGER,
      is_verified INTEGER, is_featured INTEGER, status INTEGER, source_url TEXT, checked_at TEXT, verification_method TEXT,
      click_count INTEGER DEFAULT 0);
    ''')
    sql = (ROOT / 'database/add_partners.sql').read_text(encoding='utf-8')
    sql = re.sub(r'--[^\n]*', '', sql)
    sql = re.sub(r'id INT UNSIGNED NOT NULL AUTO_INCREMENT', 'id INTEGER PRIMARY KEY AUTOINCREMENT', sql)
    sql = re.sub(r'PRIMARY KEY \(id\),?', '', sql)
    sql = re.sub(r'UNIQUE KEY \w+\s*\(([^)]+)\)', r'UNIQUE (\1)', sql)
    sql = re.sub(r'KEY \w+\s*\([^)]+\),?', '', sql)
    sql = sql.replace('ENGINE=InnoDB DEFAULT CHARSET=utf8mb4', '').replace('INT UNSIGNED', 'INTEGER')
    sql = re.sub(r',\s*\)', ')', sql)
    connection.executescript(sql)
    connection.close()

class Browser:
    def __init__(self, base, origin):
        self.base, self.origin = base, origin
        self.cookies = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))
        self.csrf = ''
    def request(self, action, body=None, csrf=None, origin=None):
        headers = {'Origin': origin or self.origin}
        if body is not None: headers.update({'Content-Type': 'application/json', 'X-Partner-CSRF': self.csrf if csrf is None else csrf})
        request = urllib.request.Request(self.base + '/api/partners.php?action=' + action,
            data=json.dumps(body).encode() if body is not None else None, headers=headers)
        try:
            response = self.opener.open(request, timeout=10)
        except urllib.error.HTTPError as error:
            response = error
        result = json.loads(response.read())
        if result.get('data') and result['data'].get('csrf'): self.csrf = result['data']['csrf']
        return response.status, result
    def dashboard(self):
        status, result = self.request('dashboard')
        assert status == 200, result
        return result['data']

class PartnerIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.directory = tempfile.TemporaryDirectory(prefix='couponpush-partners-')
        cls.path = Path(cls.directory.name)
        cls.database = cls.path / 'test.sqlite'
        cls.inbox = cls.path / 'private-inbox'
        make_database(cls.database)
        with contextlib.closing(socket.socket()) as sock:
            sock.bind(('127.0.0.1', 0)); cls.port = sock.getsockname()[1]
        cls.base = f'http://127.0.0.1:{cls.port}'
        cls.origin = 'http://127.0.0.1:3101'
        cls.env = dict(os.environ, PARTNER_DSN='sqlite:' + str(cls.database), PARTNER_ALLOWED_ORIGINS=cls.origin,
            PARTNER_MAIL_TRANSPORT='file', PARTNER_MAIL_DIRECTORY=str(cls.inbox), PARTNER_SITE_URL='https://couponpush.com', PARTNERS_ENABLED='1')
        cls.log = (cls.path / 'php.log').open('w')
        cls.server = subprocess.Popen([PHP, '-S', f'127.0.0.1:{cls.port}', '-t', str(ROOT)], env=cls.env,
            stdout=cls.log, stderr=cls.log, creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        for _ in range(50):
            try:
                urllib.request.urlopen(cls.base + '/api/partners.php', timeout=1); break
            except (urllib.error.URLError, TimeoutError): time.sleep(.1)
        cls.owner = Browser(cls.base, cls.origin)
        cls.owner.request('session')
        status, result = cls.owner.request('register', {'name': 'Sutra owner', 'email': 'owner@example.com', 'password': 'long test password one', 'accept_terms': True})
        assert status == 200, result
        cls.account_id = result['data']['account']['id']
        cls.other = Browser(cls.base, cls.origin); cls.other.request('session')
        status, result = cls.other.request('register', {'name': 'Other owner', 'email': 'other@example.com', 'password': 'another test password', 'accept_terms': True})
        assert status == 200, result
        cls.brand = {'name': 'Sutra Studio', 'website_url': 'https://sutra.example.com', 'category_id': 1,
            'short_description': 'Everyday clothing and thoughtfully made home essentials.',
            'description': 'Sutra Studio offers everyday clothing and thoughtfully made home essentials for shoppers in India. Browse the official range and check each promotion’s conditions before ordering.',
            'relationship': 'owner', 'authorization': 'I own Sutra Studio. The business email on the official website can confirm my authorization.', 'authority_confirmed': True, 'logo': ''}
        cls.offer = {'title': 'Save 15% on your first Sutra order', 'description': 'New customers receive 15% off eligible clothing on their first order.',
            'code': 'WELCOME15', 'coupon_type': 'code', 'discount_type': 'percentage', 'discount_value': 15, 'min_order_value': 999,
            'max_discount': 500, 'affiliate_link': 'https://sutra.example.com/offers', 'terms_conditions': 'New customers only. Minimum spend INR 999. Maximum saving INR 500. Excludes sale items.', 'start_date': '', 'expiry_date': '2099-12-31'}
    @classmethod
    def tearDownClass(cls):
        cls.server.terminate(); cls.server.wait(timeout=10); cls.log.close(); cls.directory.cleanup()
    def service(self, php):
        file = self.path / 'operation.php'
        file.write_text('<?php require ' + json.dumps(str(ROOT / 'includes/partners.php').replace('\\', '/')) + '; $s = new PartnerService(partnerConnection()); ' + php, encoding='utf-8')
        result = subprocess.run([PHP, str(file)], env=self.env, capture_output=True, text=True, timeout=20)
        self.assertEqual(result.returncode, 0, result.stderr)
        return result.stdout
    def action(self, action, **body):
        status, result = self.owner.request(action, body)
        self.assertEqual(status, 200, result)
        return result
    def token(self, recipient, kind):
        messages = [json.loads(file.read_text()) for file in self.inbox.glob('*.json')]
        messages = [row for row in messages if row['recipient'] == recipient and f'action={kind}&token=' in row['body']]
        return re.search(r'token=([a-f0-9]{64})', max(messages, key=lambda row: int(row['id']))['body']).group(1)
    def test_01_session_cors_csrf_and_account_separation(self):
        status, result = self.owner.request('session')
        self.assertEqual(status, 200); self.assertNotIn('password_hash', result['data']['account'])
        self.assertTrue(all(cookie.name == 'couponpush_partner' for cookie in self.owner.cookies))
        self.assertEqual(self.owner.request('save_store', {'store': self.brand, 'revision': 1}, csrf='wrong')[0], 403)
        self.assertEqual(self.owner.request('session', origin='https://untrusted.example.com')[0], 403)
        self.assertEqual(self.other.dashboard()['listing']['payload'], {})
    def test_02_verification_and_saved_drafts(self):
        revision = self.owner.dashboard()['listing']['revision']
        self.action('save_store', revision=revision, store=self.brand)
        revision = self.owner.dashboard()['listing']['revision']
        self.action('save_offer', revision=revision, offer=self.offer)
        revision = self.owner.dashboard()['listing']['revision']
        self.assertEqual(self.owner.request('submit', {'revision': revision})[0], 403)
        token = self.token('owner@example.com', 'verify')
        self.action('verify', token=token)
        self.assertEqual(self.owner.request('verify', {'token': token})[0], 410)
        self.assertTrue(self.owner.request('session')[1]['data']['account']['verified_at'])
        self.assertEqual(self.service("echo $s->one('SELECT COUNT(*) AS n FROM stores')['n'];"), '0')
    def test_03_ownership_and_stale_versions(self):
        state = self.owner.dashboard(); offer_id = state['offers'][0]['id']
        self.assertEqual(self.other.request('save_offer', {'revision': 1, 'id': offer_id, 'offer': self.offer})[0], 404)
        self.assertEqual(self.owner.request('save_store', {'revision': 1, 'store': self.brand})[0], 409)
        self.assertEqual(self.owner.request('save_offer', {'revision': state['listing']['revision'], 'offer': dict(self.offer, affiliate_link='https://127.0.0.1/private')})[0], 422)
        self.assertEqual(self.owner.request('save_offer', {'revision': state['listing']['revision'], 'offer': dict(self.offer, expiry_date='2026-02-30')})[0], 422)
    def test_04_submit_changes_requested_and_resubmit(self):
        state = self.owner.dashboard(); self.action('submit', revision=state['listing']['revision'])
        state = self.owner.dashboard(); self.assertEqual(state['listing']['status'], 'pending_review')
        self.assertEqual(self.owner.request('save_store', {'revision': state['listing']['revision'], 'store': self.brand})[0], 409)
        listing_id, revision = state['listing']['id'], state['listing']['revision']
        self.assertEqual(self.service(f"try {{ $s->review({listing_id},{revision},'approve','',[],[],'sutra-studio',2,true); }} catch (PartnerError $e) {{ echo $e->status; }}"), '403')
        self.service(f"$s->review({listing_id},{revision},'changes_requested','Please clarify the exclusions for this offer.',[],[],'',1);")
        state = self.owner.dashboard(); self.assertEqual(state['listing']['status'], 'changes_requested')
        self.action('save_offer', revision=state['listing']['revision'], id=state['offers'][0]['id'], offer=self.offer)
        state = self.owner.dashboard(); self.action('submit', revision=state['listing']['revision'])
    def test_05_transactional_approval_and_retry(self):
        state = self.owner.dashboard(); listing_id, revision = state['listing']['id'], state['listing']['revision']; offer_id = state['offers'][0]['id']
        self.assertEqual(self.service(f"try {{ $s->review({listing_id},{revision},'approve','',[],[],'sutra-studio',1,true); }} catch (PartnerError $e) {{ echo $e->status; }}"), '422')
        self.assertEqual(self.service("echo $s->one('SELECT COUNT(*) AS n FROM stores')['n'];"), '0')
        self.assertEqual(self.service(f"try {{ $s->review({listing_id},{revision},'approve','', [{offer_id}],[],'cetaphil',1,true); }} catch (PartnerError $e) {{ echo $e->status; }}"), '422')
        self.assertEqual(self.service("echo $s->one('SELECT COUNT(*) AS n FROM stores')['n'];"), '0')
        self.service(f"$s->review({listing_id},{revision},'approve','Authorization and offer conditions reviewed.',[{offer_id}],[],'sutra-studio',1,true);")
        state = self.owner.dashboard(); self.assertEqual(state['listing']['status'], 'approved'); self.assertEqual(state['publication']['status'], 'queued')
        self.assertEqual(self.service(f"try {{ $s->review({listing_id},{revision},'approve','', [{offer_id}],[],'sutra-studio',1,true); }} catch (PartnerError $e) {{ echo $e->status; }}"), '409')
        published = json.loads(self.service("echo json_encode($s->one('SELECT * FROM coupons'));"))
        self.assertEqual(published['is_verified'], 0); self.assertEqual(published['verification_method'], 'merchant_advertised')
        self.assertEqual(self.service("echo $s->one('SELECT COUNT(*) AS n FROM coupons')['n'];"), '1')
    def test_06_proposed_edits_do_not_change_public_offers(self):
        state = self.owner.dashboard(); offer_id = state['offers'][0]['id']
        self.action('save_offer', revision=state['listing']['revision'], id=offer_id, offer=dict(self.offer, title='An updated proposed promotion'))
        self.assertEqual(self.service("echo $s->one('SELECT title FROM coupons')['title'];"), self.offer['title'])
        state = self.owner.dashboard(); self.action('submit', revision=state['listing']['revision'])
        state = self.owner.dashboard(); self.action('withdraw', revision=state['listing']['revision'])
        self.assertEqual(self.owner.dashboard()['listing']['status'], 'draft')
    def test_07_anonymous_views_are_deduplicated(self):
        coupon_id = self.owner.dashboard()['offers'][0]['coupon_id']
        for _ in range(2):
            request = urllib.request.Request(self.base + '/api/partner-metrics.php', data=json.dumps({'type': 'offer', 'id': coupon_id, 'visitor': 'abcdabcdabcdabcdabcdabcdabcdabcd'}).encode(), headers={'Content-Type': 'application/json'})
            self.assertEqual(urllib.request.urlopen(request).status, 202)
        self.assertEqual(self.owner.dashboard()['metrics']['offer_views'], 1)
    def test_08_withdraw_offer_and_queue_website_removal(self):
        state = self.owner.dashboard(); self.action('withdraw', revision=state['listing']['revision'], id=state['offers'][0]['id'])
        state = self.owner.dashboard(); self.assertEqual(state['offers'][0]['status'], 'withdrawn')
        self.assertEqual(self.service("echo $s->one('SELECT status FROM coupons')['status'];"), '0')
        self.assertEqual(state['publication']['status'], 'queued')
        self.assertEqual(self.owner.request('submit', {'revision': state['listing']['revision']})[0], 422)
    def test_09_password_reset_revokes_existing_sessions(self):
        self.action('forgot', email='owner@example.com')
        token = self.token('owner@example.com', 'reset')
        self.action('reset', token=token, password='replacement test password')
        self.assertIsNone(self.owner.request('session')[1]['data']['account'])
        self.assertEqual(self.owner.request('login', {'email': 'owner@example.com', 'password': 'long test password one'})[0], 401)
        self.action('login', email='owner@example.com', password='replacement test password')
        self.assertEqual(self.owner.request('reset', {'token': token, 'password': 'another safe password'})[0], 410)
    def test_10_no_private_drafts_or_tokens_in_public_catalog(self):
        self.assertEqual(self.service("echo $s->one('SELECT COUNT(*) AS n FROM stores')['n'];"), '1')
        state = self.other.dashboard(); self.assertEqual(state['offers'], []); self.assertIsNone(state['listing']['public_url'])
        hashes = self.service("echo json_encode($s->all('SELECT token_hash FROM partner_tokens'));")
        self.assertNotIn(self.token('owner@example.com','reset'), hashes)
        self.assertEqual(self.service("echo $s->one(\"SELECT COUNT(*) AS n FROM partner_mail WHERE status = 'sent' AND body <> ''\")['n'];"), '0')
    def test_11_partial_offer_drafts_cannot_be_submitted(self):
        state = self.owner.dashboard()
        draft = dict(self.offer, title='A saved unfinished offer', description='', code='', affiliate_link='', terms_conditions='')
        self.action('save_offer', revision=state['listing']['revision'], offer=draft)
        state = self.owner.dashboard(); self.assertEqual(state['offers'][0]['payload']['title'], draft['title'])
        status, result = self.owner.request('submit', {'revision': state['listing']['revision']})
        self.assertEqual(status, 422); self.assertEqual(result['fields']['_form'], 'offer')
        self.assertEqual(self.service("echo $s->one('SELECT COUNT(*) AS n FROM coupons')['n'];"), '1')
    def test_12_expired_email_links_and_resend_cooldown(self):
        self.assertEqual(self.other.request('resend', {})[0], 429)
        other_id = self.other.request('session')[1]['data']['account']['id']
        token = self.token('other@example.com', 'verify')
        self.service(f"$s->run(\"UPDATE partner_tokens SET expires_at = '2000-01-01 00:00:00' WHERE account_id = ?\",[{other_id}]);")
        self.assertEqual(self.other.request('verify', {'token': token})[0], 410)
        self.assertIsNone(self.other.request('session')[1]['data']['account']['verified_at'])

if __name__ == '__main__': unittest.main(verbosity=2)
