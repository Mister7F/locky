<script>
    import IconButton, { Icon } from '@smui/icon-button';
    import Button, { Label } from '@smui/button';
    import { createEventDispatcher } from 'svelte';
    import * as dropbox from './dropbox.js';
    import * as api from '../api.js';
    import { onMount } from 'svelte';

    export let isAuthenticated = false;
    let authenticationUrl = null;
    let uploadingState = 'wait';

    $: title = isAuthenticated ? 'Upload your wallet on Dropbox' : 'Login';

    function onLogin() {
        document.location = authenticationUrl;
    }

    async function onUpload() {
        uploadingState = 'uploading';
        const encryptedWallet = await api.getEncryptedWallet();
        const ok = await dropbox.upload('wallet.lck', encryptedWallet);
        if (!ok) {
            isAuthenticated = false;
        }
        uploadingState = ok ? 'wait' : 'error';
    }

    onMount(async () => {
        isAuthenticated = dropbox.isAuthenticated();
        authenticationUrl = await dropbox.getAuthenticationUrl();
    });

</script>

<div class="container">
    <IconButton
        on:click="{() => (isAuthenticated ? onUpload() : onLogin())}"
        title="{title}">
        <div class="connected {isAuthenticated ? '' : 'red'}"></div>
        {#if uploadingState === 'wait'}
            <svg viewBox="0 7 57 57" width="57px">
                <polygon
                    points="3.535,33.956 18.132,43.481 28.347,34.962 13.628,25.878 "></polygon>
                <polygon
                    points="18.132,8.275 3.535,17.796 13.628,25.878 28.347,16.793 "></polygon>
                <polygon
                    points="53.158,17.796 38.561,8.275 28.347,16.793 43.064,25.878 "></polygon>
                <polygon
                    points="28.347,34.962 38.561,43.481 53.158,33.956 43.064,25.878 "></polygon>
                <polygon
                    points="28.377,36.794 18.132,45.29 13.748,42.427 13.748,45.638
                    28.377,54.405 43.005,45.638 43.005,42.427 38.621,45.29 "></polygon>
            </svg>
        {:else if uploadingState === 'uploading'}
            <Icon class="material-icons dropbox-uploading">sync</Icon>
        {:else}
            <Icon class="material-icons">sync_problem</Icon>
        {/if}
    </IconButton>
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

</style>
