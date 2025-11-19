export function analyzePerformance(html: string) {
  // naive static analysis based on tags
  const jsFiles = (html.match(/<script[^>]+src=["'][^"']+["'][^>]*>/gi) || []).length;
  const cssFiles = (html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi) || []).length;
  const inlineStyles = (html.match(/style=["'][\s\S]*?["']/gi) || []).length;
  const htmlSize = new TextEncoder().encode(html).length;


  return {
    html_size_bytes: htmlSize,
    js_files: jsFiles,
    css_files: cssFiles,
    inline_styles_count: inlineStyles,
    performance_score_est: Math.max(0, 100 - Math.floor(htmlSize / 10000) - jsFiles * 2)
  };
}
