import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import autoPreprocess from 'svelte-preprocess'
import typescript from '@rollup/plugin-typescript'

export default {
    plugins: [
        svelte({
            preprocess: autoPreprocess(),
        }),
        typescript({ sourceMap: false }),
    ],
    preprocess: vitePreprocess({ script: true }),
    onwarn: (warning, handler) => {
        if (warning.code === 'a11y_click_events_have_key_events') return
        if (warning.code === 'a11y_no_static_element_interactions') return
        if (warning.code === 'a11y_no_noninteractive_element_interactions')
            return
        // console.log(warning.code)
        handler(warning)
    },
    compilerOptions: {
        compatibility: {
            componentApi: 5,
        },
    },
}
