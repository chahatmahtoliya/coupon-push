"""Exercise admin logo updates with real PHP uploads and an isolated SQLite DB.

Run: py api/tests/store-logo-integration.py
Set PHP_BIN if PHP is not on PATH or installed at C:/xampp/php/php.exe.
"""
import base64
from contextlib import closing
import http.client
import json
import os
from pathlib import Path
import shutil
import socket
import sqlite3
import subprocess
import tempfile
import time
import uuid


ROOT = Path(__file__).resolve().parents[2]
PHP = os.environ.get("PHP_BIN") or shutil.which("php") or "C:/xampp/php/php.exe"
PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=")


def main():
    with tempfile.TemporaryDirectory(prefix="couponpush-logo-") as temporary:
        app = Path(temporary)
        files = ["admin/stores.php", "includes/functions.php", "api/config.php"]
        files += [name for name in ["admin/includes/festival-store-form.php", "includes/festival-store-fields.php"]
                  if (ROOT / name).is_file()]
        for filename in files:
            target = app / filename
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / filename, target)
        (app / "config").mkdir()
        (app / "uploads/stores").mkdir(parents=True)
        (app / "uploads/stores/old.png").write_bytes(PNG)
        (app / "config/constants.php").write_text("""<?php
const SITE_URL = 'https://couponpush.com';
const ASSETS_URL = SITE_URL . '/assets/';
const ROOT_PATH = __DIR__ . '/../';
const STORE_LOGOS_PATH = ROOT_PATH . 'uploads/stores/';
const MAX_UPLOAD_SIZE = 5242880;
const ALLOWED_IMAGE_TYPES = ['image/jpeg','image/png','image/gif','image/webp'];
const CSRF_TOKEN_NAME = 'csrf_token';
session_start();
$_SESSION['csrf_token'] = 'test-token';
class TestDatabase {
    private $pdo;
    function __construct() { $this->pdo = new PDO('sqlite:' . ROOT_PATH . 'catalog.sqlite'); $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); }
    function query($sql, $params = []) { $stmt = $this->pdo->prepare($sql); $stmt->execute($params); return $stmt; }
    function fetchAll($sql, $params = []) { return $this->query($sql, $params)->fetchAll(); }
    function fetch($sql, $params = []) { return $this->query($sql, $params)->fetch(); }
    function update($sql, $params = []) { if (isset($_GET['faildb'])) return false; return $this->query($sql, $params)->rowCount(); }
    function insert($sql, $params = []) { $this->query($sql, $params); return $this->pdo->lastInsertId(); }
}
function db() { static $db; return $db ?? ($db = new TestDatabase); }
""", encoding="utf-8")
        (app / "admin/includes").mkdir(parents=True, exist_ok=True)
        (app / "admin/includes/admin-header.php").write_text("<?php ob_start(); require_once dirname(__DIR__, 2) . '/includes/functions.php';", encoding="utf-8")
        (app / "admin/includes/admin-footer.php").write_text("", encoding="utf-8")
        (app / "resolve.php").write_text("<?php require __DIR__ . '/api/config.php'; echo json_encode(['admin'=>getStoreLogo($_GET['logo'] ?? ''), 'api'=>getStoreLogoUrl($_GET['logo'] ?? '')]);", encoding="utf-8")
        fields = ["name", "slug", "logo", "h1_suffix", "website_url", "affiliate_url", "short_description",
                  "description", "about_content", "howto_content", "terms_content", "category_id", "meta_title",
                  "meta_description", "rating", "is_featured", "is_popular", "status", "page_template", "banner_image",
                  "campaign_start_date", "merchant_name", "campaign_bank_offer", "campaign_member_offer", "campaign_source_url"]
        with closing(sqlite3.connect(app / "catalog.sqlite")) as db:
            db.execute("CREATE TABLE stores (id INTEGER PRIMARY KEY, " + ", ".join(f"{field} TEXT" for field in fields) + ")")
            db.execute("CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT, status INTEGER)")
            db.execute("INSERT INTO stores (id, name, slug, logo, rating, status, page_template) VALUES (1, 'Original', 'original', 'old.png', '4', '1', 'standard')")
            db.commit()

        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]

        def request(path, fields=None, upload=None):
            body = None
            headers = {}
            if fields is not None:
                boundary = uuid.uuid4().hex
                chunks = []
                for key, value in fields.items():
                    chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
                if upload:
                    name, content = upload
                    chunks.extend([f'--{boundary}\r\nContent-Disposition: form-data; name="logo"; filename="{name}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode(), content, b"\r\n"])
                chunks.append(f"--{boundary}--\r\n".encode())
                body = b"".join(chunks)
                headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
            conn = http.client.HTTPConnection("127.0.0.1", port, timeout=15)
            conn.request("POST" if fields is not None else "GET", path, body, headers)
            response = conn.getresponse()
            result = response.status, dict(response.getheaders()), response.read().decode()
            conn.close()
            return result

        def stored():
            with closing(sqlite3.connect(app / "catalog.sqlite")) as db:
                return db.execute("SELECT name, logo FROM stores WHERE id=1").fetchone()

        values = {"csrf_token": "test-token", "name": "Updated", "status": "1", "rating": "4", "page_template": "standard"}
        edit = "/admin/stores.php?action=edit&id=1"
        with (app / "server.log").open("w") as log:
            server = subprocess.Popen([PHP, "-d", "upload_max_filesize=8M", "-d", "post_max_size=12M", "-S", f"127.0.0.1:{port}", "-t", str(app)], stdout=log, stderr=log)
            try:
                for _ in range(100):
                    try:
                        request("/resolve.php")
                        break
                    except OSError:
                        time.sleep(.05)
                else:
                    raise RuntimeError("PHP server did not start")

                status, _, _ = request(edit, values, ("misnamed.svg", PNG))
                name, logo = stored()
                assert status == 302 and name == "Updated" and logo.endswith(".png"), (status, name, logo)
                assert (app / "uploads/stores" / logo).read_bytes() == PNG
                resolved = json.loads(request("/resolve.php?logo=" + logo)[2])
                assert resolved["api"] == resolved["admin"] == "https://api.couponpush.com/uploads/stores/" + logo
                print("PASS: real upload updates the row, saves a content-derived extension and resolves on the backend")

                values["name"] = "No replacement"
                assert request(edit, values)[0] == 302 and stored() == ("No replacement", logo)
                print("PASS: saving without a replacement preserves the current logo")

                for filename, content, message in [
                    ("invalid.png", b"not an image", "Upload a JPG, PNG, GIF or WebP image."),
                    ("large.png", PNG + b"x" * (5 * 1024 * 1024), "File size exceeds limit"),
                    ("server-limit.png", PNG + b"x" * (9 * 1024 * 1024), "server upload limit"),
                ]:
                    values["name"] = "Unsaved input"
                    status, _, html = request(edit, values, (filename, content))
                    assert status == 200 and message in html and 'value="Unsaved input"' in html
                    assert stored() == ("No replacement", logo)
                print("PASS: invalid images and application/server size limits show errors without changing the store")

                before = set((app / "uploads/stores").iterdir())
                status, _, html = request(edit + "&faildb=1", values, ("valid.png", PNG))
                assert status == 200 and "Failed to update store." in html
                assert set((app / "uploads/stores").iterdir()) == before and stored()[1] == logo
                print("PASS: database failure removes the unreferenced new upload and preserves the existing logo")

                (app / "uploads/stores").rename(app / "uploads/saved-stores")
                (app / "uploads/stores").write_text("blocked")
                status, _, html = request(edit, values, ("valid.png", PNG))
                assert status == 200 and "Cannot create the image directory." in html and stored()[1] == logo
                (app / "uploads/stores").unlink()
                (app / "uploads/saved-stores").rename(app / "uploads/stores")
                print("PASS: upload directory failures are visible and leave the stored logo unchanged")

                for value, expected in [
                    ("/uploads/stores/" + logo, "https://api.couponpush.com/uploads/stores/" + logo),
                    ("https://media.couponpush.com/uploads/stores/" + logo, "https://api.couponpush.com/uploads/stores/" + logo),
                    ("legacy.png", "https://media.couponpush.com/uploads/stores/legacy.png"),
                    ("https://brand.example/logo.png", "https://brand.example/logo.png"),
                    ("/uploads/partners/brand.png", "https://api.couponpush.com/uploads/partners/brand.png"),
                ]:
                    from urllib.parse import quote
                    resolved = json.loads(request("/resolve.php?logo=" + quote(value, safe=""))[2])
                    assert resolved["api"] == resolved["admin"] == expected, (value, resolved)
                print("PASS: legacy media, absolute/relative paths and external/partner logos resolve correctly")

                values["name"] = "New store"
                assert request("/admin/stores.php?action=add", values, ("logo.png", PNG))[0] == 302
                with closing(sqlite3.connect(app / "catalog.sqlite")) as db:
                    assert db.execute("SELECT logo FROM stores WHERE name='New store'").fetchone()[0].endswith(".png")
                print("PASS: new stores can upload logos")

                status, headers, _ = request(edit, values, ("too-large.png", b"x" * (13 * 1024 * 1024)))
                assert status == 302 and "action=edit&id=1" in headers["Location"] and stored()[1] == logo
                print("PASS: requests exceeding post_max_size return safely to the edit form")
            finally:
                server.terminate()
                server.wait(timeout=10)


if __name__ == "__main__":
    main()
