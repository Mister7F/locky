<script lang="ts">
    import Fab from '../helpers/Fab.svelte'
    import Audit from './Audit.svelte'
    import AccountCard from './AccountCard.svelte'
    import AccountEditor from './editor/AccountEditor.svelte'
    import * as api from './api.ts'
    import { cleanSearchValue } from '../helpers/utils.ts'
    import Folders from './folders/Folders.svelte'
    import Navbar from './navbar/Navbar.svelte'
    import Sidepanel from '../helpers/Sidepanel.svelte'
    import Sortablegrid from '../helpers/Sortablegrid.svelte'
    import Account from '../models/account.ts'

    import Wallet from '../models/wallet.ts'

    interface Props {
        wallet?: Wallet
        searchText?: string
        onlock: () => void
        onnotify: (message: string) => void
    }

    let {
        wallet = $bindable(),
        searchText = $bindable(''),
        onlock,
        onnotify,
    }: Props = $props()

    // accounts displayed in the UI
    // care about the search, the current directory, etc
    let accounts = $derived.by(() => {
        let ret = []
        if (wallet && wallet.accounts) {
            const folderIds = wallet.folders.map((folder) => folder.id)

            ret = wallet.accounts.filter((account) => {
                if (searchText.length) {
                    return [account.name, account.url].some((value: string) => {
                        return (
                            cleanSearchValue(value).indexOf(
                                cleanSearchValue(searchText)
                            ) >= 0
                        )
                    })
                }
                if (currentFolderId === 'no_folder') {
                    return !folderIds.includes(account.folder_id)
                }
                return currentFolderId
                    ? account.folder_id === currentFolderId
                    : true
            })
        }
        return ret
    })
    let currentFolderId = $state<string>('')

    // Account edition
    let accountEdited: Account | undefined = $state()
    let accountEditorReadonly = $state(false)
    let editedAccountIndex = $state(null)

    let dragging = $state(false)
    let viewMode = $state(window.localStorage.getItem('viewMode') || 'detail')
    let openSearch = $state(false)

    // folders variable
    let walletWidth = $state(null)
    let foldersVisible = $state(false)
    let floatingFolder = $derived(walletWidth < 870)
    let folderDomIds = $derived.by(() => {
        let ret = []
        for (let folder of wallet['folders'] || []) {
            ret = ret.concat(['item_folder_' + folder.id])
        }
        return ret
    })
    // Accounts audit
    let auditVisible = $derived(currentFolderId === 'security')

    async function onMoveAccount(event: {
        from: number
        to: number
        fromItem: Account
        destItem: Account
    }) {
        // from / to are the index on the filtered array (based on search)
        wallet = await api.moveAccount(event.fromItem, event.destItem)
    }
    function editAccount(account: Account) {
        editedAccountIndex = wallet.accounts.findIndex(
            (a) => a.id === account.id
        )
        // Deep copy, to not change the account before saving
        accountEdited = Account.fromJson(JSON.parse(JSON.stringify(account)))
        accountEditorReadonly = true
    }
    function onNewAccount() {
        editedAccountIndex = null
        accountEdited = Account.fromJson({ icon: 'img/accounts/default.svg' })

        accountEditorReadonly = false
    }
    async function onSaveAccount(account: Account) {
        if (editedAccountIndex !== null) {
            wallet = await api.updateAccount(account)
        } else {
            account['folder_id'] = currentFolderId
            wallet = await api.newAccount(account)
            // Edit this account to not create one for future "save" event
            editAccount(account)
        }
    }
    async function onRemoveAccount() {
        accountEdited = undefined
        if (editedAccountIndex !== null) {
            wallet = await api.removeAccount(editedAccountIndex)
            editedAccountIndex = null
        }
    }
    async function onAccountAction(event: {
        action: HTMLElement
        item: Account
    }) {
        const actionElement = event.action
        if (actionElement.id && actionElement.id.startsWith('item_folder_')) {
            const folderId = actionElement.id.split('item_folder_')[1]
            wallet = await api.changeFolder(event.item, folderId)
        } else {
            console.error(`Wrong action ${event.action}.`)
        }
    }
</script>

<Sidepanel
    visible={!!accountEdited}
    onclose={() => (accountEdited = undefined)}
>
    {#if accountEdited}
        <AccountEditor
            account={accountEdited}
            readonly={accountEditorReadonly}
            onsave={onSaveAccount}
            onremove={onRemoveAccount}
            onclose={() => (accountEdited = undefined)}
        />
    {/if}
</Sidepanel>
<Navbar
    {onlock}
    onshow_folders={() => (foldersVisible = !foldersVisible)}
    {floatingFolder}
    bind:viewMode
    bind:searchText
    {openSearch}
/>

<div class="wallet" bind:clientWidth={walletWidth}>
    <Folders
        bind:wallet
        floating={floatingFolder}
        bind:visible={foldersVisible}
        bind:currentFolderId
        onchange={() => {
            searchText = ''
            openSearch = false
        }}
    />
    {#if auditVisible}
        <Audit {wallet} onedit={(account) => editAccount(account)} />
    {:else}
        <Sortablegrid
            class="accountsGrid"
            onmove={onMoveAccount}
            onaction={onAccountAction}
            onmove_blocked={() =>
                onnotify('Can not move accounts in this folder')}
            items={accounts}
            bind:dragging
            customActions={folderDomIds}
        >
            {#snippet card(item)}
                <AccountCard
                    account={item}
                    onclick={() => editAccount(item)}
                    {viewMode}
                    {onnotify}
                />
            {/snippet}
        </Sortablegrid>
        <Fab
            class="new_account {dragging ? '' : 'visible'}"
            onclick={onNewAccount}
            icon="add"
            color="on-secondary"
        />
    {/if}
</div>

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
</style>
