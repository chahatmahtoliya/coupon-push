import requests, json, concurrent.futures
from bs4 import BeautifulSoup
from pathlib import Path
base='https://couponpush.com'
paths=['/','/robots.txt','/sitemap.xml','/stores/','/store/foxtale/','/store/snitch/','/store/the-derma-co/','/store/derma-co-coupon-code/','/store/dot-key/','/store/dot-key-coupon-codes/','/store/blinkit/','/store/deconstruct/','/store/hyphen/','/store/minimalist/','/coupons/?store=amazon','/about/','/privacy/','/blog/']
def check(path):
 try:
  r=requests.get(base+path,timeout=30)
  s=BeautifulSoup(r.text,'html.parser')
  def meta(name):
   e=s.find('meta',attrs={'name':name}); return e.get('content') if e else None
  c=s.find('link',rel='canonical')
  result=dict(path=path,status=r.status_code,url=r.url,title=s.title.get_text() if s.title else None,robots=meta('robots'),description=meta('description'),canonical=c.get('href') if c else None,h1=[x.get_text(' ',strip=True) for x in s.find_all('h1')],schema=[x.get_text() for x in s.select('script[type="application/ld+json"]')],links=sorted(set(a.get('href') for a in s.select('a[href]'))),xrobots=r.headers.get('X-Robots-Tag'))
  for x in s(['script','style','nav','footer','header']): x.decompose()
  result['text']=s.get_text(' ',strip=True)[:22000]
  return result
 except Exception as e:return dict(path=path,error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: rows=list(pool.map(check,paths))
Path('output/seo/live-audit-2026-09-12.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
for r in rows: print(json.dumps({k:v for k,v in r.items() if k not in ['text','links','schema']},ensure_ascii=True))
for r in rows:
 if r['path'] in ['/robots.txt','/sitemap.xml']:print(r['path'],r.get('text'))
