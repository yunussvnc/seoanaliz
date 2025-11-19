export function extractText(html: string): string {
  // remove scripts/styles
  let t = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  t = t.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  // replace tags with spaces
  t = t.replace(/<[^>]+>/g, ' ');
  // decode common HTML entities (basic)
  t = t.replace(/&nbsp;|&#160;/g, ' ');
  t = t.replace(/&amp;/g, '&');
  t = t.replace(/&lt;/g, '<');
  t = t.replace(/&gt;/g, '>');
  t = t.replace(/&quot;/g, '"');
  t = t.replace(/&apos;/g, "'");
  // collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}
