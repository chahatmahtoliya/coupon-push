"""Read-only HTTP checks. These requests do not establish Googlebot access."""
import concurrent.futures
import datetime
import json
from pathlib import Path
import urllib.request
import urllib.error

URLS = ['http://couponpush.com/', 'https://www.couponpush.com/', 'https://couponpush.com/',
        'https://couponpush.com/robots.txt', 'https://couponpush.com/sitemap.xml',
        'https://couponpush.com/store/cetaphil/', 'https://couponpush.com/store/cetaphil-coupon-code/',
        'https://couponpush.com/store/seo-audit-nonexistent-store/']

def inspect(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'CouponPush-SEO-Audit/1.0'}), timeout=15) as response:
            result = {'url': url, 'status': response.status, 'final_url': response.url, 'server': response.headers.get('server')}
            if url.endswith('robots.txt'):
                body = response.read().decode('utf-8', errors='replace')
                result['sitemap_declared'] = 'Sitemap: https://couponpush.com/sitemap.xml' in body
            return result
    except urllib.error.HTTPError as error:
        return {'url': url, 'status': error.code, 'final_url': error.url, 'server': error.headers.get('server')}
    except Exception as error:
        return {'url': url, 'error': str(error)}

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(inspect, URLS))
    report = {'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'scope': 'Ordinary audit HTTP client, not verified Googlebot', 'results': results}
    output = Path(__file__).resolve().parents[2] / 'output/seo/live-http-check.json'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2), encoding='utf-8')
    for result in results: print(result)
