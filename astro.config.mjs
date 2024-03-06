import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue'; // https://astro.build/config


// https://astro.build/config
export default defineConfig({
  // Enable Vue to support Vue components.
  integrations: [vue()],
  vite: {
    ssr: {
      noExternal: ['vuetify']
    }
  }
});
