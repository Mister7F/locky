<script lang="ts">
    import Icon from './Icon.svelte'

    interface SelectionOption {
        value: string
        label: string
    }

    interface Props {
        label: string
        options: SelectionOption[]
        value?: string
        readonly?: boolean
    }

    let {
        label,
        options,
        value = $bindable(''),
        readonly = false,
    }: Props = $props()

    let selectedLabel = $derived(
        options.find((option) => option.value === value)?.label || ''
    )
</script>

<div class="selection {readonly ? 'readonly' : ''}">
    <div class="label">{label}</div>
    <div class="control">
        {#if readonly}
            <div class="value">{selectedLabel}</div>
        {:else}
            <select bind:value aria-label={label}>
                {#each options as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
            <Icon>arrow_drop_down</Icon>
            <span class="bar"></span>
        {/if}
    </div>
</div>

<style>
    .selection {
        position: relative;
        width: auto;
        max-width: 350px;
        padding: 16px 0;
        text-align: left;
        --color: hsla(200, 5%, 88%, 0.87);
        --disabled-color: color-mix(in srgb, var(--color) 65%, transparent);
    }

    .label {
        position: absolute;
        top: 14px;
        left: 0;
        z-index: 1;
        color: var(--disabled-color);
        font-size: 12px;
        line-height: 1.2;
        font-weight: 400;
        letter-spacing: 0.4px;
        transition: color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
    }

    .selection:not(.readonly):focus-within .label {
        color: var(--secondary);
    }

    .control {
        position: relative;
        width: 100%;
        height: 50px;
    }

    .value,
    select {
        width: 100%;
        height: 50px;
        box-sizing: border-box;
        padding: 10px 0;
        color: var(--on-primary);
        font-size: 16px;
        font-weight: 400;
        line-height: 29px;
    }

    .value {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        border-bottom: 1px solid transparent;
    }

    select {
        appearance: none;
        padding-right: 32px;
        cursor: pointer;
        border: 0;
        border-bottom: 1px solid var(--disabled-color);
        border-radius: 0;
        outline: 0;
        background: var(--primary);
    }

    .selection:not(.readonly):hover select {
        border-bottom-color: var(--color);
    }

    select:focus {
        outline: none;
    }

    option {
        color: var(--on-primary);
        background: var(--primary);
    }

    .control :global(.icon_base) {
        position: absolute;
        top: 13px;
        right: 0;
        pointer-events: none;
    }

    .bar {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        height: 2px;
        opacity: 0;
        transform: scaleX(0);
        background: var(--secondary);
        transition:
            transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
            opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    }

    select:focus ~ .bar {
        opacity: 1;
        transform: scaleX(1);
    }
</style>
