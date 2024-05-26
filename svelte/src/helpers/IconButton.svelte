<script>
    import { createRipple } from './ripple.js'
    import { isUrlValid } from '../helpers/utils.js'
    import Icon from './Icon.svelte'
    import { createEventDispatcher } from 'svelte'

    export let title = ''
    let className = ''
    export { className as class }

    export let color = 'on-primary'

    export let bgColor = false
    export let bgTransparent = false
    export let href = null

    $: backgroundColor =
        bgColor ||
        (color.includes('on') ? color.replace('on-', '') : `on-${color}`)

    export let icon = false

    const dispatch = createEventDispatcher()

    function onClick(event) {
        createRipple(event, true)
        if (isUrlValid(href)) {
            window.open(href)
        }
        dispatch('click')
    }
</script>

<button
    class="ripple icon-button {className} {color === 'on-surface'
        ? 'ripple_dark'
        : ''} {bgTransparent ? 'bg-transparent' : ''}"
    on:click|stopPropagation={onClick}
    on:blur={() => dispatch('blur')}
    on:mousedown|stopPropagation={() => {}}
    {title}
    style="--background: var(--{backgroundColor});--color: var(--{color})"
>
    {#if icon}
        <Icon {color}>{icon}</Icon>
    {/if}
    <slot />
</button>

<style>
    .icon-button {
        border: none;
        outline: none;
        box-sizing: border-box;
        cursor: pointer;
        display: flex;
        justify-content: center;
        width: 48px;
        height: 48px;
        max-width: 48px;
        max-height: 48px;
        border-radius: 100%;
        align-items: center;
    }
    .icon-button:not(.bg-transparent) {
        background-color: var(--background);
    }
    .icon-button.bg-transparent {
        background: transparent;
    }

    .icon-button:hover {
        background-color: color-mix(
            in srgb,
            var(--color) 15%,
            var(--background)
        );
    }
</style>
