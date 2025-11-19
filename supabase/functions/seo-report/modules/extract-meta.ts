export function extractMeta(html: string) {
  const meta: Record<string, any> = {
    title: null,
    description: null,
    canonical: null,
    robots: null,
    charset: null,
    viewport: null,
    open_graph: {}
  };

  // title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1].trim();

  // meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  if (descMatch) meta.description = descMatch[1].trim();

  // canonical
  const canon = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i);
  if (canon) meta.canonical = canon[1].trim();

  // robots
  const robots = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (robots) meta.robots = robots[1].trim();

  // charset
  const charset = html.match(/<meta[^>]+charset=["']?([^"'>\s]+)["']?[^>]*>/i);
  if (charset) meta.charset = charset[1].trim();

  // viewport
  const viewport = html.match(/<meta[^>]+name=["']viewport["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (viewport) meta.viewport = viewport[1].trim();

  // open graph
  const ogMatches = html.match(/<meta[^>]+property=["']og:([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi) || [];
  ogMatches.forEach(m => {
    const parts = m.match(/property=["']og:([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    if (parts) meta.open_graph[parts[1]] = parts[2];
  });

  return meta;
}
