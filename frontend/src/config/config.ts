// Configuration utility for API URLs
const config = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  API_TIMEOUT: 10000,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;
