<script>
    import { Icon } from '@smui/icon-button'
    export let title = ''
    let className = ''
    export { className as class }
    export let color = 'on-primary'
    export let on = null
    $: cssColor =
        {
            primary: 'var(--primary)',
            secondary: 'var(--secondary)',
            surface: 'var(--surface)',
            'on-primary': 'var(--on-primary)',
            'on-secondary': 'var(--on-secondary)',
            'on-surface': 'var(--on-surface)',
        }[color] || 'var(--on-surface)'
</script>

<Icon
    class="icon-import material-icons {className}"
    on:click
    {on}
    {title}
    {color}
    style="--color: {cssColor}"
>
    <slot />
</Icon>

<style>
    :global(.icon-import) {
        color: var(--color) !important;
    }

    :global(.icon-import svg) {
        fill: var(--color);
        width: 100%;
        min-width: 24px;
        min-height: 24px;
    }
</style>
