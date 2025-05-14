<script>
    import Icon from './Icon.svelte'
    import { createRipple } from './ripple.js'

    let {
        variant = false,
        color = 'primary',
        disabled = false,
        icon = false,
        style = '',
        ripple = true,

        class: className = '',
        title = '',
        onclick,
        children,
    } = $props()

    let _variant = $derived(variant || 'standard')
    let iconColor = $derived(_variant === 'standard' ? `on-${color}` : color)

    function onClick(event) {
        if (disabled) {
            return
        }
        onclick()
    }
</script>

<button
    class="ripple {color} {className} {disabled && 'disabled'} {_variant}"
    {title}
    onclick={onClick}
    onmousedown={(event) => ripple && createRipple(event)}
    {style}
>
    {#if icon}
        <Icon color={iconColor} class="button_icon {children ? 'margin' : ''}"
            >{icon}</Icon
        >
    {/if}
    {#if children}
        {@render children()}
    {/if}
</button>

<style>
    button {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.08929em;
        outline: 0;
        border: 0;
        box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.3);
        cursor: pointer;
        text-transform: uppercase;
        height: 36px;
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.08929em;
        line-height: 2.25rem;
        -webkit-appearance: none;
        border: none;
        border-radius: 4px;
        box-sizing: border-box;
        display: inline-flex;
        min-width: 64px;
        overflow: hidden;
        padding: 0 12px;
        text-decoration: none;
        user-select: none;
        vertical-align: middle;
    }

    .standard.primary {
        color: var(--on-primary);
        background-color: var(--primary);
    }
    .standard.secondary {
        color: var(--on-secondary);
        background-color: var(--secondary);
    }
    .outlined.secondary {
        border: 1px solid var(--secondary);
        color: var(--secondary);
        background-color: var(--on-secondary);
    }
    .text.primary {
        box-shadow: none;
        color: var(--primary);
        background-color: var(--on-primary);
    }

    .text.on-primary {
        box-shadow: none;
        color: var(--on-primary);
        background-color: var(--primary);
    }
    .text.on-primary:hover {
        background-color: color-mix(
            in srgb,
            var(--on-primary) 12%,
            transparent
        );
    }

    .text.secondary {
        box-shadow: none;
        color: var(--secondary);
        background-color: var(--on-secondary);
    }

    .outlined.secondary:hover,
    .text.secondary:hover {
        background-color: color-mix(in srgb, var(--secondary) 12%, transparent);
    }

    :global(.button_icon) {
        font-size: 18px;
    }
    :global(.button_icon.margin) {
        /* There's text on the right */
        margin-right: 10px;
    }

    .disabled {
        border: none !important;
        color: darkgrey !important;
        background-color: var(--primary) !important;
        transition: background 0ms !important;
        cursor: initial;
    }
    .disabled :global(.icon_base) {
        color: darkgrey !important;
    }
</style>
