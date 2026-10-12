# Google SEO setup for Inversan

## Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console/).
2. Add the Domain property `grupoinversan.com`.
3. Verify domain ownership with the DNS TXT record Google provides. Keep the
   verification value in the DNS provider; do not commit it to the repository.
4. If HTML-tag verification is needed instead, set
   `GOOGLE_SITE_VERIFICATION` in the frontend SSR runtime environment and
   restart the service. The server omits the tag when the value is empty.
5. Submit `https://grupoinversan.com/sitemap.xml`.
6. Inspect representative canonical URLs for a product, a real tire size, and
   a vehicle with real catalog associations. Request indexing for a small
   number of important pages after confirming their rendered HTML.
7. Review impressions, clicks, click-through rate, queries, and average
   position in Search Console after Google has recrawled the site.

## Public SEO documents

- `/sitemap.xml` contains the home page, active public products, measures with
  active products, and vehicles/versions with explicit active
  `Modelo_Producto` relations. It excludes filters, private routes, legacy
  product URLs, and brand pages until those pages have dedicated canonical SEO.
- Sitemap entries omit `lastmod` because the product schema has no reliable
  public update timestamp. The sitemap and merchant feed use a five-minute
  cache; individual measure and vehicle SSR/API results use a shorter cache.
- `/robots.txt` links to the sitemap and disallows private application paths.
  Robots rules are not a substitute for page-level `noindex`; private and
  filter-driven routes also emit `noindex,nofollow`.
- `/google-merchant.xml` is a public RSS 2.0 feed. It uses the public displayed
  price, general stock, canonical product URL, and requires a valid absolute
  HTTPS image URL. Products with missing images or prices less than or equal to
  zero are excluded from the Merchant feed only; they can still exist in organic
  search and the sitemap when otherwise valid. It does not invent GTIN, MPN, or
  product condition. If manufacturers provide real GTIN/MPN values later, store
  them explicitly before adding those fields to structured data or the feed.

## Local validation

From PowerShell, use `curl.exe` (rather than the PowerShell `curl` alias):

```powershell
curl.exe -I http://localhost:5000/robots.txt
curl.exe http://localhost:5000/robots.txt
curl.exe -I http://localhost:5000/sitemap.xml
curl.exe http://localhost:5000/sitemap.xml
curl.exe -s http://localhost:5000/llantas/205-55-r16
curl.exe -s http://localhost:5000/google-merchant.xml
```

The `Content-Type` should be `text/plain` for `robots.txt`, `application/xml`
for sitemap/feed documents, and `text/html` for rendered pages. A measure URL
is valid only when the public catalog contains that exact measure. Vehicle
pages likewise require explicit public product associations.

## Structured data and local listings

The server emits Organization structured data using the public Inversan name,
canonical site URL, and existing public logo. It does not add unverified
social-profile URLs. Home and Contact pages include `TireShop` entries only
for active branches with a configured address; municipality, department, and
valid coordinates are included only when available. Internal attendance/GPS
settings, RTN, phone numbers, and hours are not used.

Product, measure, and vehicle pages include visible breadcrumbs and matching
`BreadcrumbList` structured data. Product availability and price use the same
public, general-stock semantics as the page and merchant feed.

## Image and performance notes

The product detail's first gallery image is eager-loaded with high fetch
priority. Gallery thumbnails, related products, and listing images are lazy
loaded. Image containers already reserve aspect-ratio space to limit layout
shift. No synthetic `srcset` URLs or destructive image conversions are
introduced: the current catalog does not expose generated responsive image
variants or a WebP/AVIF transformation pipeline. Add those only with a real
backend image-variant pipeline and source files.

Administrative routes remain lazy-loaded; no administrative, biometric, or
face-processing code is imported by the SEO landing pages.
