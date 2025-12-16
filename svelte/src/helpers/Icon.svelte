<script lang="ts">
    interface Props {
        onclick?: (event: any) => void
        title?: string
        color?: string
        class?: string
        children: () => any
    }

    let {
        onclick,
        title = '',
        color = 'on-primary',
        class: className,
        children,
    }: Props = $props()

    let cssColor = $derived(
        {
            primary: 'var(--primary)',
            secondary: 'var(--secondary)',
            surface: 'var(--surface)',
            'on-primary': 'var(--on-primary)',
            'on-secondary': 'var(--on-secondary)',
            'on-surface': 'var(--on-surface)',
        }[color] || 'var(--on-surface)'
    )
</script>

<span
    class="icon_base material-icons {className}"
    {onclick}
    {title}
    {color}
    style="--color: {cssColor}">{@render children()}</span
>

<style>
    .icon_base {
        color: var(--color) !important;
    }

    :global(.icon_base svg) {
        fill: var(--color);
        width: 100%;
        min-width: 24px;
        min-height: 24px;
    }
</style>
