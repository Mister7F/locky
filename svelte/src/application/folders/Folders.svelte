<script>
    import ListItem from '../../helpers/ListItem.svelte'
    import IconButton from '../../helpers/IconButton.svelte'
    import { createEventDispatcher } from 'svelte'
    import * as api from '../api.js'
    import Icon from '../../helpers/Icon.svelte'
    import Sortablegrid from '../../helpers/Sortablegrid.svelte'
    import EditFolder from './EditFolder.svelte'
    import Folder from './Folder.svelte'
    const dispatch = createEventDispatcher()
    export let wallet
    export let currentFolderId
    export let visible = true
    export let floating = false
    $: folders = wallet && wallet['folders']
    $: categoryFolders = folders && folders.slice(1)
    let editedFolderId = -1
    let folderDialog
    let folderIconOpen = false

    async function onEditFolder(folder) {
        folderDialog.editFolder(folder)
    }
    async function onDeleteFolder(event) {
        wallet = await api.deleteFolder(event.detail)
    }
    async function onSaveFolder(event) {
        wallet = await api.updateFolder(event.detail)
    }
    async function onNewFolder() {
        folderDialog.editFolder({ icon: null, name: '' })
    }
    async function onMoveFolder(event) {
        wallet = await api.moveFolder(event.detail.fromItem, event.detail.to)
    }

    function setFolder(folderId) {
        currentFolderId = folderId
        dispatch('change')
        if (floating) {
            visible = false
        }
    }
</script>

{#if visible && floating}
    <div class="folders-overlay" on:click|self={() => (visible = false)}></div>
{/if}

<div
    class="foldersList {visible ? 'visible' : ''} {floating ? 'floating' : ''}"
>
    <div class="item_container">
        <div class="header">
            <span class="header_title">Folders</span>
            <IconButton
                on:click={onNewFolder}
                icon="create_new_folder"
                color="on-surface"
            />
        </div>
        <ListItem
            on:click={() => setFolder('security')}
            selected={currentFolderId === 'security'}
            icon="policy"
            name="Security panel"
        />
        {#if folders}
            <Folder
                folder={folders[0]}
                on:edit={onEditFolder(folders[0])}
                selected={currentFolderId === folders[0].id}
                on:click={() => setFolder(folders[0].id)}
            />
            <Sortablegrid
                class="folders"
                bind:items={categoryFolders}
                on:move={onMoveFolder}
            >
                <div slot="item" let:item>
                    <Folder
                        folder={item}
                        on:edit={onEditFolder(item)}
                        selected={currentFolderId === item.id}
                        on:click={() => setFolder(item.id)}
                    />
                </div>
            </Sortablegrid>
        {/if}
        <ListItem
            on:click={() => setFolder('no_folder')}
            selected={currentFolderId === 'no_folder'}
            icon="folder_off"
            name="No Folder"
        />
    </div>

    <EditFolder
        bind:this={folderDialog}
        on:save={onSaveFolder}
        on:delete={onDeleteFolder}
    />
</div>

<style>
    .item_container {
    }
    .header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
    .header_title {
        font-size: 20px;
        font-weight: 700;
        font-size: 1rem;
        line-height: 1.75rem;
        padding: 0 20px;
    }

    .foldersList {
        --folder-width: 350px;
        width: var(--folder-width);
        min-width: var(--folder-width);
        transition: 0.3s;
        box-sizing: border-box;
    }

    .foldersList.visible {
        margin-left: 0;
    }

    .foldersList.floating {
        position: absolute;
        left: -360px;
        height: 100%;
        background-color: var(--surface);
        z-index: 2;
    }

    .foldersList.floating.visible {
        left: 0;
    }

    .foldersList :global(.folders) {
        width: 100%;
        height: auto;
        max-height: calc(100vh - 240px) !important;
    }
    .foldersList :global(.folders .container) {
        width: 100%;
    }

    .folders-overlay {
        position: absolute;
        z-index: 1;
        height: 100%;
        width: 100%;
        background-color: var(--primary);
        top: 0;
        opacity: 0.4;
    }
</style>
