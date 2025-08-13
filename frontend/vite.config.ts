import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    },
    hmr: {
      // Reduce HMR frequency to prevent excessive updates
      overlay: false
    }
  },
  assetsInclude: ['**/*.svg'],
  build: {
    // Optimize build performance
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          charts: ['recharts'],
          utils: ['axios', 'jwt-decode']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev startup
    include: ['react', 'react-dom', 'react-router-dom', 'axios', '@headlessui/react']
  },
  esbuild: {
    // Remove console.log in production
    drop: ['debugger']
  }
})
