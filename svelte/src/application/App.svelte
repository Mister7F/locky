<script>
    import * as api from './api.js'
    import * as dropbox from './dropbox/dropbox.js'
    import Login from './login/Login.svelte'
    import Wallet from './Wallet.svelte'
    import IconButton from '../helpers/IconButton.svelte'
    import WebExtension from '../helpers/WebExtension.svelte'
    import WebExtensionStore from '../helpers/web_extension.svelte.js'

    let locked = $state(true)
    let walletElement = $state(null)
    let wallet = $state(null)

    let searchText = $state('')

    async function lock() {
        await api.logout(true)
        locked = true

        WebExtensionStore.savePassword = ['', null]
    }

    let snackbarText = $state('')
    let snackbarTimeout
    function onnotify(text) {
        clearTimeout(snackbarTimeout)
        snackbarText = text
        snackbarTimeout = setTimeout(() => {
            snackbarText = ''
        }, 1000)
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            // await navigator.serviceWorker.register('sw.js')
        })
    } else {
        console.error('Service Worker will not work')
    }

    setTimeout(async () => {
        // Parse the URL to fetch the access token and store it in the local storage
        await dropbox.isAuthenticated()
    }, 500)
</script>

<WebExtension bind:wallet bind:searchText bind:locked {onnotify} />

<div class="root">
    {#if locked}
        <Login
            onwallet_openned={() => {
                locked = false
                WebExtensionStore.setSearch = wallet
            }}
            bind:wallet
        />
    {:else}
        <Wallet
            bind:wallet
            onlock={lock}
            bind:this={walletElement}
            bind:searchText
            {onnotify}
        />
    {/if}
</div>

<!-- Notifications -->
{#if snackbarText}
    <div class="notification">
        <span>{snackbarText}</span>
        <IconButton icon="close" onclick={() => (snackbarText = '')} />
    </div>
{/if}

<svelte:head>
    <style>
        @font-face {
            font-family: 'SF';
            font-style: normal;
            font-weight: 400;
            src: url('font/SF-Pro.ttf');
        }
    </style>
</svelte:head>

<style>
    :global(*) {
        --primary: #282c34;
        --on-primary: #dfe1e2;

        --secondary: #fc6d26;
        --on-secondary: #282c34;

        --surface: #edf0f2;
        --on-surface: #4a6572;

        /* Svelte MUI */
        --background: #fcfcfc;

        /* Other colors */
        --link-color: #1877f2;
        --error: #e53935;
        --wallet-background: #edf0f2;
        --account-background: #fff;

        color: #4a6572;

        transition-timing-function: ease;
        user-select: none;
        font-family: 'SF';
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
        font-size: 15px;
        height: 100%;
        width: 100vw;
        margin: 0;
        overflow: hidden;
        overflow-x: hidden;
        --scrollbar-color: var(--primary);
    }

    /* Scroll bar */
    :global(::-webkit-scrollbar) {
        width: 6px;
    }

    /* Track */
    :global(::-webkit-scrollbar-track) {
        display: none;
    }

    /* Handle */
    :global(::-webkit-scrollbar-thumb) {
        background: var(--scrollbar-color);
        cursor: pointer;
    }

    /* Handle on hover */
    :global(::-webkit-scrollbar-thumb:hover) {
        filter: brightness(90%);
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
