import { defineConfig, passthroughImageService, fontProviders } from 'astro/config'
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
    output: 'static',
    prefetch: {
        prefetchAll: true,
        defaultStrategy: 'hover',
    },
    devToolbar: {
        enabled: false,
    },
    adapter: node({
        mode: 'standalone',
    }),
    image: {
        service: passthroughImageService(),
    },
    experimental: {
        fonts: [
            {
                provider: fontProviders.google(),
                name: 'Rowdies',
                cssVariable: '--font-rowdies',
            },
            {
                provider: fontProviders.google(),
                name: 'Cal Sans',
                cssVariable: '--font-cal-sans',
            },
            {
                provider: fontProviders.google(),
                name: 'Bebas Neue',
                cssVariable: '--font-bebas-neue',
            },
            {
                provider: fontProviders.google(),
                name: 'Pacifico',
                cssVariable: '--font-pacifico',
            },
            {
                provider: fontProviders.google(),
                name: 'Caveat',
                cssVariable: '--font-caveat',
            },
        ],
    },
})
