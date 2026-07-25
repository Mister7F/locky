<script lang="ts">
    import Dialog from '../../helpers/Dialog.svelte'
    import Button from '../../helpers/Button.svelte'
    import Field from '../../helpers/field/Field.svelte'
    import Switch from '../../helpers/Switch.svelte'
    import * as api from '../api.ts'
    import {
        createAlias,
        getAliasOptions,
        type AliasSuffix,
        type SimpleLoginMailbox,
    } from '../simplelogin/simplelogin.ts'

    type SelectableMailbox = SimpleLoginMailbox & {
        selected: boolean
    }

    let dialogOpen = $state(false)
    let loading = $state(false)
    let creating = $state(false)
    let prefix = $state('')
    let suffixes: AliasSuffix[] = $state([])
    let mailboxes: SelectableMailbox[] = $state([])
    let signedSuffix = $state('')
    let apiKey = $state('')
    let error = $state('')
    let onuse: (alias: string) => void

    export async function open(callback: (alias: string) => void) {
        onuse = callback
        dialogOpen = true
        loading = true
        error = ''
        prefix = ''
        suffixes = []
        mailboxes = []
        signedSuffix = ''
        apiKey = api.getSimpleLoginApiKey()

        if (!apiKey) {
            error = 'Set your SimpleLogin API key in Settings first'
            loading = false
            return
        }

        try {
            const options = await getAliasOptions(apiKey)
            suffixes = options.suffixes
            mailboxes = options.mailboxes.map((mailbox) => ({
                ...mailbox,
                selected: options.mailboxIds.includes(mailbox.id),
            }))
            signedSuffix = suffixes[0].signed_suffix
        } catch (requestError) {
            error =
                requestError instanceof Error
                    ? requestError.message
                    : 'Could not connect to SimpleLogin'
        }
        loading = false
    }

    async function onCreate() {
        const cleanPrefix = prefix.trim()
        const mailboxIds = mailboxes
            .filter((mailbox) => mailbox.selected)
            .map((mailbox) => mailbox.id)
        if (!cleanPrefix || !signedSuffix || !mailboxIds.length) {
            return
        }

        creating = true
        error = ''
        try {
            const alias = await createAlias(
                apiKey,
                cleanPrefix,
                signedSuffix,
                mailboxIds
            )
            dialogOpen = false
            onuse(alias)
        } catch (requestError) {
            error =
                requestError instanceof Error
                    ? requestError.message
                    : 'Could not create the SimpleLogin alias'
        }
        creating = false
    }
</script>

<Dialog bind:open={dialogOpen} title="Create a SimpleLogin alias">
    <div class="modal-content">
        {#if loading}
            <p>Loading SimpleLogin options…</p>
        {:else if suffixes.length}
            <div class="alias">
                <Field
                    label="Prefix"
                    copy={false}
                    bind:value={prefix}
                    onenter={onCreate}
                />
                <select bind:value={signedSuffix} aria-label="Alias suffix">
                    {#each suffixes as item}
                        <option value={item.signed_suffix}>{item.suffix}</option
                        >
                    {/each}
                </select>
            </div>
            <fieldset class="mailboxes">
                <legend>Mailboxes</legend>
                {#each mailboxes as mailbox}
                    <div class="mailbox-switch">
                        <Switch
                            label={mailbox.email}
                            bind:checked={mailbox.selected}
                        />
                    </div>
                {/each}
            </fieldset>
        {/if}

        {#if error}
            <p class="error">{error}</p>
        {/if}
    </div>

    {#snippet actions()}
        <Button
            onclick={() => (dialogOpen = false)}
            color="secondary"
            variant="outlined"
        >
            Cancel
        </Button>
        <Button
            onclick={onCreate}
            color="primary"
            disabled={loading ||
                creating ||
                !prefix.trim() ||
                !signedSuffix ||
                !mailboxes.some((mailbox) => mailbox.selected)}
        >
            Create
        </Button>
    {/snippet}
</Dialog>

<style>
    .modal-content {
        width: min(500px, 70vw);
        min-height: 250px;
    }

    .alias {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
    }

    .alias > :global(.field) {
        flex: 1;
    }

    select {
        max-width: 240px;
        padding: 10px;
        border: 1px solid var(--on-primary);
        border-radius: 4px;
        color: var(--on-primary);
        background-color: var(--primary);
    }

    .mailboxes {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 120px;
        margin-top: 12px;
        padding: 10px;
        overflow-y: auto;
        border: 1px solid var(--on-primary);
        border-radius: 4px;
        color: var(--on-primary);
        background-color: var(--primary);
    }

    .mailboxes legend {
        color: var(--on-primary);
    }

    .mailbox-switch {
        height: 24px;
    }

    .mailbox-switch :global(> div) {
        display: block;
        margin-bottom: 0;
    }

    p {
        color: var(--on-primary);
    }

    .error {
        color: var(--error);
    }
</style>
