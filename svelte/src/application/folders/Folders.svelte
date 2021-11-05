<script>
    import Button from '@smui/button';
    import Dialog, { Title, Content } from '@smui/dialog';
    import Fab, { Label } from '@smui/fab';
    import IconButton from '@smui/icon-button';
    import List, {
        Group,
        Item,
        Graphic,
        Meta,
        Separator,
        Subheader,
        Text,
        PrimaryText,
        SecondaryText,
    } from '@smui/list';
    import Menu, { SelectionGroup, SelectionGroupIcon } from '@smui/menu';
    import Textfield from '@smui/textfield';
    import { createEventDispatcher } from 'svelte';
    import * as api from '../api.js';
    import Icon from '../../helpers/Icon.svelte';
    import Sortablegrid from '../../helpers/Sortablegrid.svelte';
    import EditFolder from './EditFolder.svelte';
    import Folder from './Folder.svelte';
    const dispatch = createEventDispatcher();
    export let wallet;
    export let currentFolderId;
    export let visible = true;
    export let floating = false;
    $: folders = wallet && wallet['folders'];
    $: categoryFolders = folders && folders.slice(1);
    let editedFolderId = -1;
    let folderDialog;
    let folderIconOpen = false;
    let draggingFolder = false;

    async function onEditFolder(folder) {
        folderDialog.editFolder(folder);
    }
    async function onDropDelete(event) {
        wallet = await api.deleteFolder(event.detail.item);
    }
    async function onSaveFolder(event) {
        wallet = await api.updateFolder(event.detail);
    }
    async function onNewFolder() {
        folderDialog.editFolder({ icon: null, name: '' });
    }
    async function onMoveFolder(event) {
        wallet = await api.moveFolder(event.detail.fromItem, event.detail.to);
    }

</script>

{#if visible && floating}
    <div class="folders-overlay" on:click="{() => (visible = false)}"></div>
{/if}

<div class="foldersList {visible ? 'visible' : ''} {floating ? 'floating' : ''}">
    <Group>
        <Subheader>
            Folders
            <IconButton on:click="{onNewFolder}">
                <Icon color="on-surface">create_new_folder</Icon>
            </IconButton>
        </Subheader>
        <Item
            class="account_audit"
            on:click="{() => (currentFolderId = -1)}"
            selected="{currentFolderId < 0}">
            <Icon color="on-surface">policy</Icon>
            <Text>Security panel</Text>
        </Item>
        {#if folders}
            <Folder
                folder="{folders[0]}"
                on:edit="{onEditFolder(folders[0])}"
                selected="{currentFolderId === folders[0].id}"
                on:click="{() => (currentFolderId = folders[0].id)}" />
            <Sortablegrid
                class="folders"
                bind:items="{categoryFolders}"
                let:item
                bind:dragging="{draggingFolder}"
                on:action="{onDropDelete}"
                customActions="{['delete_folder']}"
                on:move="{onMoveFolder}">
                <div slot="item">
                    <Folder
                        folder="{item}"
                        on:edit="{onEditFolder(item)}"
                        selected="{currentFolderId === item.id}"
                        on:click="{() => (currentFolderId = item.id)}" />
                </div>
            </Sortablegrid>
            <div
                id="delete_folder"
                class="deleteFolder {draggingFolder ? 'visible' : ''}">
                <Fab color="primary">
                    <Icon>delete</Icon>
                </Fab>
            </div>
        {/if}
    </Group>

    <EditFolder bind:this="{folderDialog}" on:save="{onSaveFolder}" />
</div>

<style>
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

    .foldersList :global(.folder_item) {
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        box-sizing: border-box;
    }

    .foldersList :global(.folder_item button) {
        transition: 0.2s;
        opacity: 0.2;
    }

    .foldersList :global(.folder_item button:hover) {
        opacity: 1;
    }

    .foldersList :global(.folder_item.move_into:before),
    .foldersList :global(.folder_item.selected:before) {
        /* show the ripple background */
        opacity: 0.2;
    }

    .foldersList :global(.account_audit .mdc-list-item__text),
    .foldersList :global(.folder_item .mdc-list-item__text) {
        margin-left: 10px;
    }

    :global(.wallet_folder_dialog .mdc-dialog__surface),
    :global(.wallet_folder_dialog p),
    :global(.wallet_folder_dialog .mdc-dialog__title) {
        color: var(--on-primary);
        background-color: var(--primary);
    }

    .deleteFolder {
        position: absolute;
        bottom: 60px;
        left: -60px;
        transition: all 0.5s cubic-bezier(0.47, 1.64, 0.41, 0.8);
    }

    .deleteFolder.visible {
        left: 150px;
    }

    .folders-overlay {
        position: absolute;
        height: 100%;
        width: 100%;
        background-color: var(--primary);
        top: 0;
        opacity: 0.4;
    }

</style>
