<script>
    let { title, open = $bindable(false) } = $props()

    function onClose(event) {
        if (event.target.classList.contains('background')) {
            open = false
        }
    }
</script>

{#if open}
    <div class="background" onclick={onClose}>
        <div class="dialog">
            <span class="title">{title}</span>
            <hr />
            <div class="content">
                <slot />
            </div>
            <br />
            <div class="actions">
                <slot name="actions" />
            </div>
        </div>
    </div>
{/if}

<style>
    .background {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        height: 100vh;
        width: 100vw;
        background-color: rgba(74, 101, 114, 0.32);
        z-index: 99999;
    }

    .title {
        font-size: 1.25rem;
        font-weight: 500;
        letter-spacing: 0.0125em;
    }
    span {
        color: var(--on-primary);
    }

    .dialog {
        box-shadow:
            0 19px 38px rgba(0, 0, 0, 0.3),
            0 15px 12px rgba(0, 0, 0, 0.22);
        border-radius: 4px;
        padding: 20px 30px;
        max-width: 50%;
        min-width: 100px;
        min-height: 100px;
        margin: auto;
        color: var(--on-primary);
        background: var(--primary);
    }

    hr,
    .content {
        color: var(--on-primary);
    }

    .actions > :global(div) {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }
</style>
