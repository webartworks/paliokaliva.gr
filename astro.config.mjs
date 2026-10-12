import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://paliokaliva.gr',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'auto',
  },
});
