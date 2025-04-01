import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import node from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
    site: 'https://meerpohl.dev',
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [mdx(), sitemap()],
    output: 'server',
    prefetch: {
        prefetchAll: true,
        defaultStrategy: 'viewport',
    },
    devToolbar: {
        enabled: false,
    },
    adapter: node({
        mode: 'standalone',
    }),
})
