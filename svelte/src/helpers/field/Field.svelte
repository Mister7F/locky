<script>
    import IconButton from '@smui/icon-button';
    import List, { Item } from '@smui/list';
    import Menu, { SelectionGroup, SelectionGroupIcon } from '@smui/menu';
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text/index';
    import { createEventDispatcher } from 'svelte';
    import FieldAction from './FieldAction.svelte';
    import { passwordStrength } from '../crypto.js';
    import { isUrlValid } from '../utils.js';
    import Icon from '../Icon.svelte';

    const dispatch = createEventDispatcher();
    export let label = '';
    export let readonly = 0;
    export let type = 'text';
    export let showPasswordStrength = false;
    export let value = '';
    export let message = null;
    export let messagePersistent = false;
    export let copy = 1;
    let className = '';
    export { className as class };
    export let canEditType = false;
    export let index = 0;
    export let passwordVisible = false;

    let textField;
    let copied = false;

    $: computedType = passwordVisible ? 'text' : type;
    $: computedMessage =
        message && message.length
            ? message
            : type === 'password' && showPasswordStrength
            ? 'Strength: ' + (passwordStrength(value) || 0) + ' / 100'
            : null;

    /**
     * Generate the event "enter" when pressing enter.
     */
    function onKeyPress(e) {
        if (!e) e = window.event;
        if ((e.keyCode || e.which) == 13) {
            e.preventDefault();
            e.stopPropagation();
            dispatch('enter');
            return false;
        }
    }

    /**
     * Allow to give the focus on this element.
     */
    export function focus() {
        if (textField) textField.focus();
    }

    function onCopyClick() {
        dispatch('copy');
        copied = true;
        setTimeout(() => (copied = false), 1000);
    }

</script>

{#if value || !readonly}
    <div class="field {className}">
        {#if readonly}
            <div class="label">{label}</div>
        {/if}
        <div class="content">
            {#if readonly}
                {#if type === 'url' && isUrlValid(value)}
                    <a class="value" href="{value}" target="_blank">{value}</a>
                {:else if type === 'password' && !passwordVisible}
                    <div class="value">{'•••••••••'}</div>
                {:else if type === 'totp'}
                    <div class="value">{message}</div>
                {:else}
                    <div class="value">{value}</div>
                {/if}
            {:else}
                <form class="text-field-container">
                    <Textfield
                        class="text-field"
                        bind:label
                        bind:value
                        bind:this="{textField}"
                        bind:type="{computedType}"
                        on:keypress="{onKeyPress}"
                        on:change
                        on:input
                        on:keydown
                        on:blur
                        input$aria-controls="helper-text-standard-field"
                        input$autocomplete="off" />
                    {#if computedMessage}
                        <HelperText
                            id="helper-text-standard-fields"
                            persistent="{messagePersistent}">
                            {computedMessage}
                        </HelperText>
                    {/if}
                </form>
            {/if}

            {#if type === 'password'}
                <IconButton toggle bind:pressed="{passwordVisible}" ripple="{false}">
                    {#if passwordVisible}
                        <Icon on>visibility</Icon>
                    {:else}
                        <Icon>visibility_off</Icon>
                    {/if}
                </IconButton>
            {:else if type === 'totp' && value}
                <IconButton on:click="{() => dispatch('show_qrcode')}">
                    <Icon>
                        <svg
                            height="1792"
                            viewBox="0 0 1792 1792"
                            width="1792"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M576
                                1152v128h-128v-128h128zm0-768v128h-128v-128h128zm768
                                0v128h-128v-128h128zm-1024
                                1023h384v-383h-384v383zm0-767h384v-384h-384v384zm768
                                0h384v-384h-384v384zm-256 256v640h-640v-640h640zm512
                                512v128h-128v-128h128zm256
                                0v128h-128v-128h128zm0-512v384h-384v-128h-128v384h-128v-640h384v128h128v-128h128zm-768-768v640h-640v-640h640zm768
                                0v640h-640v-640h640z"></path>
                        </svg>
                    </Icon>
                </IconButton>
            {/if}
            {#if canEditType && !readonly}
                <FieldAction
                    bind:type
                    bind:label
                    on:remove="{() => dispatch('remove', index)}" />
            {/if}
            {#if parseInt(copy) && value}
                <IconButton on:click="{onCopyClick}">
                    {#if !copied}
                        <Icon>content_copy</Icon>
                    {:else}
                        <Icon>check</Icon>
                    {/if}
                </IconButton>
            {/if}
        </div>
    </div>
{/if}

<style>
    .field {
        height: 72px;
        max-height: 100%;
        width: auto;
        text-align: left;
        max-width: 350px;
    }

    .content {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 50px;
        box-sizing: border-box;
    }

    .text-field-container {
        width: 100%;
    }

    .text-field-container :global(.text-field) {
        width: 100%;
    }

    .label {
        min-width: calc(100% - 50px);
        max-width: calc(100% - 50px);
        letter-spacing: 0.4px;
        font-size: 13px;
        margin-bottom: -6px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .value {
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .message {
        font-size: 12px;
        letter-spacing: 0.4px;
    }

    a {
        color: var(--link-color);
    }

    a:hover {
        text-decoration: underline;
    }

    /* Set colors */
    .field {
        color: var(--on-primary);
    }

</style>
