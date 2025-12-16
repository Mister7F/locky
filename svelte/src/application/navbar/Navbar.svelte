<script lang="ts">
    import IconButton from '../../helpers/IconButton.svelte'
    import { onMount } from 'svelte'
    import ChangePassword from './ChangePassword.svelte'
    import Settings from './Settings.svelte'
    import * as api from '../api.ts'
    import Field from '../../helpers/field/Field.svelte'
    import Icon from '../../helpers/Icon.svelte'
    import DropboxUpload from './../dropbox/DropboxUpload.svelte'
    import * as dropbox from './../dropbox/dropbox.ts'

    interface Props {
        viewMode: string
        floatingFolder: boolean
        searchText: string
        openSearch: boolean
        onshow_folders: () => void
        onlock: () => void
    }

    let {
        viewMode = $bindable('list'),
        floatingFolder,
        searchText = $bindable(''),
        openSearch = false,
        onshow_folders,
        onlock,
    }: Props = $props()

    let changePassword
    let isDropboxAuthenticated = $state(false)
    let settingsVisible = $state(false)

    const viewModes = ['detail', 'list']

    let viewModeIcon = $derived(
        {
            detail: 'view_module',
            list: 'list',
        }[viewMode] || 'view_module'
    )

    function changeViewMode() {
        const _changeViewMode = () => {
            const nextModeIndex =
                (viewModes.indexOf(viewMode) + 1) % viewModes.length
            viewMode = viewModes[nextModeIndex]
            window.localStorage.setItem('viewMode', viewMode)
        }
        if (!document.startViewTransition) {
            console.warn('Transition not available')
            _changeViewMode()
        } else {
            document.startViewTransition(() => _changeViewMode())
        }
    }

    onMount(() => {
        // Automatically start a search when typing in the application
        document.addEventListener('keypress', (event) => {
            // check if the navigation bar is on the top level
            let topElement = document.elementFromPoint(0, 0)
            if (
                topElement &&
                topElement.classList.contains('wallet-navbar') &&
                event.target instanceof HTMLElement &&
                event.target.tagName !== 'INPUT'
            ) {
                openSearch = true
                const input = document.querySelector<HTMLInputElement>(
                    '.search_field input'
                )
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

<Settings bind:visible={settingsVisible} {isDropboxAuthenticated} {onlock} />
<div class="wallet-navbar" color="primary">
    <div class="folder_menu">
        {#if floatingFolder}
            <IconButton onclick={onshow_folders} icon="menu" />
        {/if}
    </div>
    <div class="actions">
        <IconButton
            title="Search an account"
            icon="search"
            onclick={() => {
                document
                    .querySelector<HTMLInputElement>('.search_field input')
                    .focus()
                openSearch = !openSearch
            }}
        />
        <Field
            class="search_field {openSearch || searchText ? 'visible' : ''}"
            copy={false}
            onblur={() => (openSearch = !!searchText)}
            bind:value={searchText}
        />
        {#if !openSearch || !floatingFolder}
            <IconButton
                title="Download your wallet"
                icon="download"
                onclick={async () => await api.downloadWallet()}
            />
            <DropboxUpload isAuthenticated={isDropboxAuthenticated} />
        {/if}
        <IconButton
            title="Change mode"
            icon={viewModeIcon}
            onclick={changeViewMode}
        />
        <IconButton
            title="More options"
            icon="settings"
            onclick={() => (settingsVisible = true)}
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
