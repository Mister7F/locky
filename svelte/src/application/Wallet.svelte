<script>
    import Fab from '../helpers/Fab.svelte'
    import IconButton from '../helpers/IconButton.svelte'
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
            const folderIds = wallet['folders']
                .map((folder) => folder.id)
                .filter((folderId) => folderId !== 0)

            accounts = wallet['accounts'].filter((account) => {
                if (searchText.length) {
                    return (
                        account.name
                            .toLowerCase()
                            .indexOf(searchText.toLowerCase()) >= 0
                    )
                }
                if (currentFolderId === 'no_folder') {
                    return !folderIds.includes(account.folder_id)
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
    let openSearch = false

    // folders variable
    let walletWidth
    let foldersVisible = false
    $: floatingFolder = walletWidth < 870
    let snackbarText = ''
    let snackbarTimeout
    let folderDomIds = []
    $: {
        folderDomIds = []
        for (let folder of wallet['folders'] || []) {
            folderDomIds = folderDomIds.concat(['item_folder_' + folder.id])
        }
    }

    // Accounts audit
    $: auditVisible = currentFolderId === 'security'

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
        snackbarText = event.detail ? event.detail : event
        clearTimeout(snackbarTimeout)
        snackbarTimeout = setTimeout(() => {
            snackbarText = ''
        }, 1000)
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
    bind:viewMode
    on:show_folders={() => (foldersVisible = !foldersVisible)}
    bind:floatingFolder
    bind:searchText
    bind:openSearch
/>
<div class="wallet" bind:clientWidth={walletWidth}>
    <Folders
        bind:wallet
        bind:floating={floatingFolder}
        bind:visible={foldersVisible}
        bind:currentFolderId
        on:change={() => {
            searchText = ''
            openSearch = false
        }}
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
{#if snackbarText}
    <div class="notification">
        <span>{snackbarText}</span>
        <IconButton icon="close" on:click={() => (snackbarText = '')} />
    </div>
{/if}

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
        height: calc(100vh - 57px);
        display: flex;
        flex-direction: row;
        overflow: hidden;
    }

    .wallet :global(.accountsGrid) {
        width: 100%;
    }

    .notification {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;

        box-sizing: border-box;
        text-align: center;
        position: absolute;

        background-color: var(--primary);
        border-radius: 4px;
        left: 50%;
        transform: translateX(-50%);
        box-shadow:
            0 14px 28px rgba(0, 0, 0, 0.25),
            0 10px 10px rgba(0, 0, 0, 0.22);
        animation: notification 0.1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    .notification > span {
        margin-right: 15px;
        margin-left: 20px;

        color: var(--on-primary);
    }
    @keyframes notification {
        from {
            bottom: -20px;
        }
        to {
            bottom: 20px;
        }
    }
</style>
