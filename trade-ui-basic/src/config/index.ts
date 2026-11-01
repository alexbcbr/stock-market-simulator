// Configuration using Vite's built-in environment variables
// These are automatically loaded from .env file at build time
export const config = {
  LAYOUT: import.meta.env.VITE_LAYOUT,
  URL_SERVICES: import.meta.env.VITE_URL_SERVICES,
};
