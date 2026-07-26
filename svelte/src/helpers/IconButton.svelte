<script lang="ts">
    import { createRipple } from './ripple.ts'
    import { isUrlValid } from '../helpers/utils.ts'
    import Icon from './Icon.svelte'
    import type { IconColor } from './types.ts'

    interface Props {
        title?: string
        class?: string
        style?: string
        color?: IconColor
        bgColor?: IconColor
        bgTransparent?: boolean
        href?: string
        icon?: string
        onclick?: (event: MouseEvent) => void
        onblur?: () => void
        children?: () => any
    }

    let {
        title,
        class: className,
        style,
        color = 'on-primary',
        bgColor,
        bgTransparent,
        href,
        icon,
        onclick,
        onblur,
        children,
    }: Props = $props()

    let foregroundColor = $derived(color === 'danger' ? 'error' : color)
    let backgroundColor = $derived(
        bgColor === 'danger'
            ? 'error'
            : bgColor ||
                  (foregroundColor.startsWith('on-')
                      ? foregroundColor.replace('on-', '')
                      : foregroundColor === 'error'
                        ? 'primary'
                        : `on-${foregroundColor}`)
    )

    function onClick(event: MouseEvent) {
        event.stopPropagation()
        event.preventDefault()
        if (isUrlValid(href)) {
            window.open(href, '_blank', 'noopener,noreferrer')
        }
        onclick?.(event)
    }
</script>

<button
    class="ripple icon-button {className} {foregroundColor === 'on-surface'
        ? 'ripple_dark'
        : ''} {bgTransparent ? 'bg-transparent' : ''}"
    onclick={onClick}
    onmousedown={(event) => {
        event.stopPropagation()
        createRipple(event, true)
    }}
    {onblur}
    {title}
    style="--background: var(--{backgroundColor});--color: var(--{foregroundColor}); {style}"
>
    {#if icon}
        <Icon color={foregroundColor}>{icon}</Icon>
    {/if}
    {#if children}
        {@render children()}
    {/if}
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
