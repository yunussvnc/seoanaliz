export async function analyzeTechnical(url: string, html: string) {
  // robots.txt
  let robots = null;
  try {
    const u = new URL('/robots.txt', url).toString();
    const r = await fetch(u);
    robots = r.ok ? await r.text() : null;
  } catch (_) { robots = null; }


  // https check
  const isHttps = url.startsWith('https://');


  // security headers (we can't read response headers of remote site from server-side fetch reliably in some hosts)
  const security = {
    https: isHttps,
    x_frame_options: null,
    content_security_policy: null
  };


  // sitemap.xml check
  let sitemap = null;
  try {
    const s = new URL('/sitemap.xml', url).toString();
    const r2 = await fetch(s);
    sitemap = r2.ok ? true : false;
  } catch (_) { sitemap = null; }


  return { robots, sitemap, security };
}
