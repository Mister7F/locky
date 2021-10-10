<script>
    import Button, { Group, GroupItem, Label } from '@smui/button';
    import Menu from '@smui/menu';
    import List, { Item, Separator, Text } from '@smui/list';
    import FormField from '@smui/form-field';
    import Select, { Option } from '@smui/select';
    import Icon from '../../helpers/Icon.svelte';
    import Switch from '@smui/switch';
    import { createEventDispatcher } from 'svelte';
    import * as dropbox from '../dropbox/dropbox.js';
    import * as api from '../api.js';
    import Field from '../../helpers/field/Field.svelte';
    import { onMount } from 'svelte';
    import { getCookie } from '../../helpers/utils.js';
    import FileInput from '../../helpers/FileInput.svelte';
    import DropboxLogin from '../dropbox/DropboxLogin.svelte';
    import ChooseMethod from './ChooseMethod.svelte';

    const dispatch = createEventDispatcher();
    const maxLen = 8;
    export let wallet;

    const allowed_methods = ['login', 'create', 'upload', 'dropbox', null];
    let method = null;
    let showOptions = false;
    let sessionOpened = false;

    let filedata = null; // File uploaded
    let dropboxFile = null;
    let dropboxState = '';
    let loading = false;

    $: loginDisabled =
        (method === 'upload' && !filedata) ||
        (method === 'dropbox' && dropboxState !== 'logged');

    let password = '';
    let wrongPassword = false;
    $: svgValue =
        wrongPassword || loading
            ? 0
            : ((100 - 33) * (maxLen - Math.min(password.length, maxLen))) / maxLen + 33;
    $: fillColor = wrongPassword ? 'var(--error-color)' : 'var(--secondary)';

    async function onLogin() {
        loading = true;
        if (method === 'login') {
            const newWallet = await api.unlock(password);
            if (!newWallet) {
                setWrongPassword();
                return;
            }
            wallet = newWallet;
            dispatch('wallet_openned');
        } else if (method === 'create') {
            wallet = await api.newWallet(password);
            dispatch('wallet_openned');
        } else if (method === 'upload') {
            const newWallet = await api.login(filedata, password);
            if (!newWallet) {
                setWrongPassword();
                return;
            }
            wallet = newWallet;
            dispatch('wallet_openned');
        } else if (method === 'dropbox') {
            if (!dropboxFile) {
                dropboxFile = await dropbox.download('wallet.lck');
            }
            const newWallet = await api.login(dropboxFile, password);
            if (!newWallet) {
                setWrongPassword();
                return;
            }
            wallet = newWallet;
            dispatch('wallet_openned');
        }
        loading = false;
    }

    function setWrongPassword() {
        loading = false;
        password = '';
        wrongPassword = true;
        const lockSvg = document.querySelector('svg');
        lockSvg.classList.add('wrong_password');
        setTimeout(() => {
            lockSvg.classList.remove('wrong_password');
        }, 1000);
    }

    async function setMethod(newMethod) {
        loading = false;
        wrongPassword = false;

        if (newMethod === 'login') {
            showOptions = false;
            method = newMethod;
        } else if (allowed_methods.indexOf(newMethod) >= 0) {
            showOptions = false;
            method = newMethod;
            document.cookie = `login_method=${method}`;
        }

        if (method === 'dropbox') {
            // Clean the IndexDB before redirecting to Dropbox
            await api.logout(false);
        }
    }

    onMount(async () => {
        sessionOpened = await api.walletInMemory();
        showOptions = !sessionOpened;

        if (sessionOpened) {
            await setMethod('login');
            return;
        }

        const cookieMethod = getCookie('login_method');
        if (
            cookieMethod &&
            cookieMethod.length &&
            allowed_methods.indexOf(cookieMethod) >= 0
        ) {
            method = cookieMethod;
            showOptions = false;
        }
    });

</script>

<div class="lock" style="--lock-value: {svgValue}; --fill-color: {fillColor}">
    {#if showOptions}
        <ChooseMethod
            on:click="{async (event) => await setMethod(event.detail)}"
            sessionOpened="{sessionOpened}" />
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
            viewBox="0 0 24 24">
            <path
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9
                2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2
                .9 2 2-.9 2-2 2zm3-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1
                3.1v2z"></path>
            <path
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9
                2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2
                .9 2 2-.9 2-2 2zm3-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1
                3.1v2z"></path>
        </svg>

        <div class="fields">
            {#if method === 'upload'}
                <FileInput
                    on:uploaded="{(event) => (filedata = event.detail.file)}"
                    on:removed="{(event) => (filedata = null)}" />
            {:else if method === 'dropbox'}
                <DropboxLogin
                    bind:state="{dropboxState}"
                    on:logout="{() => (dropboxFile = null)}" />
            {/if}

            <Field
                label="Password"
                bind:value="{password}"
                on:enter="{onLogin}"
                on:input="{() => (wrongPassword = false)}"
                type="password"
                showPasswordStrength="{method === 'create'}"
                copy="0" />

            <Button
                class="login-button {loading ? 'loading' : ''}"
                color="secondary"
                variant="raised"
                on:click="{onLogin}"
                disabled="{loginDisabled || loading}">
                {#if loading}
                    <Icon class="login-loading" color="on-primary">sync</Icon>
                {/if}
                <Label>{method === 'create' ? 'Create' : 'Login'}</Label>
            </Button>
        </div>
        <Button color="secondary" on:click="{() => (showOptions = true)}">
            <Label>Choose an other method</Label>
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

    .fields > :global(*:not(.mdc-form-field)) {
        width: 100%;
    }
    .fields > :global(*) {
        height: 40px;
        width: 100%;
        margin-bottom: 30px !important;
    }
    .fields > :global(*) > :global(button) {
        width: 100%;
        max-height: 35px;
    }
    .fields > :global(button) {
        /* Login button */
        max-height: 35px;
    }

    @-webkit-keyframes rotating {
        from {
            -webkit-transform: rotate(0deg);
        }
        to {
            -webkit-transform: rotate(-360deg);
        }
    }
    .lock :global(.login-loading) {
        -webkit-animation: rotating 2s linear infinite;
    }

    .lock :global(.login-button.loading) {
        color: var(--on-primary);
    }

</style>
