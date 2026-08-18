const BLOCKED_FILES = new Set([
  "/README.md",
  "/WEBSITE_STANDARDS.md",
  "/AGENTS.md",
  "/package.json",
  "/package-lock.json",
  "/wrangler.jsonc"
]);

const BLOCKED_PREFIXES = [
  "/_tools/",
  "/functions/",
  "/migrations/",
  "/node_modules/",
  "/dist/",
  "/test-results/",
  "/playwright-report/"
];

export async function onRequest({ request, next }) {
  const pathname = new URL(request.url).pathname;
  const blocked =
    BLOCKED_FILES.has(pathname) ||
    BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!blocked) return next();

  return new Response("Not found.\n", {
    status: 404,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}
