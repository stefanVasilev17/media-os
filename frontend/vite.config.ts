import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      selfDestroying: true,
      manifest: {
        name: 'Media OS',
        short_name: 'Media OS',
        display: 'standalone',
        background_color: '#070b13',
        theme_color: '#070b13',
        start_url: '/'
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
});
