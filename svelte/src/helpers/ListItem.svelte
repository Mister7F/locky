<script>
    import { createRipple } from './ripple.js'

    import IconButton from './IconButton.svelte'
    import Icon from './Icon.svelte'

    let {
        icon,
        name,
        id = null,
        edit = false,
        selected,
        onedit,
        onclick,
    } = $props()
</script>

<div
    class="ripple ripple_dark list_item {selected && 'selected'}"
    {id}
    {onclick}
    onmousedown={(event) => createRipple(event)}
>
    <div class="left">
        <Icon color="on-surface">{icon}</Icon>
        <span>{name}</span>
    </div>
    {#if edit}
        <IconButton
            icon="create"
            color="on-surface"
            onclick={onedit}
            bgTransparent="1"
        />
    {/if}
</div>

<style>
    .list_item {
        height: 50px;
        cursor: pointer;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .left {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 0 15px;
    }
    .left span {
        margin-left: 10px;
    }
    .list_item.selected {
        background-color: color-mix(in srgb, #4a6572 20%, transparent);
    }
    .list_item:hover {
        background-color: color-mix(in srgb, #4a6572 7%, transparent);
    }

    .list_item :global(button) {
        transition: 0.2s;
        opacity: 0.2;
    }

    .list_item :global(button:hover) {
        opacity: 1;
    }
</style>
