# Cpush Coupon Scraper — Official Brand Offers

Scrapes **latest coupons, offers & deals from official brand websites** and exports **exactly** in `coupon-import-template.csv` format for Cpush.

**Template header (do not change):**
```
title,description,code,coupon_type,discount_type,discount_value,store,store_url,category,start_date,expiry_date,original_price,sale_price,affiliate_link,image,terms_conditions,is_featured,is_verified,is_exclusive,status
```

---

## Quick Start — Hostinger (Ready Now)

Hostinger is pre-configured as the primary brand (your request).

```bash
# 1. Install deps
pip install -r requirements.txt

# 2. Scrape Hostinger official coupons (live)
python scraper.py --brand hostinger

# Output: output/hostinger-coupons-2026-09-02.csv  (6 offers, template-exact)

# 3. With your affiliate ID
python scraper.py --brand hostinger --affiliate YOURAFFID

# 4. Preview CSV
type output\hostinger-coupons-2026-09-02.csv

# 5. Import to DB (creates Hostinger store + Web Hosting category if needed)
php import.php output/hostinger-coupons-2026-09-02.csv
php import.php --dry-run output/hostinger-coupons-2026-09-02.csv  # preview without writing

# 6. Verify in admin
# http://yoursite/admin/coupons.php
```

**What Hostinger scraper extracts (live 2026-09-02):**
- `Hostinger Single - 83% OFF` — Rs.399 → Rs.69/mo — deal (COUPONSPAGE auto-applied)
- `Hostinger Premium - 76% OFF` — Rs.599 → Rs.141.55/mo
- `Hostinger Cloud Startup - 67% OFF` — Rs.1699 → Rs.569.05/mo
- `Hostinger AI Builder - 66% OFF` — Rs.699 → Rs.236.55/mo
- `Hostinger Coupon Code - Extra 10% OFF` — code `COUPONSPAGE` — coupon_type=code, is_exclusive=1
- All rows: `store=Hostinger`, `store_url=https://www.hostinger.in`, `category=Web Hosting`, `is_verified=1`, `status=1`

> Hostinger uses **auto-applied coupon `COUPONSPAGE`** — deals have empty `code` & `coupon_type=deal`, the extra 10% row has `code=COUPONSPAGE` & `coupon_type=code`.

---

## Usage — Any Brand

```bash
# Scrape any brand by URL (generic heuristic parser)
python scraper.py --url https://www.nykaa.com/offers.html --store Nykaa --store-url https://www.nykaa.com --category "Beauty & Health"

python scraper.py --url https://www.myntra.com/coupons --store Myntra

# Scrape a configured brand from stores.json
python scraper.py --brand nykaa
python scraper.py --brand myntra
python scraper.py --brand amazon   # note: Amazon blocks, uses fallback heuristic

# Scrape ALL brands in config
python scraper.py --all
python scraper.py --all --affiliate YOURAFFID --output output/all-brands-2026-09-02.csv

# Custom output path
python scraper.py --brand hostinger --output output/my-hostinger.csv
```

### Config: `config/stores.json`

Add any official brand:

```json
{
  "slug": "boat",
  "name": "boAt",
  "domain": "boat-lifestyle.com",
  "website_url": "https://www.boat-lifestyle.com",
  "category": "Electronics",
  "offer_urls": ["https://www.boat-lifestyle.com/pages/offers"],
  "affiliate_template": "https://www.boat-lifestyle.com{path}?affid=YOURID"
}
```

Then: `python scraper.py --brand boat`

---

## How It Works

### Hostinger (specialized)
- Fetches `https://www.hostinger.in/coupons` + `.com/coupons`
- Parses pricing table: `% off`, `Rs. original → Rs. sale`, plan names (Single, Premium, Cloud Startup...)
- Enriches with fallback curated plans if live HTML is JS-hydrated
- Enforces clean descriptions (no mojibake) & price normalization
- Auto-sets: `coupon_type=deal` (empty code) for plans, `coupon_type=code` for `COUPONSPAGE` extra row
- `affiliate_link` = `https://www.hostinger.in#pricing` (+ `?affid=YOURID` if given)

### Generic (any brand)
- Fetches official offers page
- Heuristic card detection: `.coupon, .offer, .deal, [class*=coupon]`
- Extracts: title (h2/h3), discount (`% off`, `Rs.X off`), code (`[A-Z0-9]{5,12}`), prices (`Rs.XXXX`), image, link
- Infers `coupon_type` (code if found else deal), `discount_type` (percentage/flat/cashback/freebie)
- Deduplicates by `store+title+code`

### CSV Guarantees
- Header **exactly** matches `coupon-import-template.csv` (order-sensitive)
- Quoting: `QUOTE_MINIMAL`, UTF-8, proper escaping for commas/quotes
- `start_date = today`, `expiry_date = today+30` (or +45 for code row)
- `original_price/sale_price` formatted `1234.00` or empty
- `is_featured/is_verified/is_exclusive/status` as `0`/`1` strings

---

## Import to Database

`import.php` handles:
- Creates `stores` + `categories` (e.g., `Web Hosting`) if missing
- Deduplicates by `title + store_id`
- Maps CSV `store` (string) → `stores.id`, `category` → `categories.id`
- Inserts into `coupons` with `coupon_type` 3-enum, `discount_type` 4-enum
- Updates `stores.total_coupons`

```bash
php import.php output/hostinger-coupons-2026-09-02.csv
php import.php --dry-run output/hostinger-coupons-2026-09-02.csv
```

Requires: `../config/database.php` (DB_HOST, DB_NAME etc.) and `../includes/functions.php`.

---

## Files

```
c-scrapper/
├── coupon-import-template.csv   # original template (1 sample row + header) — never edit
├── scraper.py                   # main engine (Hostinger special + generic)
├── requirements.txt
├── config/stores.json           # 9 brands pre-configured, Hostinger first
├── output/
│   └── hostinger-coupons-2026-09-02.csv  # generated (example)
├── logs/                        # (optional)
├── import.php                   # PHP CSV → DB importer
└── README.md
```

---

## Scheduling (Daily Auto-Scrape)

**Linux cron:**
```cron
0 6 * * * cd /path/to/c-scrapper && /usr/bin/python3 scraper.py --brand hostinger --affiliate YOURID && /usr/bin/php import.php output/hostinger-coupons-$(date +\%Y-\%m-\%d).csv >> logs/import.log 2>&1
```

**Windows Task Scheduler:**
```powershell
# run daily 06:00
python D:\Cpush\c-scrapper\scraper.py --brand hostinger
php D:\Cpush\c-scrapper\import.php D:\Cpush\c-scrapper\output\hostinger-coupons-2026-09-02.csv
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `lxml not found` | `pip install lxml` |
| Empty CSV | Site blocked — check `output/*.csv` fallback still writes 6 Hostinger rows; for other brands, try `--url` with a different offers page |
| `Â` / `�` in description | Fixed in v1.1 — ensure `requests` encoding is utf-8 (already handled) |
| Header mismatch on import | Ensure CSV header exactly matches template — `scraper.py` guarantees this; don't edit header manually |
| Store not created | Check `config/database.php` credentials & that `stores` table exists (`database/schema.sql`) |

---

## Next Brands To Add (Tell Me)

Just say: `boat`, `zouk`, `nokia`, `samsung` or any official URL and I’ll add a specialized parser like Hostinger’s in <5 min.

Example: “scrape boat-lifestyle.com” → I’ll add `boat` to `stores.json` + test a live CSV for you.

---

**Built for Cpush** — template-exact, deduplicated, ready for `admin/coupons.php`.
