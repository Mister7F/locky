<script>
    import IconButton from '@smui/icon-button';
    import List, { Item } from '@smui/list';
    import Menu from '@smui/menu';
    import TopAppBar, { Row, Section } from '@smui/top-app-bar';
    import { onMount } from 'svelte';
    import { createEventDispatcher } from 'svelte';
    import ChangePassword from './ChangePassword.svelte';
    import Settings from './Settings.svelte';
    import * as api from '../api.js';
    import Field from '../../helpers/field/Field.svelte';
    import Icon from '../../helpers/Icon.svelte';
    import DropboxUpload from './../dropbox/DropboxUpload.svelte';
    import * as dropbox from './../dropbox/dropbox.js';

    const dispatch = createEventDispatcher();
    export let viewMode = 'detail';
    export let floatingFolder;
    let searchField;
    let searchText = '';
    let changePassword;
    let openSearch = false;
    let isDropboxAuthenticated = false;
    let settingsVisible = false;

    const viewModes = ['detail', 'minimalist', 'list'];

    $: viewModeIcon =
        {
            detail: 'view_module',
            minimalist: 'view_comfy',
            list: 'list',
        }[viewMode] || 'view_module';

    function changeViewMode() {
        const nextModeIndex = (viewModes.indexOf(viewMode) + 1) % viewModes.length;
        viewMode = viewModes[nextModeIndex];
        window.localStorage.setItem('viewMode', viewMode);
    }

    onMount(() => {
        // Automatically start a search when typing in the application
        document.addEventListener('keypress', (event) => {
            // check if the navigation bar is on the top level
            let topElement = document.elementFromPoint(0, 0);
            if (topElement && topElement.classList.contains('mdc-top-app-bar__section')) {
                openSearch = true;
                searchField.focus();
            }
        });
    });

</script>

<Settings bind:visible="{settingsVisible}" bind:isDropboxAuthenticated on:lock />
<TopAppBar class="wallet-navbar" color="primary">
    <Row>
        <Section>
            {#if floatingFolder}
                <IconButton
                    class="material-icons"
                    on:click="{() => dispatch('show_folders')}">
                    menu
                </IconButton>
            {/if}
        </Section>
        <Section align="end">
            <IconButton
                class="material-icons"
                title="Search an account"
                on:click="{() => {
                    searchField.focus();
                    openSearch = !openSearch;
                }}">
                search
            </IconButton>
            <Field
                class="search_field {openSearch ? 'visible' : ''}"
                copy="0"
                bind:this="{searchField}"
                on:input="{() => setTimeout(() => dispatch('search', searchText))}"
                on:blur="{() => (openSearch = !!searchText)}"
                bind:value="{searchText}" />
            {#if !openSearch || !floatingFolder}
                <IconButton
                    class="material-icons"
                    title="Download your wallet"
                    on:click="{async () => await api.downloadWallet()}">
                    download
                </IconButton>
                <DropboxUpload bind:isAuthenticated="{isDropboxAuthenticated}" />
            {/if}
            <IconButton
                class="material-icons"
                title="Change mode"
                on:click="{changeViewMode}">
                {viewModeIcon}
            </IconButton>
            <IconButton
                class="material-icons"
                title="More options"
                on:click="{() => (settingsVisible = true)}">
                settings
            </IconButton>
        </Section>
    </Row>
</TopAppBar>

<style>
    :global(.mdc-top-app-bar.wallet-navbar) {
        position: sticky !important;
    }
    h1 {
        color: var(--on-primary);
        font-size: 20px;
    }
    :global(.wallet-navbar .field) {
        margin-top: -20px;
        width: 100%;
        z-index: 10;
    }

    :global(.wallet-navbar .menu_navbar) {
        margin-top: 220px;
        margin-left: -60px;
        min-width: 60px;
        width: 60px;
        z-index: 999999;
    }

    :global(.search_field) {
        width: 0 !important;
        transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :global(.search_field.visible) {
        width: 300px !important;
    }

</style>
