<script lang="ts">
    import Icon from '../../helpers/Icon.svelte'
    import * as dropbox from '../dropbox/dropbox.ts'
    import * as api from '../api.ts'
    import Field from '../../helpers/field/Field.svelte'
    import Button from '../../helpers/Button.svelte'
    import { onMount } from 'svelte'
    import { getCookie } from '../../helpers/utils.ts'
    import FileInput from '../../helpers/FileInput.svelte'
    import DropboxLogin from '../dropbox/DropboxLogin.svelte'
    import ChooseMethod from './ChooseMethod.svelte'
    import DropboxUpload from './../dropbox/DropboxUpload.svelte'
    import Wallet from '../../models/wallet.ts'

    const maxLen = 8
    interface Props {
        wallet?: Wallet
        onwallet_openned: () => void
    }

    let { wallet = $bindable(), onwallet_openned }: Props = $props()

    const allowed_methods = ['login', 'create', 'upload', 'dropbox', null]
    let method = $state<string | undefined>()
    let showOptions = $state(false)
    let sessionOpened = $state(false)

    let filedata = $state<ArrayBuffer | undefined>() // File uploaded
    let dropboxFile: ArrayBuffer | undefined
    let dropboxState = $state('')
    let loading = $state(false)

    let loginDisabled = $derived(
        (method === 'upload' && !filedata) ||
            (method === 'dropbox' && dropboxState !== 'logged')
    )

    let password = $state('')
    let wrongPassword = false
    let svgValue = $derived(
        wrongPassword || loading
            ? 0
            : ((100 - 33) * (maxLen - Math.min(password.length, maxLen))) /
                  maxLen +
                  33
    )
    let fillColor = $derived(
        wrongPassword ? 'var(--error-color)' : 'var(--secondary)'
    )

    async function onLogin() {
        loading = true
        if (method === 'login') {
            const newWallet = await api.unlock(password)
            if (!newWallet || !password.length) {
                setWrongPassword()
                return
            }
            wallet = newWallet
            onwallet_openned()
        } else if (method === 'create') {
            wallet = await api.newWallet(password)
            dropbox.logout()
            onwallet_openned()
        } else if (method === 'upload') {
            const newWallet = await api.login(filedata, password)
            if (!newWallet) {
                setWrongPassword()
                return
            }
            dropbox.logout()
            wallet = newWallet
            onwallet_openned()
        } else if (method === 'dropbox') {
            if (!dropboxFile) {
                dropboxFile = await dropbox.download('wallet.lck')
            }
            const newWallet = await api.login(dropboxFile, password)
            if (!newWallet) {
                setWrongPassword()
                return
            }
            wallet = newWallet
            onwallet_openned()
        }
        loading = false
    }

    function setWrongPassword() {
        loading = false
        password = ''
        wrongPassword = true
        const lockSvg = document.querySelector('svg')
        lockSvg.classList.add('wrong_password')
        setTimeout(() => {
            lockSvg.classList.remove('wrong_password')
        }, 1000)
    }

    async function setMethod(newMethod) {
        loading = false
        wrongPassword = false
        dropboxFile = null

        if (newMethod === 'login') {
            showOptions = false
            method = newMethod
        } else if (allowed_methods.indexOf(newMethod) >= 0) {
            showOptions = false
            method = newMethod
            document.cookie = `login_method=${method}`
        }

        if (method === 'dropbox') {
            // Clean the IndexDB before redirecting to Dropbox
            await api.logout(false)
        }
    }

    const init = async () => {
        const inMemory = await api.walletInMemory()
        sessionOpened = !!inMemory
        showOptions = !sessionOpened

        if (sessionOpened) {
            await setMethod('login')
            return
        }

        const cookieMethod = getCookie('login_method')
        if (
            cookieMethod &&
            cookieMethod.length &&
            allowed_methods.indexOf(cookieMethod) >= 0
        ) {
            method = cookieMethod
            showOptions = false
        }
    }

    $effect(() => {
        init()
    })
</script>

<div class="lock" style="--lock-value: {svgValue}; --fill-color: {fillColor}">
    {#if showOptions}
        <ChooseMethod
            onclick={async (method) => await setMethod(method)}
            {sessionOpened}
        />
    {:else}
        <h1>
            {method === 'create' ? 'Create a new wallet' : ''}
            {method === 'upload' ? 'Upload a file' : ''}
            {method === 'dropbox' ? 'Load from Dropbox' : ''}
        </h1>

        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
        >
            <path
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9
                2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2
                .9 2 2-.9 2-2 2zm3-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1
                3.1v2z"
            ></path>
            <path
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9
                2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2
                .9 2 2-.9 2-2 2zm3-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1
                3.1v2z"
            ></path>
        </svg>

        <div class="fields">
            {#if method === 'upload'}
                <FileInput
                    onuploaded={(file) => (filedata = file)}
                    onremoved={() => (filedata = null)}
                />
            {:else if method === 'dropbox'}
                <DropboxLogin
                    bind:state={dropboxState}
                    onlogout={() => (dropboxFile = null)}
                />
            {:else if method === 'login'}
                <div class="dropbox_button">
                    <DropboxUpload />
                </div>
            {/if}

            <Field
                label="Password"
                bind:value={password}
                onenter={onLogin}
                oninput={() => (wrongPassword = false)}
                type="password"
                showPasswordStrength={method === 'create'}
                copy={false}
            />

            <Button
                ripple={false}
                disabled={loginDisabled || loading}
                color="secondary"
                class="login-button {loading ? 'loading' : ''}"
                onclick={onLogin}
            >
                {#if loading}
                    <Icon class="login-loading" color="on-primary">sync</Icon>
                {/if}
                {method === 'create' ? 'Create' : 'Login'}
            </Button>
        </div>
        <Button
            color="secondary"
            onclick={() => (showOptions = true)}
            variant="text"
        >
            Choose an other method
        </Button>
    {/if}
</div>

<style>
    .lock {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: var(--primary);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        justify-content: center;
        align-items: center;
    }

    h1 {
        color: var(--on-primary);
    }

    svg {
        width: 250px;
        height: 250px;
        fill: none;
    }

    :global(svg.wrong_password) {
        animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    svg path {
        stroke: var(--on-primary);
        stroke-width: 0.2px;
        stroke-dasharray: 100px;
        stroke-dashoffset: 0;
        transition: 1s;
    }

    svg path:nth-child(2) {
        stroke: var(--fill-color);
        stroke-dasharray: 100px;
        stroke-dashoffset: var(--lock-value);
    }

    @keyframes shake {
        10%,
        90% {
            transform: translate3d(-1px, 0, 0);
        }

        20%,
        80% {
            transform: translate3d(2px, 0, 0);
        }

        30%,
        50%,
        70% {
            transform: translate3d(-4px, 0, 0);
        }

        40%,
        60% {
            transform: translate3d(4px, 0, 0);
        }
    }

    .lock :global(.mdc-select) {
        width: 100%;
    }

    .fields {
        padding: 20px 0;
        width: 250px;
        height: 280px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
    }

    .fields > :global(.file),
    .fields > :global(button) {
        width: 100%;
    }
    .fields > :global(*) {
        margin-bottom: 30px !important;
    }

    @keyframes rotating {
        from {
            -webkit-transform: rotate(0deg);
        }
        to {
            -webkit-transform: rotate(-360deg);
        }
    }

    .lock :global(.login-loading) {
        font-size: 18px;
        margin-right: 8px;
        animation: rotating 2s linear infinite;
    }

    .dropbox_button {
        width: fit-content;
    }
</style>
