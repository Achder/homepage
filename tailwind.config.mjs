/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontFamily: {
                rethink: ['Rethink Sans'],
            },
            colors: {
                brand: '#ff3c1a',
                dark: '#000000',
            },
        },
    },
    plugins: [],
}
