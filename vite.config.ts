import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { Features } from 'lightningcss';
import { defineConfig } from 'vite';

const path = (file: string) => fileURLToPath(new URL(file, import.meta.url));

// The workbench in apps/preview serves the app; `@/` imports reach the skin in src/.
export default defineConfig({
  root: path('./apps/preview'),
  // Relative URLs, so the build works at a domain root or in a subfolder such as GitHub Pages.
  base: './',
  plugins: [tailwindcss(), react()],
  // Keep light-dark() and :dir() as authored. Lightning CSS would otherwise lower them in the
  // production build, which mirrors the control bar for right-to-left languages shown left to right
  // (docs: Browser support > Build the skin CSS yourself).
  css: { lightningcss: { exclude: Features.LightDark | Features.DirSelector } },
  resolve: {
    alias: {
      '@preview': path('./apps/preview/src'),
      '@': path('./src'),
    },
  },
  server: {
    fs: { allow: [path('.')] },
  },
  build: {
    outDir: path('./dist'),
    emptyOutDir: true,
    rolldownOptions: {
      // The public showcase (index), the workbench shell, and the preview page both of them frame.
      input: {
        showcase: path('./apps/preview/index.html'),
        workbench: path('./apps/preview/workbench.html'),
        preview: path('./apps/preview/preview.html'),
      },
    },
  },
});
