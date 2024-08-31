<script>
    import { createRipple } from './ripple.js'
    import { isUrlValid } from '../helpers/utils.js'
    import Icon from './Icon.svelte'

    let {
        title = '',
        class: className = '',
        color = 'on-primary',
        bgColor = false,
        bgTransparent = false,
        href = null,
        icon = false,
        onclick,
        onblur,
        children,
    } = $props()

    let backgroundColor = $derived(
        bgColor ||
            (color.includes('on') ? color.replace('on-', '') : `on-${color}`)
    )

    function onClick(event) {
        event.stopPropagation()
        event.preventDefault()
        if (isUrlValid(href)) {
            window.open(href)
        }
        onclick(event)
    }
</script>

<button
    class="ripple icon-button {className} {color === 'on-surface'
        ? 'ripple_dark'
        : ''} {bgTransparent ? 'bg-transparent' : ''}"
    onclick={onClick}
    onmousedown={(event) => {
        event.stopPropagation()
        createRipple(event, true)
    }}
    {onblur}
    {title}
    style="--background: var(--{backgroundColor});--color: var(--{color})"
>
    {#if icon}
        <Icon {color}>{icon}</Icon>
    {/if}
    {@render children()}
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
        min-width: 48px;
        min-height: 48px;
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
