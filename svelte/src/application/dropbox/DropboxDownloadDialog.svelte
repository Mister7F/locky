<script lang="ts">
    import Button from '../../helpers/Button.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import Icon from '../../helpers/Icon.svelte'
    import type Wallet from '../../models/wallet.ts'
    import dropbox from './dropbox.svelte.ts'

    interface Props {
        open?: boolean
        onwalletdownloaded: (wallet: Wallet) => void | Promise<void>
    }

    let { open = $bindable(false), onwalletdownloaded }: Props = $props()
    let fetching = $state(false)
    let error = $state('')

    async function fetchWallet() {
        fetching = true
        error = ''

        try {
            const wallet = await dropbox.replaceWalletFromDropbox()
            if (!wallet) {
                throw new Error('Could not fetch the wallet from Dropbox')
            }
            await onwalletdownloaded(wallet)
            open = false
        } catch (caughtError) {
            error =
                caughtError instanceof Error
                    ? caughtError.message
                    : 'Could not fetch the wallet from Dropbox'
        }

        fetching = false
    }

    $effect(() => {
        if (!open) {
            error = ''
        }
    })
</script>

<Dialog bind:open title="Fetch from Dropbox?" dismissible={!fetching}>
    This will overwrite the current wallet with the wallet stored on Dropbox.
    <br />
    Any local changes that have not been uploaded will be lost.
    {#if error}
        <p class="error">{error}</p>
    {/if}

    {#snippet actions()}
        <Button
            color="secondary"
            variant="outlined"
            onclick={() => (open = false)}
            disabled={fetching}
        >
            Cancel
        </Button>
        <Button color="primary" onclick={fetchWallet} disabled={fetching}>
            {#if fetching}
                <span class="loading"><Icon>sync</Icon></span>
            {:else}
                Fetch
            {/if}
        </Button>
    {/snippet}
</Dialog>

<style>
    .loading {
        display: flex;
        animation: rotating 1s linear infinite;
    }

    .error {
        color: var(--error);
    }

    @keyframes rotating {
        to {
            transform: rotate(-360deg);
        }
    }
</style>
