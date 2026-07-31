<script lang="ts">
    import IconButton from '../../helpers/IconButton.svelte'
    import { onMount } from 'svelte'
    import ChangePassword from './ChangePassword.svelte'
    import Settings from './Settings.svelte'
    import * as api from '../api.ts'
    import Field from '../../helpers/field/Field.svelte'
    import Icon from '../../helpers/Icon.svelte'
    import DropboxUpload from './../dropbox/DropboxUpload.svelte'
    import type Wallet from '../../models/wallet.ts'
    import {
        ACCOUNT_VIEW_MODES,
        type AccountViewMode,
    } from '../../helpers/types.ts'

    interface Props {
        viewMode: AccountViewMode
        floatingFolder: boolean
        searchText: string
        openSearch: boolean
        onshow_folders: () => void
        onlock: () => void
        onwalletdownloaded: (wallet: Wallet) => void
    }

    let {
        viewMode = $bindable('list'),
        floatingFolder,
        searchText = $bindable(''),
        openSearch = $bindable(false),
        onshow_folders,
        onlock,
        onwalletdownloaded,
    }: Props = $props()

    let changePassword
    let settingsVisible = $state(false)

    let viewModeIcon = $derived(
        {
            detail: 'view_module',
            list: 'list',
            minimalist: 'view_headline',
        }[viewMode] || 'view_module'
    )

    function changeViewMode() {
        const _changeViewMode = () => {
            const nextModeIndex =
                (ACCOUNT_VIEW_MODES.indexOf(viewMode) + 1) %
                ACCOUNT_VIEW_MODES.length
            viewMode = ACCOUNT_VIEW_MODES[nextModeIndex]
            window.localStorage.setItem('viewMode', viewMode)
        }

        // Disabled until it's fast enough
        _changeViewMode()
        // if (!document.startViewTransition) {
        //     console.warn('Transition not available')
        //     _changeViewMode()
        // } else {
        //     document.startViewTransition(() => _changeViewMode())
        // }
    }

    onMount(() => {
        // Automatically start a search when typing in the application
        const onKeydown = (event: KeyboardEvent) => {
            const target = event.target
            const editing =
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
            const overlayOpen = document.querySelector(
                '.panel:not(.hidden), .dialog'
            )

            if (
                editing ||
                overlayOpen ||
                event.defaultPrevented ||
                event.isComposing ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                event.key.length !== 1 ||
                !event.key.trim()
            ) {
                return
            }

            event.preventDefault()
            openSearch = true
            searchText += event.key
            requestAnimationFrame(() => {
                document
                    .querySelector<HTMLInputElement>('.search_field input')
                    ?.focus()
            })
        }
        document.addEventListener('keydown', onKeydown)
        return () => document.removeEventListener('keydown', onKeydown)
    })
</script>

<Settings bind:visible={settingsVisible} {onlock} {onwalletdownloaded} />
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
            <DropboxUpload {onwalletdownloaded} />
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
