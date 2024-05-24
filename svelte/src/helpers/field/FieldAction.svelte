<script>
    import Button, { Label } from '@smui/button'
    import IconButton from '@smui/icon-button'
    import Textfield from '@smui/textfield'
    import Dialog, { Title, Content, Actions } from '@smui/dialog'
    import Icon from '../Icon.svelte'
    import Menu, { SelectionGroup, SelectionGroupIcon } from '@smui/menu'
    import List, { Item } from '@smui/list'
    import { createEventDispatcher } from 'svelte'

    const dispatch = createEventDispatcher()

    export let type = 'text'
    export let label = ''

    let fieldNameDialog

    let openMenu = false

    function doAction(action) {
        if (action === 'remove') {
            dispatch('remove')
        } else if (action === 'rename') {
            fieldNameDialog.open()
        } else {
            type = action
        }
        openMenu = false
    }

    function onKeyPressFieldLabel(e) {
        if (!e) e = window.event
        if ((e.keyCode || e.which) == 13) {
            // Press enter
            fieldNameDialog.close()
            return false
        }
    }

    function onBlur(event) {
        if (
            !event.relatedTarget ||
            !event.relatedTarget.closest('.menu_field_type')
        ) {
            // close the menu only if the focused element is not a menu item
            openMenu = false
        } else {
            // otherwise keep the focus on the icon
            event.currentTarget.focus()
        }
    }
</script>

<IconButton on:click={() => (openMenu = !openMenu)} on:blur={onBlur}>
    <!-- Todo: Use Select: https://sveltematerialui.com/demo/select -->
    <Icon>
        {#if type === 'text'}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
            >
                <path d="M5 4v3h5.5v12h3V7H19V4z"></path>
            </svg>
        {:else if type === 'password'}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
            >
                <path
                    d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61
                    0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2
                    2 .9 2 2-.9 2-2 2z"
                ></path>
            </svg>
        {:else if type === 'url'}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
            >
                <path d="M0 0h24v24H0z" fill="none"></path>
                <path
                    d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5
                    5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71
                    0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24
                    5-5s-2.24-5-5-5z"
                ></path>
            </svg>
        {/if}
    </Icon>
</IconButton>
{#if openMenu}
    <Menu static class="menu_field_type">
        <List>
            <Item on:click={() => doAction('text')}>
                <Icon color="on-surface">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path d="M5 4v3h5.5v12h3V7H19V4z"></path>
                    </svg>
                </Icon>
            </Item>
            <Item on:click={() => doAction('password')}>
                <Icon color="on-surface">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6
                            6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1
                            0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
                        ></path>
                    </svg>
                </Icon>
            </Item>
            <Item on:click={() => doAction('url')}>
                <Icon color="on-surface">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path d="M0 0h24v24H0z" fill="none"></path>
                        <path
                            d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5
                            5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8
                            13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39
                            3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
                        ></path>
                    </svg>
                </Icon>
            </Item>
            <hr style="margin: 0 10px;" />
            <Item on:click={() => doAction('rename')}>
                <Icon color="on-surface">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71
                            7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41
                            0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                        ></path>
                        <path d="M0 0h24v24H0z" fill="none"></path>
                    </svg>
                </Icon>
            </Item>
            <Item on:click={() => doAction('remove')}>
                <Icon color="on-surface">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8
                            9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4z"
                        ></path>
                    </svg>
                </Icon>
            </Item>
        </List>
    </Menu>
{/if}

<Dialog bind:this={fieldNameDialog} class="account_editor_dialog">
    <Title>Field name</Title>
    <Content>
        <Textfield on:keypress={onKeyPressFieldLabel} bind:value={label} />
        <Button
            style="float: right; margin-top: 10px;"
            color="secondary"
            on:click={() => fieldNameDialog.close()}
        >
            Save
        </Button>
    </Content>
</Dialog>

<style>
    :global(.menu_field_type) {
        margin-top: 310px;
        margin-left: -60px;
        min-width: 60px;
        width: 60px;
        z-index: 999999;
        box-sizing: border-box;
    }
</style>
