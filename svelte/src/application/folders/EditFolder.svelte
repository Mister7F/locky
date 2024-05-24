<script>
    import Button from '@smui/button'
    import Dialog, { Title, Content } from '@smui/dialog'
    import IconButton from '@smui/icon-button'
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
    } from '@smui/list'
    import Textfield from '@smui/textfield'
    import { createEventDispatcher } from 'svelte'
    import Icon from '../../helpers/Icon.svelte'
    const dispatch = createEventDispatcher()
    let editedFolder = null
    let folderDialog = null
    let folderIconOpen = false
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
        'code',
        'vpn_key',
        'music_note',
        'star',
        'wifi',
        'shopping_cart',
        'credit_card',
        'attach_money',
        'sms',
        'vpn_lock',
        'sd_card',
        'smartphone',
        'computer',
        'headset',
        'family_restroom',
        'free_breakfast',
    ]
    export function editFolder(folder) {
        // Deep copy to not change the folder before saving
        editedFolder = JSON.parse(JSON.stringify(folder))
        folderDialog.open()
    }
    function onSaveFolder() {
        dispatch('save', editedFolder)
        folderDialog.close()
    }
</script>

<Dialog class="wallet_folder_dialog" bind:this={folderDialog}>
    <Title>Folder</Title>
    <Content>
        {#if editedFolder}
            <IconButton
                on:click={() => (folderIconOpen = !folderIconOpen)}
                on:blur={() => setTimeout(() => (folderIconOpen = false), 100)}
            >
                <Icon color="on-primary">{editedFolder.icon || 'folder'}</Icon>
            </IconButton>
            {#if folderIconOpen}
                <div static class="menu_folder_icon">
                    <List>
                        {#each folderIcons as folderIcon}
                            <Item
                                on:click={() =>
                                    (editedFolder.icon = folderIcon)}
                            >
                                <Icon color="on-surface">{folderIcon}</Icon>
                            </Item>
                        {/each}
                    </List>
                </div>
            {/if}

            <Textfield bind:value={editedFolder.name} />
            <Button
                on:click={onSaveFolder}
                style="float: right; margin-top: 10px;"
                color="secondary"
            >
                Save
            </Button>
        {/if}
    </Content>
</Dialog>

<style>
    :global(.menu_folder_icon) {
        position: absolute;
        min-width: 60px;
        width: 60px;
        z-index: 999999;
        box-sizing: border-box;

        background-color: var(--surface);
        max-height: 400px;
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
</style>
