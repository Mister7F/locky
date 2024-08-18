<script>
    import Switch from '../../helpers/Switch.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import IconButton from '../IconButton.svelte'

    let { strengthResult } = $props()

    let detailDialogOpen = $state(false)
    let visible = $state(false)

    function open() {
        detailDialogOpen = true
    }
</script>

<div>
    <IconButton onclick={open} icon="warning" />
</div>

<Dialog bind:open={detailDialogOpen} title="Weak password">
    <p>Cracking time</p>

    <ul>
        <li>
            1e10 per second:
            {strengthResult.crack_times_display
                .offline_fast_hashing_1e10_per_second}
        </li>
        <li>
            1e4 per second:
            {strengthResult.crack_times_display
                .offline_slow_hashing_1e4_per_second}
        </li>
    </ul>
    <p>Sequences</p>
    <ul>
        {#each strengthResult.sequence as sequence}
            <li>
                {sequence.pattern}:
                {visible ? sequence.base_token || sequence.token : '••••••'}
            </li>
        {/each}
    </ul>

    <Switch label="Show sequence" bind:checked={visible} />

    {#if strengthResult.feedback.warning}
        <p>{strengthResult.feedback.warning}</p>
    {/if}
</Dialog>

<style>
    p {
        margin-bottom: 0;
    }
    ul {
        padding-left: 15px;
        margin-top: 0;
    }
    p,
    li {
        color: var(--on-primary);
    }
</style>
