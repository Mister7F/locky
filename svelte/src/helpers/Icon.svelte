<script>
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

<span
    class="icon_base material-icons {className}"
    on:click
    {on}
    {title}
    {color}
    style="--color: {cssColor}"><slot /></span
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
