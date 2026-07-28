import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

function updateServiceWorkerCacheKey() {
    let serviceWorkerPath: string
    let updated = false

    return {
        name: 'update-service-worker-cache-key',
        apply: 'build' as const,
        configResolved(config) {
            serviceWorkerPath = resolve(
                config.root,
                config.build.outDir,
                'sw.js'
            )
        },
        async closeBundle() {
            if (updated) return

            const serviceWorker = await readFile(serviceWorkerPath, 'utf8')
            const updatedServiceWorker = serviceWorker.replace(
                '__CACHE_KEY__',
                Date.now().toString()
            )
            if (updatedServiceWorker === serviceWorker) {
                throw new Error(
                    'Service worker cache placeholder was not found'
                )
            }
            await writeFile(serviceWorkerPath, updatedServiceWorker)
            updated = true
        },
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte(), updateServiceWorkerCacheKey()],
    base: './',
    server: {
        allowedHosts: ['tunnel.sep.tf'],
    },
    resolve: {
        dedupe: ['svelte'],
    },
})
