<script>
    import Button from '../../helpers/Button.svelte'
    import IconButton from '../../helpers/IconButton.svelte'
    import Sidepanel from '../../helpers/Sidepanel.svelte'
    import ChangePassword from './ChangePassword.svelte'
    import * as dropbox from './../dropbox/dropbox.js'

    let { onlock, isDropboxAuthenticated, visible = $bindable(true) } = $props()

    let changePasswordDialog = $state()

    async function onDropboxClick() {
        if (isDropboxAuthenticated) {
            dropbox.logout()
            isDropboxAuthenticated = false
        } else {
            document.location = await dropbox.getAuthenticationUrl()
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
        <Button color="secondary" variant="outlined" onclick={onDropboxClick}>
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
            {isDropboxAuthenticated ? 'Logout' : 'Login'}
        </Button>
    </div>
</Sidepanel>

<style>
    .container {
        color: var(--on-primary);
        background-color: var(--primary);
        margin: 0;
        width: 100%;
        height: 100%;
        text-align: center;
        padding-top: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    h1 {
        margin-top: 0;
        color: var(--on-primary);
    }
    svg {
        height: 25px;
        width: 25px;
        margin-right: 5px;
        fill: var(--secondary);
    }
    .container > :global(*) {
        margin-bottom: 20px !important;
        width: 70%;
    }

    :global(.settings_page_close_button) {
        position: absolute;
        top: 10px;
        right: 25px;
    }
</style>
