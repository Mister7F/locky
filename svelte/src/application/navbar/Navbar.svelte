<script>
    import IconButton from '../../helpers/IconButton.svelte'
    import { onMount } from 'svelte'
    import { createEventDispatcher } from 'svelte'
    import ChangePassword from './ChangePassword.svelte'
    import Settings from './Settings.svelte'
    import * as api from '../api.js'
    import Field from '../../helpers/field/Field.svelte'
    import Icon from '../../helpers/Icon.svelte'
    import DropboxUpload from './../dropbox/DropboxUpload.svelte'
    import * as dropbox from './../dropbox/dropbox.js'

    const dispatch = createEventDispatcher()
    export let viewMode = 'list'
    export let floatingFolder
    export let searchText = ''
    let changePassword
    export let openSearch = false
    let isDropboxAuthenticated = false
    let settingsVisible = false

    const viewModes = ['detail', 'minimalist', 'list']

    $: viewModeIcon =
        {
            detail: 'view_module',
            minimalist: 'view_comfy',
            list: 'list',
        }[viewMode] || 'view_module'

    function changeViewMode() {
        const nextModeIndex =
            (viewModes.indexOf(viewMode) + 1) % viewModes.length
        viewMode = viewModes[nextModeIndex]
        window.localStorage.setItem('viewMode', viewMode)
    }

    onMount(() => {
        // Automatically start a search when typing in the application
        document.addEventListener('keypress', (event) => {
            // check if the navigation bar is on the top level
            let topElement = document.elementFromPoint(0, 0)
            if (
                topElement &&
                topElement.classList.contains('wallet-navbar') &&
                event.target.tagName !== 'INPUT'
            ) {
                openSearch = true
                const input = document.querySelector('.search_field input')
                if (input !== document.activeElement) {
                    setTimeout(() => {
                        input.focus()
                        searchText += event.key
                    })
                }
            }
        })
    })
</script>

<Settings bind:visible={settingsVisible} bind:isDropboxAuthenticated on:lock />
<div class="wallet-navbar" color="primary">
    <div class="folder_menu">
        {#if floatingFolder}
            <IconButton on:click={() => dispatch('show_folders')} icon="menu" />
        {/if}
    </div>
    <div class="actions">
        <IconButton
            title="Search an account"
            icon="search"
            on:click={() => {
                document.querySelector('.search_field input').focus()
                openSearch = !openSearch
            }}
        />
        <Field
            class="search_field {openSearch ? 'visible' : ''}"
            copy="0"
            on:blur={() => (openSearch = !!searchText)}
            bind:value={searchText}
        />
        {#if !openSearch || !floatingFolder}
            <IconButton
                title="Download your wallet"
                icon="download"
                on:click={async () => await api.downloadWallet()}
            />
            <DropboxUpload bind:isAuthenticated={isDropboxAuthenticated} />
        {/if}
        <IconButton
            title="Change mode"
            icon={viewModeIcon}
            on:click={changeViewMode}
        />
        <IconButton
            title="More options"
            icon="settings"
            on:click={() => (settingsVisible = true)}
        />
    </div>
</div>

<style>
    .wallet-navbar {
        background: var(--primary);
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
    .wallet-navbar :global(.field) {
        margin-bottom: -15px;
        width: 100%;
        z-index: 10;
    }

    .wallet-navbar :global(.menu_navbar) {
        margin-top: 220px;
        margin-left: -60px;
        min-width: 60px;
        width: 60px;
        z-index: 999999;
    }

    .actions {
        display: flex;
        flex-direction: row;
        justify-content: end;
        align-items: center;
    }

    :global(.search_field) {
        width: 0 !important;
        transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :global(.search_field.visible) {
        width: 100% !important;
    }
</style>
