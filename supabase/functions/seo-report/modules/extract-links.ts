export function extractLinks(baseUrl: string, html: string) {
  const hrefs: string[] = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    try {
      const url = new URL(m[1], baseUrl).toString();
      hrefs.push(url);
    } catch (_) {
      // ignore
    }
  }
  // dedupe
  return Array.from(new Set(hrefs)).slice(0, 200);
}
