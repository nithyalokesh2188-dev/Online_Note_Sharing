// Backend API address.
// Production builds call "/api" on the same site; vercel.json proxies it to the Render backend.
// Keeping the API same-site makes the login cookie first-party, so browsers that block
// third-party cookies (Incognito, Safari, newer Chrome) still keep users signed in.
// VITE_API_URL can override this; local development falls back to the Express server on port 5000.
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:5000")
).replace(/\/+$/, "");
