<script>
    import ListItem from '../../helpers/ListItem.svelte'
    import IconButton from '../../helpers/IconButton.svelte'
    import * as api from '../api.js'
    import Icon from '../../helpers/Icon.svelte'
    import Sortablegrid from '../../helpers/Sortablegrid.svelte'
    import EditFolder from './EditFolder.svelte'
    import Folder from './Folder.svelte'

    let {
        wallet = $bindable(),
        currentFolderId = $bindable(),
        visible = $bindable(true),
        floating = false,
        onchange,
    } = $props()

    let folderDialog

    async function onEditFolder(folder) {
        folderDialog.editFolder(folder)
    }
    async function onDeleteFolder(folder) {
        wallet = await api.deleteFolder(folder)
    }
    async function onSaveFolder(folder) {
        wallet = await api.updateFolder(folder)
    }
    async function onNewFolder() {
        folderDialog.editFolder({ icon: null, name: '' })
    }
    async function onMoveFolder(event) {
        wallet = await api.moveFolder(event.fromItem, event.to)
    }

    function setFolder(folderId) {
        currentFolderId = folderId
        onchange()
        if (floating) {
            visible = false
        }
    }
</script>

{#if visible && floating}
    <div class="folders-overlay" onclick={() => (visible = false)}></div>
{/if}

<div
    class="foldersList {visible ? 'visible' : ''} {floating ? 'floating' : ''}"
>
    <div>
        <div class="header">
            <span class="header_title">Folders</span>
            <IconButton
                onclick={onNewFolder}
                icon="create_new_folder"
                color="on-surface"
            />
        </div>
        <ListItem
            onclick={() => setFolder('security')}
            selected={currentFolderId === 'security'}
            icon="policy"
            name="Security panel"
        />
        {#if wallet['folders']}
            <Folder
                folder={{ id: 0, name: 'All', icon: 'home' }}
                selected={currentFolderId === 0}
                onclick={() => setFolder(0)}
                edit={false}
            />
            <Sortablegrid
                class="folders"
                items={wallet['folders']}
                onmove={onMoveFolder}
            >
                {#snippet card(item)}
                    <Folder
                        folder={item}
                        onedit={() => onEditFolder(item)}
                        selected={currentFolderId === item.id}
                        onclick={() => setFolder(item.id)}
                    />
                {/snippet}
            </Sortablegrid>
        {/if}
        <ListItem
            onclick={() => setFolder('no_folder')}
            selected={currentFolderId === 'no_folder'}
            icon="folder_off"
            name="No Folder"
        />
    </div>

    <EditFolder
        bind:this={folderDialog}
        onsave={onSaveFolder}
        ondelete={onDeleteFolder}
    />
</div>

<style>
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
    .foldersList :global(.folders .dnd_container) {
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
