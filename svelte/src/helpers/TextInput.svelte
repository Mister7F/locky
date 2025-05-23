<script>
    let {
        label = '',
        class: className,
        help = '',
        helpPersistent = true,
        value = $bindable(),
        type = 'text',
        onkeypress = null,
        onchange = null,
        oninput = null,
        onkeydown = null,
        onfocus = null,
        onblur = null,
    } = $props()

    let focused = $state(false)
    let selectionIndex = $state(-1)
    let timeoutHandle = null
    let loosingFocus = $state(false)

    function onFocus(event) {
        focused = true
        loosingFocus = false
        clearTimeout(timeoutHandle)
        selectionIndex = event.target.selectionStart
        onfocus && onfocus()
    }

    function onBlur() {
        loosingFocus = true
        focused = false
        selectionIndex = -1
        clearTimeout(timeoutHandle)
        timeoutHandle = setTimeout(() => {
            loosingFocus = false
        }, 180)
        onblur && onblur()
    }
</script>

<div class="container {className}">
    <input
        required="required"
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
        border: 1px soled green;
    }
    input {
        background: none;
        display: block;
        border: none;
        border-radius: 0;
        border-bottom: 1px solid var(--disabled-color);
        caret-color: var(--secondary);
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.75rem;
        padding: 10px 0px;
        width: 100%;
        color: var(--color);
        width: 100%;
    }

    .container:hover input {
        border-bottom: 1px solid var(--color);
    }

    input.focused {
        outline: none;
    }
    input[type='password'] {
        letter-spacing: 0.00937em;
    }

    .label {
        color: var(--disabled-color);
        font-size: 1rem;
        line-height: 1.2rem;
        font-weight: 400;
        transform-origin: left top;
        font-weight: normal;
        position: absolute;
        pointer-events: none;
        left: 0px;
        top: 8px;
        transform-origin: left top;
        transition:
            transform 0.15s cubic-bezier(0.4, 0, 0.2, 1),
            color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    input.focused ~ .label,
    input:valid ~ .label {
        transform: translateY(-70%) scale(0.75);
        color: var(--disabled-color);
    }
    input.focused ~ .label {
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
    input.selection-zero ~ .bar {
        /* Focusing the zero index change the animation
           We can use the caret position in all cases like:
           > https://sveltematerialui.com/demo/textfield
           but it will add a lot of complexity */
        transform-origin: left center;
    }
    input.focused ~ .bar {
        transform: scaleX(1);
        opacity: 1;
    }
    input.loosing-focus ~ .bar {
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
    input:not(.focused):not(.help-persistent) ~ .help {
        display: none;
    }
</style>
