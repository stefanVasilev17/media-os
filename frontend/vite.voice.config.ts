import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist-voice',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(process.cwd(), 'voice.html')
    }
  }
});
