<script>
    import Button from '../../helpers/Button.svelte'
    import * as dropbox from './dropbox.js'
    import { openUrl } from '../../helpers/utils.js'

    let { state = $bindable(), logout } = $props()

    let filedata = null
    let authenticationUrl = null

    async function onLogin() {
        dropbox.logout()
        openUrl(authenticationUrl)
    }

    async function onLogout() {
        dropbox.logout()
        state = 'not_logged'
        onlogout()
    }

    $effect(async () => {
        let isAuthenticated = await dropbox.isAuthenticated()
        state = isAuthenticated ? 'logged' : 'not_logged'
        authenticationUrl = await dropbox.getAuthenticationUrl()
        if (isAuthenticated) {
            try {
                const walletExist = await dropbox.fileExist('wallet.lck')
                if (!walletExist) {
                    state = 'no_wallet'
                    return
                }
            } catch {
                state = 'not_logged'
                return
            }
        }
    })
</script>

<div class="dropbox_login">
    {#if state === 'logged' || state === 'no_wallet'}
        <Button
            color="secondary"
            variant="outlined"
            onclick={onLogout}
            icon="logout"
        >
            Logout
        </Button>
    {/if}

    {#if state === 'no_wallet'}<span class="error">No wallet found</span>{/if}

    {#if state === 'not_logged'}
        <Button color="secondary" variant="outlined" onclick={onLogin}>
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
            Login
        </Button>
    {/if}
</div>

<style>
    .dropbox_login {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        width: 100%;
    }
    .dropbox_login > :global(button) {
        width: 100%;
    }
    svg {
        height: 25px;
        width: 25px;
        margin-right: 5px;
        fill: var(--secondary);
    }
    .error {
        margin-left: 10px;
        text-align: center;
        color: var(--error);
    }
</style>
