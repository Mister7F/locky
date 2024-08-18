<script>
    import Icon from './Icon.svelte'
    import IconButton from './IconButton.svelte'

    let {
        onclick,
        title = '',
        color = 'on-primary',
        icon = false,
        bgColor = false,
        class: className = '',
    } = $props()
</script>

<IconButton
    class="{className} fab_button"
    {title}
    {color}
    {onclick}
    {icon}
    {bgColor}
>
    <slot />
</IconButton>

<style>
    :global(.fab_button) {
        width: 56px !important;
        height: 56px !important;
        max-width: 56px !important;
        max-height: 56px !important;
        box-shadow:
            0 19px 38px rgba(0, 0, 0, 0.3),
            0 15px 12px rgba(0, 0, 0, 0.22);
    }
</style>
