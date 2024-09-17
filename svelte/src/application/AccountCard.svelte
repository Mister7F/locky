<script>
    import IconButton from '../helpers/IconButton.svelte'
    import { createRipple } from '../helpers/ripple.js'
    import Img from '../helpers/Img.svelte'
    import { getTotpCode, passwordStrength } from '../helpers/crypto.js'
    import { isUrlValid, copyValue, fromHex } from '../helpers/utils.js'
    import { encryptAES } from '../helpers/crypto.js'
    import { sendCredentials } from '../helpers/web_extension.js'

    let { account, viewMode = 'list', onclick, onnotify } = $props()

    const strength = passwordStrength(account.password)
</script>

{#if viewMode === 'minimalist'}
    <div class="account" {onclick}>
        <div class="card">
            <div class="row">
                <div class="image">
                    <Img
                        src={account.icon || 'img/accounts/default.svg'}
                        alt="Account"
                    />
                </div>
                <h5>{account.name}</h5>
            </div>
        </div>
        <div class="strength" style="--force: {strength}"></div>
    </div>
{:else if viewMode === 'detail'}
    <div class="detail-card">
        <div>
            {#if strength !== 0}
                <div class="strength" style="--force: {strength}"></div>
            {/if}
            <div
                class="detail_main_action ripple ripple_dark ripple_fast"
                {onclick}
                onmousedown={(event) => createRipple(event)}
            >
                <div class="detail_img">
                    <Img
                        src={account.icon || 'img/accounts/default.svg'}
                        alt="Account"
                    />
                </div>
                <div class="detail_title">
                    <div class="detail_name">{account.name}</div>
                    <div class="detail_login">{account.login}</div>
                </div>
            </div>
            <div class="detail_account_actions">
                <div>
                    {#if account.url && isUrlValid(account.url)}
                        <IconButton
                            title="Open URL"
                            href={account.url}
                            icon="launch"
                            color="on-surface"
                            bgTransparent="1"
                        />
                    {/if}
                </div>
                <div>
                    {#if account.login}
                        <IconButton
                            onclick={() => {
                                onnotify('Login copied')
                                copyValue(account.login)
                            }}
                            title="Login"
                            icon="alternate_email"
                            color="on-surface"
                            bgTransparent="1"
                        />
                    {/if}
                    {#if account.password}
                        <IconButton
                            onclick={() => {
                                onnotify('Password copied')
                                copyValue(account.password)
                            }}
                            icon="vpn_key"
                            title="Password"
                            color="on-surface"
                            bgTransparent="1"
                        />
                    {/if}
                    {#if account.totp}
                        <IconButton
                            onclick={async () => {
                                onnotify('2FA copied')
                                copyValue(
                                    (await getTotpCode(account.totp)).replace(
                                        ' ',
                                        ''
                                    )
                                )
                            }}
                            title="2FA"
                            icon="schedule"
                            color="on-surface"
                            bgTransparent="1"
                        />
                    {/if}
                    {#if window.inWebExtension}
                        <IconButton
                            onclick={async () =>
                                onnotify(await sendCredentials(account))}
                            title="Fill the form"
                            icon="login"
                            color="on-surface"
                            bgTransparent="1"
                        />
                    {/if}
                </div>
            </div>
        </div>
    </div>
{:else}
    <div
        class="account_list_item ripple ripple_dark ripple_fast"
        {onclick}
        onmousedown={(event) => createRipple(event)}
    >
        <div class="account_list_item_title">
            <Img
                src={account.icon || 'img/accounts/default.svg'}
                alt="Account"
            />
            <div>
                <h5>{account.name}</h5>
                <p>{account.login?.split('@')[0]}</p>
            </div>
        </div>
        <div class="account_list_item_actions">
            {#if account.url && isUrlValid(account.url)}
                <IconButton
                    class="account_list_item_url"
                    title="Open URL"
                    href={account.url}
                    icon="launch"
                    color="on-surface"
                    bgTransparent="1"
                />
            {/if}
            {#if account.login}
                <IconButton
                    onclick={() => {
                        onnotify('Login copied')
                        copyValue(account.login)
                    }}
                    title="Login"
                    icon="alternate_email"
                    color="on-surface"
                    bgTransparent="1"
                />
            {/if}
            {#if account.password}
                <IconButton
                    onclick={() => {
                        onnotify('Password copied')
                        copyValue(account.password)
                    }}
                    title="Password"
                    icon="vpn_key"
                    color="on-surface"
                    bgTransparent="1"
                />
            {/if}
            {#if account.totp}
                <IconButton
                    onclick={async () => {
                        onnotify('2FA copied')
                        copyValue(
                            (await getTotpCode(account.totp)).replace(' ', '')
                        )
                    }}
                    title="2FA"
                    icon="schedule"
                    color="on-surface"
                    bgTransparent="1"
                />
            {/if}

            {#if window.inWebExtension}
                <IconButton
                    onclick={async () =>
                        onnotify(await sendCredentials(account))}
                    title="Fill the form"
                    icon="login"
                    color="on-surface"
                    bgTransparent="1"
                />
            {/if}
        </div>
        {#if strength !== 0}
            <div class="strength" style="--force: {strength}"></div>
        {/if}
    </div>
{/if}

<style>
    .account {
        padding: 0;
        margin: 0;
        width: 200px;
        height: 70px;
        margin: 10px;
        cursor: pointer;
    }

    .account:hover {
        box-shadow:
            0 10px 20px rgba(0, 0, 0, 0.19),
            0 6px 6px rgba(0, 0, 0, 0.23);
    }

    .card {
        padding: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: var(--surface);
        border: 1px solid var(--on-surface);
        border-radius: 2px;
        transition: 0.1s;
        box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.12),
            0 1px 2px rgba(0, 0, 0, 0.24);
        width: 200px;
        height: 70px;
        margin: 0;
        overflow: hidden;
        box-sizing: border-box;
    }

    .row {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        max-height: 100%;
        width: 100%;
    }

    .account h5 {
        font-size: 1.2em;
        max-width: calc(100% - 50px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .image {
        margin-right: 10px;
        max-height: 40px;
        max-width: 100%;
        user-select: none;
    }

    .strength {
        float: right;
        margin-top: -30px;

        display: block;
        cursor: pointer;
        /* Set in HTML */
        /* --force: 90; */
        --red: calc(255 * ((100 - var(--force)) / 100));
        --green: calc(255 * var(--force) / 100);
        width: 30px;
        height: 30px;
        background-image: linear-gradient(
            to bottom right,
            RGBA(var(--red), var(--green), 0, 0) 50%,
            RGBA(var(--red), var(--green), 0, 1)
        );
    }
    :global(.drag_over) .account {
        color: var(--accent);
        border: 1px solid var(--accent);
    }

    .image :global(Img) {
        pointer-events: none;
        max-height: 100%;
        max-width: 100%;
        height: 30px;
    }

    /* Detail mode */
    .detail-card {
        margin: 10px;
        margin-bottom: 20px;
        color: var(--on-surface);
        width: 280px;
        overflow: hidden;
        border: 1px solid var(--on-surface);
        border-radius: 4px;
    }
    .detail_main_action {
        padding: 5px;
        border-bottom: 1px solid var(--on-surface);
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        cursor: pointer;
    }
    .detail_main_action:hover {
        background-color: color-mix(in srgb, var(--primary) 4%, transparent);
    }
    .detail_account_actions {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        height: 48px;
    }
    .detail_account_actions > * {
        width: fit-content;
        display: flex;
        flex-direction: row;
    }
    .detail_img {
        min-height: 70px;
        min-width: 70px;
        height: 70px;
        width: 70px;
        padding: 8px;
        box-sizing: border-box;
    }
    .detail_img :global(Img) {
        max-width: 100%;
        max-height: 100%;
        height: 100%;
    }

    .detail_title {
        max-width: calc(100% - 100px);
        margin-left: 10px;
        box-sizing: border-box;
    }

    .detail_name {
        max-width: 100%;
        font-weight: 600;
        font-size: 1.5em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .detail_login {
        font-weight: 500;
        font-size: 1em;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .detail-card .strength {
        margin-top: 0px;
        margin-bottom: -30px;
        transform: rotate(270deg);
        margin-left: calc(100% - 30px);
    }

    .account_list_item .strength {
        margin-bottom: -50px;
        margin-right: -10px;
        position: absolute;
        right: 10px;
        bottom: 50px;
    }

    .account_list_item {
        position: relative;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        height: 36px;
        width: 400px;
        max-width: 90vw;
        overflow: hidden;
        padding: 10px;
        margin: 10px 5px;
        border: 1px solid var(--on-surface);
        border-radius: 4px;
        box-shadow:
            0 1px 3px rgb(0 0 0 / 12%),
            0 1px 2px rgb(0 0 0 / 24%);
        color: var(--on-surface);
        cursor: pointer;
    }
    .account_list_item:hover {
        background-color: color-mix(in srgb, var(--primary) 4%, transparent);
    }

    .account_list_item :global(Img) {
        pointer-events: none;
        max-height: 36px;
        max-width: 100%;
        height: 36px;
    }

    .account_list_item_title {
        display: flex;
        flex-direction: row;
        align-items: center;
        max-height: 100%;
        min-width: 110px;
    }
    .account_list_item_title h5,
    .account_list_item_title p {
        font-size: 1.2em;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.2rem;
        margin: 0;
        margin-left: 10px;
    }

    .account_list_item_title p {
        max-width: 180px;
        font-size: 0.9em;
        margin-top: 2px;
    }

    .account_list_item_actions {
        height: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-end;
        min-width: fit-content;
    }
</style>
