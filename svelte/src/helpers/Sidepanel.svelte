<script lang="ts">
    interface Props {
        visible?: boolean
        onclose?: () => any
        children: () => any
    }

    let {
        visible = $bindable(false),
        onclose = null,
        children,
    }: Props = $props()

    function onClose() {
        visible = false
        onclose && onclose()
    }
</script>

{#if visible}
    <div class="overlay" onclick={onClose}></div>
{/if}
<div class="panel {visible ? '' : 'hidden'}">
    {@render children()}
</div>

<style>
    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: RGBA(0, 0, 0, 0.6);
        z-index: 9;
    }
    .panel {
        position: fixed;
        top: 0;
        z-index: 40;
        width: 400px;
        max-width: 100%;
        height: 100%;
        background-color: var(--background);
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        transition-duration: 0.2s;
        transition-property: transform, visibility;
        transition-timing-function: ease-in;
        will-change: transform, visibility;
        transform-style: preserve-3d;

        transform: translateX(0);
        visibility: visible;
    }

    .panel.hidden {
        visibility: hidden;
        transform: translateX(-256px);
    }
</style>
