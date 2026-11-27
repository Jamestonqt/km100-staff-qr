import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('exceljs') || id.includes('html2canvas') || id.includes('canvas-confetti')) {
            return 'vendor-export';
          }
          if (id.includes('html5-qrcode') || id.includes('qrcode.react') || id.includes('qrcode')) {
            return 'vendor-qr';
          }
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor-react';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
})
