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
      '/api/n8n/report-chat': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/n8n\/report-chat/, '/webhook/report-chat'),
      },
      '/api/n8n/appointment-notification': {
        // Try to extract target from env var, fallback to localhost
        target: (() => {
          const webhookUrl = process.env.VITE_N8N_APPOINTMENT_WEBHOOK;
          if (webhookUrl && webhookUrl.startsWith('http')) {
            try {
              const url = new URL(webhookUrl);
              return `${url.protocol}//${url.host}`;
            } catch {
              return 'http://localhost:5678';
            }
          }
          return 'http://localhost:5678';
        })(),
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // Extract path from env var if available
          const webhookUrl = process.env.VITE_N8N_APPOINTMENT_WEBHOOK;
          if (webhookUrl && webhookUrl.includes('/webhook/')) {
            try {
              const url = new URL(webhookUrl);
              return url.pathname;
            } catch {
              return '/webhook/appointment-notification';
            }
          }
          return '/webhook/appointment-notification';
        },
      },
    },
  },
});
