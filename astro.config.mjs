// @ts-check

/**
 * Astro configuration
 */

import { defineConfig } from 'astro/config';

import alpinejs from '@astrojs/alpinejs';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

import path from 'node:path';

import { remarkScreenplay } from './src/plugins/remark-screenplay.ts';

const root = path.resolve('./src');

export default defineConfig({
  /**
   * Production site URL
   */
  site: 'https://writty.netlify.app',

  /**
   * Astro integrations
   */
  integrations: [
    alpinejs(),

    mdx({
      remarkPlugins: [remarkScreenplay],
    }),

    sitemap(),
  ],

  /**
   * Netlify adapter
   */
  adapter: netlify(),

  /**
   * Vite configuration
   */
  vite: {
    resolve: {
      alias: {
        '@': root,
      },
    },
  },
});