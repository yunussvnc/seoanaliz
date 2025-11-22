// seo-report function has been disabled per user request.
// Reporting modules have been neutralized; this endpoint intentionally returns 410 Gone.

addEventListener('fetch', (event: any) => {
  event.respondWith(new Response(JSON.stringify({ success: false, error: 'SEO report endpoints disabled' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
});
