<script>
    import * as api from './api.js';
    import * as dropbox from './dropbox/dropbox.js';
    import Login from './login/Login.svelte';
    import Wallet from './Wallet.svelte';

    let locked = true;
    let walletElement;
    let wallet = null;

    async function lock() {
        await api.logout(true);
        locked = true;
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            await navigator.serviceWorker.register('sw.js');
        });
    } else {
        console.error('Service Worker will not work');
    }

    setTimeout(async () => {
        // Parse the URL to fetch the access token and store it in the local storage
        await dropbox.isAuthenticated();
    }, 500);

</script>

<div class="root">
    {#if locked}
        <Login on:wallet_openned="{() => (locked = false)}" bind:wallet />
    {:else}
        <Wallet bind:wallet on:lock="{lock}" bind:this="{walletElement}" />
    {/if}
</div>

<style>
    @font-face {
        font-family: 'Open Sans';
        font-style: normal;
        font-weight: 400;
        src: url('font/OpenSans-Regular.ttf');
    }
    :global(*) {
        /* Svelte MUI */
        --background: #fcfcfc;

        /* Other colors */
        --link-color: #1877f2;
        --error-color: #e53935;
        --wallet-background: #edf0f2;
        --account-background: #fff;

        transition-timing-function: ease;
        user-select: none;
    }

    :global(html),
    :global(body) {
        margin: 0;
        padding: 0;
        overflow: hidden;
    }

    .root {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        font-family: 'Open Sans';
        font-size: 15px;
        height: 100%;
        width: 100vw;
        margin: 0;
        overflow: hidden;
        overflow-x: hidden;
    }

    /* Scroll bar */
    :global(::-webkit-scrollbar) {
        width: 6px;
    }

    /* Track */
    :global(::-webkit-scrollbar-track) {
    }

    /* Handle */
    :global(::-webkit-scrollbar-thumb) {
        background: var(--primary);
    }

    /* Handle on hover */
    :global(::-webkit-scrollbar-thumb:hover) {
        background: var(--primary);
    }

</style>
