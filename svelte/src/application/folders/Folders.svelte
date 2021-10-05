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
    let folderIcons = [
        // https://material.io/resources/icons/?style=baseline
        'home',
        'folder',
        'games',
        'work',
        'account_balance',
        'cloud',
        'build',
        'delete',
        'grade',
        'label',
        'alternate_email',
        'drafts',
        'functions',
        'computer',
        'mouse',
        'security',
        'smartphone',
        'toys',
        'watch',
        'local_bar',
        'local_airport',
        'local_phone',
        'sms',
        'thumb_up',
        'thumb_down',
        'code',
        'vpn_key',
        'music_note',
        'star',
        'wifi',
    ];
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

<div class="foldersList {visible ? 'visible' : ''} {floating ? 'floating' : ''}">
    <Group>
        <Subheader>
            Folders
            <IconButton on:click="{onNewFolder}">
                <Icon color="on-surface">create_new_folder</Icon>
            </IconButton>
        </Subheader>

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
        padding-top: 10px;
        margin-top: -30px;
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

    .foldersList :global(.folder_item .mdc-list-item__text) {
        margin-left: 10px;
    }

    :global(.wallet_folder_dialog .mdc-dialog__surface),
    :global(.wallet_folder_dialog p),
    :global(.wallet_folder_dialog .mdc-dialog__title) {
        color: var(--on-primary);
        background-color: var(--primary);
    }

    :global(.menu_folder_icon) {
        position: absolute;
        min-width: 60px;
        width: 60px;
        z-index: 999999;
        box-sizing: border-box;

        background-color: var(--surface);
        max-height: 300px;
        width: 300px;
    }

    :global(.menu_folder_icon > ul) {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        flex-wrap: wrap;
        width: 100%;
    }

    :global(.menu_folder_icon > *) {
        display: block;
        width: 60px;
    }
    .deleteFolder {
        position: absolute;
        margin-top: 180px;
        left: -60px;
        transition: all 0.5s cubic-bezier(0.47, 1.64, 0.41, 0.8);
    }

    .deleteFolder.visible {
        left: 150px;
    }

</style>
