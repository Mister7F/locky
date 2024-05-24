<script>
    import IconButton, { Icon } from '@smui/icon-button'
    import Button, { Label } from '@smui/button'
    import Dialog, { Title, Content, Actions } from '@smui/dialog'
    import { createEventDispatcher } from 'svelte'
    import * as dropbox from './dropbox.js'
    import * as api from '../api.js'
    import { onMount } from 'svelte'

    export let isAuthenticated = false
    let authenticationUrl = null
    let uploadingState = 'wait'
    let confirmationDialog
    let downloadWalletDialog

    $: title = isAuthenticated ? 'Upload your wallet on Dropbox' : 'Login'

    function onLogin() {
        document.location = authenticationUrl
    }

    async function onUpload() {
        uploadingState = 'uploading'
        if (await shouldAskConfirmation()) {
            confirmationDialog.open()
            uploadingState = 'wait'
            return
        }
        await uploadWallet()
    }

    async function uploadWallet() {
        uploadingState = 'uploading'
        confirmationDialog.close()

        const encryptedWallet = await api.getEncryptedWallet()
        const ok = await dropbox.upload('wallet.lck', encryptedWallet)
        if (!ok) {
            isAuthenticated = false
        }
        uploadingState = ok ? 'wait' : 'error'
    }

    async function downloadWallet() {
        await api.logout(false)
        document.cookie = 'login_method=dropbox'
        document.location.reload()
    }

    async function shouldAskConfirmation() {
        const lastHash = dropbox.getDropboxHash()
        if (!lastHash || !lastHash.length) {
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
            const dropboxFile = await dropbox.fileExist('wallet.lck')
            return dropboxFile && dropboxFile.content_hash
        } catch {}
        isAuthenticated = false
        return null
    }

    onMount(async () => {
        isAuthenticated = await dropbox.isAuthenticated()
        authenticationUrl = await dropbox.getAuthenticationUrl()

        if (isAuthenticated) {
            const currentRemoteHash = await getDropboxRemoteHash()
            const localHash = dropbox.getDropboxHash()

            if (
                currentRemoteHash &&
                currentRemoteHash.length &&
                currentRemoteHash !== localHash
            ) {
                downloadWalletDialog.open()
            }
        }
    })
</script>

<div class="container">
    <IconButton
        on:click={() => (isAuthenticated ? onUpload() : onLogin())}
        {title}
    >
        <div class="connected {isAuthenticated ? '' : 'red'}"></div>
        {#if uploadingState === 'wait'}
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
        {:else if uploadingState === 'uploading'}
            <Icon class="material-icons dropbox-uploading">sync</Icon>
        {:else}
            <Icon class="material-icons">sync_problem</Icon>
        {/if}
    </IconButton>
    <Dialog bind:this={confirmationDialog}>
        <Title>Are you sure ?</Title>
        <Content>
            The file on Dropbox has changes you do not have locally, are you
            sure you want to upload your local changes and overwrite the current
            wallet on Dropbox ?
        </Content>
        <Actions>
            <Button
                on:click={() => confirmationDialog.close()}
                color="secondary"
                variant="raised"
            >
                No
            </Button>
            <Button
                on:click={() => {
                    confirmationDialog.close()
                    uploadWallet()
                }}
                color="primary"
            >
                Yes
            </Button>
        </Actions>
    </Dialog>
    <Dialog bind:this={downloadWalletDialog}>
        <Title>New wallet available</Title>
        <Content>
            The file on Dropbox has changes you do not have locally, do you want
            to download the wallet on Dropbox and overwrite this one ?
        </Content>
        <Actions>
            <Button
                on:click={() => downloadWalletDialog.close()}
                color="secondary"
                variant="raised"
            >
                No
            </Button>
            <Button
                on:click={async () => {
                    downloadWalletDialog.close()
                    await downloadWallet()
                }}
                color="primary"
            >
                Yes
            </Button>
        </Actions>
    </Dialog>
</div>

<style>
    .container {
    }
    svg {
        height: 25px;
        width: 25px;
        margin-right: 5px;
        fill: var(--on-primary);
    }
    .connected {
        position: absolute;
        right: 10px;
        bottom: 10px;
        background: lightgreen;
        width: 5px;
        height: 5px;
        border-radius: 2px;
    }
    .connected.red {
        background: red;
    }

    .container :global(button) {
        color: var(--on-primary);
    }
    .container :global(.dropbox-upload) {
        min-width: 40px;
    }
    .container :global(.material-icons) {
        margin: 0;
    }

    @-webkit-keyframes rotating {
        from {
            -webkit-transform: rotate(0deg);
        }
        to {
            -webkit-transform: rotate(-360deg);
        }
    }

    .container :global(.dropbox-uploading) {
        -webkit-animation: rotating 2s linear infinite;
    }

    .container :global(.mdc-dialog__surface) {
        max-width: 400px !important;
    }

    .container :global(.mdc-dialog__surface .mdc-dialog__button) {
        color: var(--primary);
    }
</style>
