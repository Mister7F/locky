<script lang="ts">
    import type { HTMLInputAttributes } from 'svelte/elements'

    type InputEventHandler = (event: Event) => void

    interface Props {
        label?: string
        class?: string
        help?: string
        helpPersistent?: boolean
        value?: string
        type?: HTMLInputAttributes['type'] | 'textarea'
        autofocus?: boolean
        onkeypress?: InputEventHandler
        onchange?: InputEventHandler
        oninput?: InputEventHandler
        onkeydown?: InputEventHandler
        onfocus?: () => void
        onblur?: () => void
    }

    let {
        label = '',
        class: className,
        help = '',
        helpPersistent = true,
        value = $bindable(),
        type = 'text',
        autofocus = false,
        onkeypress,
        onchange,
        oninput,
        onkeydown,
        onfocus,
        onblur,
    }: Props = $props()

    let focused = $state(false)
    let selectionIndex = $state(-1)
    let timeoutHandle: number | undefined
    let loosingFocus = $state(false)
    let inputElement = $state<HTMLInputElement | HTMLTextAreaElement>()

    $effect(() => {
        if (autofocus && inputElement) {
            inputElement.focus()
        }
    })

    function onFocus(event: FocusEvent) {
        focused = true
        loosingFocus = false
        if (timeoutHandle) {
            clearTimeout(timeoutHandle)
            timeoutHandle = null
        }
        const target = event.target as
            | HTMLInputElement
            | HTMLTextAreaElement
            | null
        selectionIndex = target?.selectionStart ?? -1
        onfocus?.()
    }

    function onBlur() {
        loosingFocus = true
        focused = false
        selectionIndex = -1
        if (timeoutHandle) {
            clearTimeout(timeoutHandle)
        }
        timeoutHandle = setTimeout(() => {
            loosingFocus = false
        }, 180)
        onblur?.()
    }
</script>

<div class="container {type === 'textarea' ? 'multiline' : ''} {className}">
    {#if type === 'textarea'}
        <textarea
            bind:this={inputElement}
            required
            class="
                {focused ? 'focused' : ''}
                {selectionIndex === 0 ? 'selection-zero' : ''}
                {loosingFocus ? 'loosing-focus' : ''}
                {helpPersistent ? 'help-persistent' : ''}
            "
            bind:value
            onfocus={onFocus}
            onblur={onBlur}
            {onkeypress}
            {onchange}
            {oninput}
            {onkeydown}
        ></textarea>
    {:else}
        <input
            bind:this={inputElement}
            required
            class="
                {focused ? 'focused' : ''}
                {selectionIndex === 0 ? 'selection-zero' : ''}
                {loosingFocus ? 'loosing-focus' : ''}
                {helpPersistent ? 'help-persistent' : ''}
            "
            {...{ type }}
            bind:value
            onfocus={onFocus}
            onblur={onBlur}
            {onkeypress}
            {onchange}
            {oninput}
            {onkeydown}
        />
    {/if}
    <span class="bar"></span>
    {#if label}
        <span class="label">{label}</span>
    {/if}
    {#if help}
        <span class="help">
            {help}
        </span>
    {/if}
</div>

<style>
    .container,
    .container * {
        box-sizing: border-box;
        --color: hsla(200, 5%, 88%, 0.87);
        --disabled-color: color-mix(in srgb, var(--color) 65%, transparent);
    }
    .container {
        position: relative;
        width: 100%;
        height: 50px;
        border: 1px soled green;
    }
    .container.multiline {
        height: 100px;
    }
    input,
    textarea {
        background: none;
        display: block;
        border: none;
        border-radius: 0;
        border-bottom: 1px solid var(--disabled-color);
        caret-color: var(--secondary);
        height: 50px;
        font-size: 16px;
        font-weight: 400;
        line-height: 29px;
        padding: 10px 0px;
        width: 100%;
        color: var(--color);
        width: 100%;
    }

    textarea {
        height: calc(100% - 16px);
        min-height: 0;
        margin-top: 16px;
        padding: 0;
        resize: none;
        font-family: inherit;
        scrollbar-color: var(--scrollbar-color) transparent;
        scrollbar-width: thin;
    }

    textarea::-webkit-scrollbar {
        width: 6px;
    }

    textarea::-webkit-scrollbar-track {
        background: transparent;
    }

    textarea::-webkit-scrollbar-thumb {
        background: var(--scrollbar-color);
    }

    .container:hover input,
    .container:hover textarea {
        border-bottom: 1px solid var(--color);
    }

    input.focused,
    textarea.focused {
        outline: none;
    }
    input[type='password'] {
        letter-spacing: 0.00937em;
    }

    .label {
        color: var(--disabled-color);
        font-size: 16px;
        line-height: 1.2;
        font-weight: 400;
        letter-spacing: 0.4px;
        transform-origin: left top;
        font-weight: normal;
        position: absolute;
        pointer-events: none;
        left: 0px;
        top: 8px;
        transform-origin: left top;
        transition:
            transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
            font-size 0.15s cubic-bezier(0.4, 0, 0.2, 1),
            color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    input.focused ~ .label,
    input:valid ~ .label,
    textarea.focused ~ .label,
    textarea:valid ~ .label {
        transform: translateY(-10px);
        font-size: 12px;
        color: var(--disabled-color);
    }
    input.focused ~ .label,
    textarea.focused ~ .label {
        color: var(--secondary);
    }

    /* Bottom bar */
    .bar {
        bottom: 0;
        height: 2px;
        opacity: 0;
        position: absolute;
        transition:
            transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        background-color: var(--secondary);
    }
    .bar {
        transform: scaleX(0);
        width: 100%;
        left: 0%;
    }
    input.selection-zero ~ .bar,
    textarea.selection-zero ~ .bar {
        /* Focusing the zero index change the animation
           We can use the caret position in all cases like:
           > https://sveltematerialui.com/demo/textfield
           but it will add a lot of complexity */
        transform-origin: left center;
    }
    input.focused ~ .bar,
    textarea.focused ~ .bar {
        transform: scaleX(1);
        opacity: 1;
    }
    input.loosing-focus ~ .bar,
    textarea.loosing-focus ~ .bar {
        transform: scaleX(1) !important;
        opacity: 0 !important;
    }

    /* Help message */
    .help {
        position: absolute;
        bottom: -20px;
        color: var(--disabled-color);
        font-size: 0.75rem;
        font-weight: 400;
    }
    input:not(.focused):not(.help-persistent) ~ .help,
    textarea:not(.focused):not(.help-persistent) ~ .help {
        display: none;
    }
</style>
