<script lang="ts">
    import ListItem from '../../helpers/ListItem.svelte'
    import FolderType from '../../models/folder.ts'

    interface Props {
        folder: FolderType
        selected?: boolean
        onedit?: () => void
        onclick: (event: MouseEvent) => void
        edit?: boolean
    }

    let { folder, selected, onedit, onclick, edit = true }: Props = $props()
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
