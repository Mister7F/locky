<script>
        const elId = Math.floor(Math.random() * 10000000)
        export let label = ''
        export let checked = false
</script>

<div>
    <input type="checkbox" id="{elId}" bind:checked={checked} />
    <label for="{elId}">{label}</label>
</div>

<style>
    div {
        display: inline-block;
        position: relative;
        margin: 0 0 20px 0;
        font-size: 16px;
        line-height: 24px;
    }
    input {
        position: absolute;
        top: 0;
        left: 0;
        width: 36px;
        height: 20px;
        opacity: 0;
        z-index: 0;
    }

    label {
        display: block;
        padding: 0 0 0 44px;
        cursor: pointer;
        color: var(--on-primary);
    }
    label:before {
        content: '';
        position: absolute;
        top: 5px;
        left: 0;
        width: 36px;
        height: 14px;
        background-color: color-mix(in srgb, var(--secondary) 15%, transparent);
        border-radius: 14px;
        z-index: 1;
        transition: background-color 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    }

    label:after {
        content: '';
        position: absolute;
        top: 2px;
        left: 0;
        width: 20px;
        height: 20px;
        background-color: var(--secondary);
        border-radius: 14px;
        z-index: 2;
        transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        transition-property: left, background-color;
    }

    input:checked + label:before {
        background-color: color-mix(in srgb, var(--secondary) 60%, transparent);
    }
    input:checked + label:after {
        left: 16px;
        background-color: var(--secondary);
    }
</style>
