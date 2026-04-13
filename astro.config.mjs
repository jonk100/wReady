// @ts-check

import 'dotenv/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import alpinejs from '@astrojs/alpinejs';
import { defineConfig } from 'astro/config';
import { remarkScreenplay } from './src/plugins/remark-screenplay.ts';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',

  integrations: [
      alpinejs(),
      mdx({
          remarkPlugins: [remarkScreenplay],
      }),
      sitemap()
	],

  adapter: netlify(),

  // Configure Vite to watch content collections and trigger page reloads
  vite: {
    server: {
      watch: {
        // Watch all content directories for changes
        ignored: ['!**/node_modules/**', '!**/.git/**']
      }
    }
  }
});