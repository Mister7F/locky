import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
    preprocess: vitePreprocess(),
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
