import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BrowserRouter needs absolute asset paths so that deep links like /books/5 load the JS and CSS correctly.
//  - Vercel / Netlify / local dev: served from the domain root → base "/" (default).
//  - GitHub Pages: served from /<repo>/ → the workflow sets VITE_BASE=/<repo>/ for the build.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
});
