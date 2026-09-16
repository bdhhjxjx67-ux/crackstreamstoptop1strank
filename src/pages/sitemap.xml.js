import { fetchMatches } from '../utils/api.js';

export async function GET({ request }) {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.host;
  const proto = request.headers.get('x-forwarded-proto') || (url.protocol ? url.protocol.replace(':', '') : 'https');
  const siteUrl = `${proto}://${host}`;

  const matches = await fetchMatches();
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: `${siteUrl}/`, priority: '1.0', changefreq: 'hourly' },
    { loc: `${siteUrl}/dmca`, priority: '0.4', changefreq: 'monthly' },
    { loc: `${siteUrl}/privacy`, priority: '0.4', changefreq: 'monthly' },
    { loc: `${siteUrl}/contact`, priority: '0.4', changefreq: 'monthly' }
  ];

  const matchPages = matches.map(m => ({
    loc: `${siteUrl}${m.url}`,
    priority: '0.8',
    changefreq: 'hourly'
  }));

  const playPages = matches.map(m => ({
    loc: `${siteUrl}/play/${m.id}`,
    priority: '0.9',
    changefreq: 'hourly'
  }));

  const allUrls = [...staticPages, ...matchPages, ...playPages];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    item => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}