import { mount } from 'svelte'
import App from './application/App.svelte'

const app = mount(App, { target: document.getElementById('app') })

export default app
