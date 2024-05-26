<script>
    import { createRipple } from './ripple.js'

    import Icon from './Icon.svelte'
    import IconButton from './IconButton.svelte'
    import { createEventDispatcher } from 'svelte'

    export let title = ''
    let className = ''
    export { className as class }

    export let color = 'on-primary'

    export let icon = false

    export let bgColor = false

    const dispatch = createEventDispatcher()

    function onClick(event) {
        dispatch('click')
    }
</script>

<IconButton
    class="{className} fab_button"
    {title}
    {color}
    on:click={onClick}
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
