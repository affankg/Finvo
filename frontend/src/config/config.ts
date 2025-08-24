// Configuration utility for API URLs
const config = {
  // Prefer VITE_API_URL if provided, otherwise default to the deployed backend on Fly
  API_BASE_URL: import.meta.env.VITE_API_URL || 'https://finvo-1vyg1q.fly.dev/api',
  API_TIMEOUT: 10000,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;
