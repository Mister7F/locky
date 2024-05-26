<script>
    import Snackbar, { Actions, Label } from '@smui/snackbar'

    import Fab from '../helpers/Fab.svelte'
    import { createEventDispatcher } from 'svelte'
    import Audit from './Audit.svelte'
    import AccountCard from './AccountCard.svelte'
    import AccountEditor from './editor/AccountEditor.svelte'
    import * as api from './api.js'
    import Folders from './folders/Folders.svelte'
    import Icon from '../helpers/Icon.svelte'
    import Navbar from './navbar/Navbar.svelte'
    import Sidepanel from '../helpers/Sidepanel.svelte'
    import Sortablegrid from '../helpers/Sortablegrid.svelte'

    const dispatch = createEventDispatcher()
    export let wallet
    // accounts displayed in the UI
    // care about the search, the current directory, etc
    let accounts = []
    $: {
        accounts = []
        if (wallet && wallet['accounts']) {
            accounts = wallet['accounts'].filter((account) => {
                if (searchText.length) {
                    return (
                        account.name
                            .toLowerCase()
                            .indexOf(searchText.toLowerCase()) >= 0
                    )
                }
                return currentFolderId
                    ? account.folder_id === currentFolderId
                    : true
            })
        }
    }
    let currentFolderId = 0

    // Account edition
    let accountEdited = null
    let accountEditorReadonly = false
    let editedAccountIndex = null
    $: menuVisible = !!accountEdited

    let dragging
    let viewMode = window.localStorage.getItem('viewMode') || 'detail'
    let searchText = ''

    // folders variable
    let walletWidth
    let foldersVisible = false
    $: floatingFolder = walletWidth < 870
    let snackbar
    let snackbarText
    let folderDomIds = []
    $: {
        folderDomIds = []
        for (let folder of wallet['folders'] || []) {
            folderDomIds = folderDomIds.concat(['item_folder_' + folder.id])
        }
    }

    // Accounts audit
    $: auditVisible = currentFolderId < 0

    async function onMoveAccount(event) {
        const fromAccount = event.detail.fromItem
        const toAccount = event.detail.destItem
        wallet = await api.moveAccount(fromAccount, toAccount)
    }
    function editAccount(account) {
        editedAccountIndex = wallet['accounts'].indexOf(account)
        // Deep copy, to not change the account before saving
        accountEdited = JSON.parse(JSON.stringify(account))
        accountEditorReadonly = true
    }
    function onNewAccount() {
        editedAccountIndex = null
        accountEdited = { icon: 'img/accounts/default.svg' }
        accountEditorReadonly = false
    }
    async function onSaveAccount(event) {
        if (editedAccountIndex !== null) {
            wallet = await api.updateAccount(
                editedAccountIndex,
                event.detail.account
            )
        } else {
            const account = event.detail.account
            account['folder_id'] = currentFolderId
            wallet = await api.newAccount(account)
            // Edit this account to not create one for future "save" event
            editAccount(account)
        }
    }
    async function onRemoveAccount(event) {
        accountEdited = null
        if (editedAccountIndex !== null) {
            wallet = await api.removeAccount(editedAccountIndex)
            editedAccountIndex = null
        }
    }
    async function onAccountAction(event) {
        const actionElement = event.detail.action
        if (actionElement.id && actionElement.id.startsWith('item_folder_')) {
            const folderId = parseInt(actionElement.id.split('item_folder_')[1])
            wallet = await api.changeFolder(event.detail.item, folderId)
        }
    }
    function onNotify(event) {
        snackbar.close()
        snackbarText = event.detail ? event.detail : event
        snackbar.open(snackbarText)
    }
</script>

<Sidepanel bind:visible={menuVisible} on:close={() => (accountEdited = null)}>
    {#if accountEdited}
        <AccountEditor
            account={accountEdited}
            readonly={accountEditorReadonly}
            on:save={onSaveAccount}
            on:remove={onRemoveAccount}
            on:close={() => (accountEdited = null)}
        />
    {/if}
</Sidepanel>
<Navbar
    on:lock
    on:search={(event) => (searchText = event.detail || '')}
    bind:viewMode
    on:show_folders={() => (foldersVisible = !foldersVisible)}
    bind:floatingFolder
/>
<div class="wallet" bind:clientWidth={walletWidth}>
    <Folders
        bind:wallet
        bind:floating={floatingFolder}
        bind:visible={foldersVisible}
        bind:currentFolderId
    />
    {#if auditVisible}
        <Audit {wallet} on:edit={(event) => editAccount(event.detail)} />
    {:else}
        <Sortablegrid
            class="accountsGrid"
            on:move={onMoveAccount}
            on:action={onAccountAction}
            on:move_blocked={() =>
                onNotify('Can not move accounts in this folder')}
            bind:items={accounts}
            bind:dragging
            bind:customActions={folderDomIds}
        >
            <div slot="item" let:item>
                <AccountCard
                    account={item}
                    on:click={() => editAccount(item)}
                    bind:viewMode
                    on:notify={onNotify}
                />
            </div>
        </Sortablegrid>
        <Fab
            class="new_account {dragging ? '' : 'visible'}"
            on:click={onNewAccount}
            icon="add"
            color="on-secondary"
        />
    {/if}
</div>

<!-- Notifications -->
<Snackbar bind:this={snackbar} bind:labelText={snackbarText}>
    <Label />
</Snackbar>

<style>
    :global(.new_account) {
        position: absolute;
        bottom: -65px;
        right: -65px;
        transition: all 0.5s cubic-bezier(0.47, 1.64, 0.41, 0.8);
    }

    :global(.new_account.visible) {
        bottom: 40px;
        right: 20px;
    }

    :global(.new_account:active) {
        transform: rotate(-90deg);
    }

    /* Folder list */
    .wallet {
        position: initial !important;
        background-color: var(--wallet-background);
        box-sizing: border-box;
        overflow-y: scroll;
        height: calc(100vh - 65px);
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    .wallet :global(.accountsGrid) {
        width: 100%;
    }
</style>
