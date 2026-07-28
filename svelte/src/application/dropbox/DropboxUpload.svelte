<script lang="ts">
    import Icon from '../../helpers/Icon.svelte'
    import IconButton from '../../helpers/IconButton.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import Button from '../../helpers/Button.svelte'
    import DropboxDownloadDialog from './DropboxDownloadDialog.svelte'

    import dropbox from './dropbox.svelte.ts'
    import * as api from '../api.ts'
    import { onMount } from 'svelte'
    import type Wallet from '../../models/wallet.ts'

    interface Props {
        onwalletdownloaded?: (wallet: Wallet) => void
    }

    let { onwalletdownloaded = () => {} }: Props = $props()

    type DropboxUploadState = 'wait' | 'uploading' | 'error'

    let uploadingState = $state<DropboxUploadState>('wait')
    let confirmationDialogOpen = $state(false)
    let downloadWalletDialogOpen = $state(false)

    let title = $derived(
        dropbox.authenticated ? 'Upload your wallet on Dropbox' : 'Login'
    )

    async function onLogin() {
        await dropbox.login()
        await checkForRemoteWallet()
    }

    async function onUpload() {
        uploadingState = 'uploading'
        if (await shouldAskConfirmation()) {
            confirmationDialogOpen = true
            uploadingState = 'wait'
            return
        }
        await uploadWallet()
    }

    async function uploadWallet(overwrite: boolean = false) {
        uploadingState = 'uploading'
        confirmationDialogOpen = false

        const encryptedWallet = await api.getEncryptedWallet()
        if (!encryptedWallet?.byteLength) {
            uploadingState = 'error'
            return
        }
        const ok = await dropbox.uploadWallet(encryptedWallet, overwrite)
        uploadingState = ok ? 'wait' : 'error'
    }

    async function shouldAskConfirmation() {
        const lastHash = dropbox.getDropboxHash()
        if (!lastHash) {
            return true
        }

        const currentRemoteHash = await getDropboxRemoteHash()
        if (currentRemoteHash && currentRemoteHash !== lastHash) {
            return true
        }
        return false
    }

    async function getDropboxRemoteHash() {
        try {
            return await dropbox.getRemoteWalletHash()
        } catch {}
        dropbox.authenticated = false
        return
    }

    async function checkForRemoteWallet() {
        if (!dropbox.authenticated) return

        const currentRemoteHash = await getDropboxRemoteHash()
        if (
            currentRemoteHash &&
            currentRemoteHash !== dropbox.getDropboxHash()
        ) {
            downloadWalletDialogOpen = true
        }
    }

    onMount(async () => {
        await dropbox.refresh()
        await checkForRemoteWallet()
    })
</script>

<div class="container">
    <IconButton
        onclick={() => (dropbox.authenticated ? onUpload() : onLogin())}
        {title}
    >
        {#if uploadingState === 'uploading'}
            <span class="loading"><Icon>sync</Icon></span>
        {:else if uploadingState === 'wait'}
            <svg viewBox="0 7 57 57" width="57px">
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
        {:else}
            <Icon>sync_problem</Icon>
        {/if}
        <div class="connected {dropbox.authenticated ? '' : 'red'}"></div>
    </IconButton>
    <Dialog bind:open={confirmationDialogOpen} title="Are you sure ?">
        The file on Dropbox has changes you do not have locally.
        <br />
        Are you sure you want to upload your local changes and <b>overwrite</b>
        the remote?

        {#snippet actions()}
            <Button
                onclick={() => (confirmationDialogOpen = false)}
                color="secondary"
                variant="outlined"
            >
                No
            </Button>
            <Button onclick={() => uploadWallet(true)} color="danger">
                Yes
            </Button>
        {/snippet}
    </Dialog>
    <DropboxDownloadDialog
        bind:open={downloadWalletDialogOpen}
        {onwalletdownloaded}
    />
</div>

<style>
    .container {
        display: flex;
        justify-items: center;
        align-content: center;
    }
    svg {
        height: 25px;
        width: 25px;
        fill: var(--on-primary);
    }
    .connected {
        position: absolute;
        margin-left: 25px;
        margin-top: 25px;
        background: lightgreen;
        width: 5px;
        height: 5px;
        border-radius: 2px;
    }
    .connected.red {
        background: red;
    }

    @keyframes rotating {
        to {
            transform: rotate(-360deg);
        }
    }

    .loading {
        display: flex;
        animation: rotating 2s linear infinite;
    }
</style>
