// Configuration utility for API URLs
const DEFAULT_API = 'https://finvo-1vyg1q.fly.dev/api';

function normalizeApiUrl(raw?: string) {
  if (!raw) return DEFAULT_API;
  // remove trailing slashes
  const trimmed = raw.replace(/\/+$/g, '');
  // if user provided the host only (e.g. https://finvo... ), append /api
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const config = {
  // Prefer VITE_API_URL if provided; normalize it so both
  // 'https://host' and 'https://host/api' work correctly.
  API_BASE_URL: normalizeApiUrl(import.meta.env.VITE_API_URL as string | undefined),
  API_TIMEOUT: 10000,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;
