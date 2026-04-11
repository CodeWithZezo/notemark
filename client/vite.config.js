import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // No proxy needed — the client talks directly to Supabase
  },

  build: {
    // Raise the inline limit so small SVGs/icons are inlined, reducing requests
    assetsInlineLimit: 4096,

    rollupOptions: {
      output: {
        // Split heavy dependencies into separate chunks so the browser can
        // cache them independently from application code. A user typing notes
        // hits the app chunk on every deploy, but the vendor chunks stay cached.
        manualChunks: {
          // Supabase client is large (~120 kB min) — isolate it
          'vendor-supabase':  ['@supabase/supabase-js'],
          // Markdown pipeline — marked + hljs + DOMPurify — only loaded when needed
          'vendor-markdown':  ['marked', 'highlight.js', 'dompurify'],
          // React runtime — changes almost never
          'vendor-react':     ['react', 'react-dom'],
        },
      },
    },

    // Warn when any single chunk exceeds 500 kB (default is 500, be explicit)
    chunkSizeWarningLimit: 500,
  },

  // Pre-bundle these at dev-server start so first-load HMR is instant
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', 'marked', 'highlight.js', 'dompurify'],
  },
});
