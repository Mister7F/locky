<script>
    import TextInput from '../../helpers/TextInput.svelte'
    import Button from '../../helpers/Button.svelte'
    import IconButton from '../../helpers/IconButton.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import Icon from '../../helpers/Icon.svelte'

    let { onsave, ondelete } = $props()

    let editedFolder = $state(null)
    let folderDialog = null
    let folderDialogOpen = $state(false)
    let folderIconOpen = $state(false)
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
        folderDialogOpen = true
    }
    function onSaveFolder() {
        onsave(editedFolder)
        folderDialogOpen = false
        editedFolder = null
    }
    function onDeleteFolder() {
        ondelete(editedFolder)
        folderDialogOpen = false
        editedFolder = null
    }
</script>

<Dialog title="Folder" bind:open={folderDialogOpen}>
    <div class="container">
        <IconButton
            onclick={() => (folderIconOpen = !folderIconOpen)}
            onblur={() => setTimeout(() => (folderIconOpen = false), 100)}
            icon={editedFolder.icon || 'folder'}
            color="on-primary"
        />
        {#if folderIconOpen}
            <div static class="menu_folder_icon">
                {#each folderIcons as folderIcon}
                    <div
                        class="folder_icon"
                        onclick={() => (editedFolder.icon = folderIcon)}
                    >
                        <Icon color="on-surface">{folderIcon}</Icon>
                    </div>
                {/each}
            </div>
        {/if}

        <TextInput bind:value={editedFolder.name} />
    </div>

    {#snippet actions()}
    <div>
        <Button
            onclick={onDeleteFolder}
            style="float: right; margin-top: 10px;"
            color="secondary"
            variant="outlined"
        >
            Delete
        </Button>

        <Button
            onclick={onSaveFolder}
            style="float: right; margin-top: 10px;"
            color="secondary"
            variant="outlined"
        >
            Save
        </Button>
    </div>
    {/snippet}
</Dialog>

<style>
    .container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 250px;
    }

    .folder_icon {
        cursor: pointer;
        margin: 10px;
    }
    .folder_icon:hover {
        background-color: color-mix(
            in srgb,
            var(--on-primary) 12%,
            transparent
        );
    }

    .menu_folder_icon {
        border-radius: 5px;
        box-shadow:
            0 19px 38px rgba(0, 0, 0, 0.3),
            0 15px 12px rgba(0, 0, 0, 0.22);

        padding: 5px 10px;
        position: absolute;
        min-width: 60px;
        width: 60px;
        z-index: 999999;
        box-sizing: border-box;

        background-color: var(--surface);
        max-height: 400px;
        max-width: 250px;
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        flex-wrap: wrap;
        width: 100%;
    }
</style>
