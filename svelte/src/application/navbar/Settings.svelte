<script lang="ts">
    import Button from '../../helpers/Button.svelte'
    import IconButton from '../../helpers/IconButton.svelte'
    import Sidepanel from '../../helpers/Sidepanel.svelte'
    import ChangePassword from './ChangePassword.svelte'
    import * as dropbox from './../dropbox/dropbox.ts'
    import * as api from '../api.ts'
    import Field from '../../helpers/field/Field.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import {
        getAliases,
        getMailboxes,
        toggleAlias,
        trashAlias,
        type SimpleLoginAlias,
        type SimpleLoginMailbox,
    } from '../simplelogin/simplelogin.ts'
    import { untrack } from 'svelte'

    interface Props {
        visible?: boolean
        onlock: () => any
        isDropboxAuthenticated: boolean
    }

    let {
        onlock,
        isDropboxAuthenticated = $bindable(false),
        visible = $bindable(true),
    }: Props = $props()

    let changePasswordDialog: ChangePassword = $state()
    let simpleLoginApiKey = $state(api.getSimpleLoginApiKey())
    let simpleLoginAliases: SimpleLoginAlias[] = $state([])
    let simpleLoginMailboxes: SimpleLoginMailbox[] = $state([])
    let aliasesByMailbox = $derived(
        simpleLoginMailboxes
            .map((mailbox) => ({
                mailbox,
                aliases: simpleLoginAliases.filter((alias) =>
                    alias.mailboxes.some((item) => item.id === mailbox.id)
                ),
            }))
            .filter((group) => group.aliases.length)
    )
    let simpleLoginError = $state('')
    let loadingSimpleLoginAliases = $state(false)
    let aliasToTrash: SimpleLoginAlias | undefined = $state()
    let trashDialogOpen = $state(false)

    $effect(() => {
        if (visible) {
            untrack(() => loadSimpleLoginAliases())
        }
    })

    async function onDropboxClick() {
        if (isDropboxAuthenticated) {
            dropbox.logout()
            isDropboxAuthenticated = false
        } else {
            document.location = await dropbox.getAuthenticationUrl()
        }
    }

    async function saveSimpleLoginApiKey() {
        simpleLoginApiKey = simpleLoginApiKey.trim()
        await api.setSimpleLoginApiKey(simpleLoginApiKey)
        await loadSimpleLoginAliases()
    }

    async function loadSimpleLoginAliases() {
        simpleLoginAliases = []
        simpleLoginMailboxes = []
        simpleLoginError = ''
        if (!simpleLoginApiKey) {
            return
        }

        loadingSimpleLoginAliases = true
        try {
            const [aliases, mailboxes] = await Promise.all([
                getAliases(simpleLoginApiKey),
                getMailboxes(simpleLoginApiKey),
            ])
            simpleLoginAliases = aliases
            simpleLoginMailboxes = mailboxes
        } catch (error) {
            simpleLoginError =
                error instanceof Error
                    ? error.message
                    : 'Could not load SimpleLogin aliases'
        }
        loadingSimpleLoginAliases = false
    }

    async function onToggleAlias(alias: SimpleLoginAlias) {
        simpleLoginError = ''
        try {
            alias.enabled = await toggleAlias(simpleLoginApiKey, alias.id)
            simpleLoginAliases = [...simpleLoginAliases]
        } catch (error) {
            simpleLoginError =
                error instanceof Error
                    ? error.message
                    : 'Could not update the SimpleLogin alias'
        }
    }

    function confirmTrash(alias: SimpleLoginAlias) {
        aliasToTrash = alias
        trashDialogOpen = true
    }

    async function onTrashAlias() {
        if (!aliasToTrash) {
            return
        }

        simpleLoginError = ''
        try {
            await trashAlias(simpleLoginApiKey, aliasToTrash.id)
            simpleLoginAliases = simpleLoginAliases.filter(
                (alias) => alias.id !== aliasToTrash?.id
            )
            trashDialogOpen = false
            aliasToTrash = undefined
        } catch (error) {
            simpleLoginError =
                error instanceof Error
                    ? error.message
                    : 'Could not move the SimpleLogin alias to trash'
            trashDialogOpen = false
        }
    }
</script>

