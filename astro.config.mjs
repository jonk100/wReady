// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import alpinejs from '@astrojs/alpinejs';
import { defineConfig } from 'astro/config';
import { remarkScreenplay } from './src/plugins/remark-screenplay.ts';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://jonk100.netlify.app',

  integrations: [
      alpinejs(),
      mdx({
          remarkPlugins: [remarkScreenplay],
      }), 
      sitemap()
	],

  adapter: netlify(),
});