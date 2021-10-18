<script>
    import IconButton from '@smui/icon-button';
    import List, { Item, Meta, Text } from '@smui/list';
    import { createEventDispatcher } from 'svelte';
    import Icon from '../../helpers/Icon.svelte';
    const dispatch = createEventDispatcher();
    export let folder;
    export let selected;
    function onClickEdit(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        dispatch('edit');
    }

</script>

<Item class="folder_item {selected && 'selected'}" id="item_folder_{folder.id}" on:click>
    <Icon color="on-surface">{folder.icon || 'folder'}</Icon>
    <Text>{folder.name}</Text>
    <Meta on:click="{onClickEdit}">
        <IconButton>
            <Icon color="on-surface">create</Icon>
        </IconButton>
    </Meta>
</Item>
