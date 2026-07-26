import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte()],
    base: './',
    server: {
        allowedHosts: ['tunnel.sep.tf'],
    },
    resolve: {
        dedupe: ['svelte'],
    },
})