<Sidepanel bind:visible>
    <ChangePassword bind:this={changePasswordDialog} />
    <IconButton
        class="settings_page_close_button"
        icon="close"
        onclick={() => (visible = false)}
    />
    <div class="container">
        <h1>Settings</h1>
        <div class="section">
            <Button
                color="secondary"
                variant="outlined"
                icon="logout"
                onclick={onlock}
            >
                Logout
            </Button>
            <Button
                color="secondary"
                variant="outlined"
                icon="password"
                onclick={() => changePasswordDialog.open()}
            >
                Change your password
            </Button>
            <Button
                color="secondary"
                variant="outlined"
                onclick={onDropboxClick}
            >
                <svg viewBox="0 0 56.693 56.693" width="56.693px">
                    <polygon
                        points="3.535,33.956 18.132,43.481 28.347,34.962 13.628,25.878 "
                    ></polygon>
                    <polygon
                        points="18.132,8.275 3.535,17.796 13.628,25.878 28.347,16.793 "
                    ></polygon>
                    <polygon
                        points="53.158,17.796 38.561,8.275 28.347,16.793 43.064,25.878 "
                    ></polygon>
                    <polygon
                        points="28.347,34.962 38.561,43.481 53.158,33.956 43.064,25.878 "
                    ></polygon>
                    <polygon
                        points="28.377,36.794 18.132,45.29 13.748,42.427 13.748,45.638
                        28.377,54.405 43.005,45.638 43.005,42.427 38.621,45.29 "
                    ></polygon>
                </svg>
                Dropbox {isDropboxAuthenticated ? 'logout' : 'login'}
            </Button>
        </div>

        <div class="section simplelogin">
            <h2>SimpleLogin</h2>
            <Field
                label="API key"
                type="password"
                copy={false}
                bind:value={simpleLoginApiKey}
            />
            <Button
                color="secondary"
                variant="outlined"
                icon="save"
                onclick={saveSimpleLoginApiKey}
            >
                Save API key
            </Button>

            {#if loadingSimpleLoginAliases}
                <p>Loading aliases…</p>
            {:else if simpleLoginAliases.length}
                <div class="mailbox-groups">
                    {#each aliasesByMailbox as group}
                        <section class="mailbox-group">
                            <h3>{group.mailbox.email}</h3>
                            <div class="aliases">
                                {#each group.aliases as alias}
                                    <div
                                        class:disabled={!alias.enabled}
                                        class="alias"
                                    >
                                        <span title={alias.email}
                                            >{alias.email}</span
                                        >
                                        <div class="alias-actions">
                                            <IconButton
                                                title={alias.enabled
                                                    ? 'Disable alias'
                                                    : 'Enable alias'}
                                                icon={alias.enabled
                                                    ? 'block'
                                                    : 'check_circle'}
                                                onclick={() =>
                                                    onToggleAlias(alias)}
                                            />
                                            <IconButton
                                                title="Move alias to trash"
                                                icon="delete"
                                                onclick={() =>
                                                    confirmTrash(alias)}
                                            />
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </section>
                    {/each}
                </div>
            {:else if simpleLoginApiKey && !simpleLoginError}
                <p>No aliases</p>
            {/if}

            {#if simpleLoginError}
                <p class="error">{simpleLoginError}</p>
            {/if}
        </div>
    </div>
</Sidepanel>

<Dialog bind:open={trashDialogOpen} title="Move alias to trash?">
    {aliasToTrash?.email}

    {#snippet actions()}
        <Button
            color="secondary"
            variant="outlined"
            onclick={() => (trashDialogOpen = false)}
        >
            Cancel
        </Button>
        <Button color="primary" onclick={onTrashAlias}>Move to trash</Button>
    {/snippet}
</Dialog>

<style>
    .container {
        color: var(--on-primary);
        background-color: var(--primary);
        margin: 0;
        width: 100%;
        height: 100%;
        text-align: center;
        padding: 20px 0;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow-y: auto;
    }
    h1 {
        margin-top: 0;
        color: var(--on-primary);
    }
    h2 {
        margin: 0 0 4px;
        color: var(--on-primary);
    }
    svg {
        height: 25px;
        width: 25px;
        margin-right: 5px;
        fill: var(--secondary);
    }
    .section {
        display: flex;
        flex-direction: column;
        gap: 16px;
        width: 90%;
        max-width: 350px;
        margin-bottom: 28px;
    }

    .section > :global(*) {
        width: 100%;
    }

    .simplelogin {
        padding-top: 24px;
        border-top: 1px solid
            color-mix(in srgb, var(--on-primary) 18%, transparent);
    }

    .simplelogin p {
        margin: 0;
        color: var(--on-primary);
    }

    .mailbox-groups,
    .mailbox-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
    }

    .mailbox-groups {
        gap: 16px;
    }

    .mailbox-group h3 {
        margin: 0;
        overflow: hidden;
        color: var(--on-primary);
        font-size: 14px;
        font-weight: 500;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .aliases {
        overflow: hidden;
        border: 1px solid var(--on-primary);
        border-radius: 4px;
        color: var(--on-primary);
        background-color: var(--primary);
    }

    .alias {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 0;
        padding-left: 8px;
        border-bottom: 1px solid
            color-mix(in srgb, var(--on-primary) 12%, transparent);
    }

    .alias:last-child {
        border-bottom: 0;
    }

    .alias > span {
        overflow: hidden;
        color: var(--on-primary);
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .alias.disabled > span {
        text-decoration: line-through;
    }

    .alias-actions {
        display: flex;
        flex: none;
    }

    .simplelogin p.error {
        color: var(--error);
    }

    :global(.settings_page_close_button) {
        position: absolute;
        top: 10px;
        right: 25px;
    }
</style>
