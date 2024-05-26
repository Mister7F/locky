<script>
    import ListItem from '../../helpers/ListItem.svelte'

    import { createEventDispatcher } from 'svelte'
    const dispatch = createEventDispatcher()
    export let folder
    export let selected

    function onClickEdit(ev) {
        ev.preventDefault()
        ev.stopPropagation()
        dispatch('edit')
    }

    function onFolderClick(event) {
        dispatch('click')
    }
</script>

<ListItem
    {selected}
    id="item_folder_{folder.id}"
    on:click={onFolderClick}
    on:edit={onClickEdit}
    icon={folder.icon || 'folder'}
    name={folder.name}
    edit={folder.id !== 0}
/>
