// Empty by default: API calls go to the current origin and are proxied to the
// backend by the Next.js rewrite in next.config.ts. This keeps requests
// same-origin, so everything works on localhost, ngrok, and port forwarding
// without CORS or mixed-content (https page calling http://localhost) issues.
// Only set NEXT_PUBLIC_API_URL if the browser must call the backend directly.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""