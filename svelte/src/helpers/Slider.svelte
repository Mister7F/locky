<script>
    // Modified from:
    // https://codepen.io/manikantag/pen/rZpNXm
    let { min, max, value = $bindable() } = $props()
</script>

<div class="slider">
    <input type="range" {min} {max} bind:value />
</div>

<style>
    .slider {
        display: inline-block;
        font-size: 14px;
        line-height: 20px;
        width: 100%;
        margin: 5px 10px;
    }

    input {
        position: relative;
        display: block;
        -webkit-appearance: none;
        margin: 0;
        width: 100%;
        cursor: pointer;
        background: var(--primary);
    }

    input:focus {
        outline: none;
    }

    input::-webkit-slider-runnable-track {
        margin: 9px 0;
        border-radius: 1px;
        width: 100%;
        height: 2px;
        background: color-mix(in srgb, var(--secondary) 50%, transparent);
    }

    input::-moz-range-track {
        margin: 9px 0;
        border-radius: 1px;
        width: 100%;
        height: 2px;
        background: color-mix(in srgb, var(--secondary) 50%, transparent);
    }

    input::-ms-track {
        margin: 9px 0;
        border-radius: 1px;
        width: 100%;
        height: 2px;
        background: color-mix(in srgb, var(--secondary) 50%, transparent);
    }

    input::-webkit-slider-thumb {
        appearance: none;
        -webkit-appearance: none;
        border: none;
        border-radius: 50%;
        height: 2px;
        width: 2px;
        background: var(--secondary);
        transform: scale(6, 6);
        transition: transform 0.3s;
    }

    input::-moz-range-thumb {
        appearance: none;
        -moz-appearance: none;
        border: none;
        border-radius: 50%;
        height: 2px;
        width: 2px;
        background: var(--secondary);
        transform: scale(6, 6);
        transition: transform 0.3s;
    }

    input::-ms-thumb {
        appearance: none;
        border: none;
        border-radius: 50%;
        height: 2px;
        width: 2px;
        background: var(--secondary);
        transform: scale(6, 6);
        transition: transform 0.3s;
    }

    input:active::-webkit-slider-thumb {
        transform: scale(10, 10);
    }

    input:active::-moz-range-thumb {
        transform: scale(10, 10);
    }

    input:active::-ms-thumb {
        transform: scale(10, 10);
    }
</style>
