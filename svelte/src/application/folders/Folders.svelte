<script lang="ts">
    import ListItem from '../../helpers/ListItem.svelte'
    import IconButton from '../../helpers/IconButton.svelte'
    import * as api from '../api.ts'
    import Icon from '../../helpers/Icon.svelte'
    import Sortablegrid from '../../helpers/Sortablegrid.svelte'
    import EditFolder from './EditFolder.svelte'
    import Folder from './Folder.svelte'
    import FolderType from '../../models/folder.ts'
    import Wallet from '../../models/wallet.ts'

    interface Props {
        wallet?: Wallet
        currentFolderId?: string
        visible?: boolean
        floating?: boolean
        onchange: () => void
    }

    let {
        wallet = $bindable(),
        currentFolderId = $bindable(),
        visible = $bindable(true),
        floating = false,
        onchange,
    }: Props = $props()

    let folderDialog: EditFolder | undefined

    async function onEditFolder(folder: FolderType) {
        folderDialog?.editFolder(folder)
    }
    async function onDeleteFolder(folder: FolderType) {
        wallet = await api.deleteFolder(folder)
    }
    async function onSaveFolder(folder: FolderType) {
        wallet = await api.updateFolder(folder)
    }
    async function onNewFolder() {
        folderDialog.editFolder(new FolderType())
    }
    async function onMoveFolder(event: {
        from: number
        to: number
        fromItem: FolderType
        destItem: FolderType
    }) {
        wallet = await api.moveFolder(event.fromItem, event.to)
    }

    function setFolder(folderId: string) {
        currentFolderId = folderId
        onchange()
        if (floating) {
            visible = false
        }
    }

    const ALL_FOLDER = FolderType.fromJson({ name: 'All', icon: 'home' })
    ALL_FOLDER.id = ''
</script>

{#if visible && floating}
    <div class="folders-overlay" onclick={() => (visible = false)}></div>
{/if}

<div
    class="foldersList {visible ? 'visible' : ''} {floating ? 'floating' : ''}"
>
    <div class="folder-items">
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
                folder={ALL_FOLDER}
                selected={currentFolderId === ''}
                onclick={() => setFolder('')}
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
            id="item_no_folder"
            onclick={() => setFolder('no_folder')}
            selected={currentFolderId === 'no_folder'}
            icon="folder_off"
            name="No Folder"
        />
        <ListItem
            id="item_trash"
            onclick={() => setFolder('trash')}
            selected={currentFolderId === 'trash'}
            icon="delete"
            name="Trash"
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
        max-width: 100%;
        transition: 0.3s;
        box-sizing: border-box;
    }

    .foldersList.visible {
        margin-left: 0;
    }

    .foldersList.floating {
        position: fixed;
        top: 57px;
        bottom: 0;
        left: -360px;
        height: auto;
        min-width: 0;
        background-color: var(--surface);
        z-index: 2;
    }

    .foldersList.floating.visible {
        left: 0;
    }

    .folder-items {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
        padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
        box-sizing: border-box;
    }

    .foldersList :global(.folders) {
        flex: 1;
        min-height: 0;
        width: 100%;
        max-height: none !important;
    }
    .foldersList :global(.folders .dnd_container) {
        width: 100%;
    }

    .folders-overlay {
        position: fixed;
        z-index: 1;
        inset: 57px 0 0;
        background-color: var(--primary);
        opacity: 0.4;
    }
</style>
