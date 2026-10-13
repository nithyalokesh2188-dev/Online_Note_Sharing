// Backend API address. Set VITE_API_URL when deploying (e.g. https://your-api.onrender.com);
// local development falls back to the Express server on port 5000.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
