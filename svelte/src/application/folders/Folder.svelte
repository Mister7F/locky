<script>
    import ListItem from '../../helpers/ListItem.svelte'

    let { folder, selected, onedit, onclick, edit = true } = $props()
</script>

<ListItem
    {selected}
    id="item_folder_{folder.id}"
    {onclick}
    {onedit}
    icon={folder.icon || 'folder'}
    name={folder.name}
    {edit}
/>
