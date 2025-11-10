import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allow Vite to prebundle lucide-react for faster dev cold starts
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/n8n/ai-summary': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/n8n\/ai-summary/, '/webhook/ai-summary'),
      },
    },
  },
});
