<script>
    import IconButton from '../Icon.svelte';
    import Switch from '@smui/switch';
    import FormField from '@smui/form-field';

    import Button from '@smui/button';
    import Dialog, { Title, Content, Actions } from '@smui/dialog';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    export let strengthResult;
    let detailDialog;

    let visible = false;

    function open() {
        detailDialog.open();
    }

</script>

<div>
    <IconButton on:click="{open}">warning</IconButton>
</div>

<Dialog class="password_strength_dialog" bind:this="{detailDialog}">
    <Title>Weak password</Title>

    <Content>
        <p>Cracking time</p>
        <ul>
            <li>
                1e10 per second:
                {strengthResult.crack_times_display.offline_fast_hashing_1e10_per_second}
            </li>
            <li>
                1e4 per second:
                {strengthResult.crack_times_display.offline_slow_hashing_1e4_per_second}
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

        <FormField>
            <Switch bind:checked="{visible}" />
            <span slot="label">Show sequence</span>
        </FormField>

        {#if strengthResult.feedback.warning}
            <p>{strengthResult.feedback.warning}</p>
        {/if}
    </Content>
    <Button on:click="{() => detailDialog.close()}">Close</Button>
</Dialog>

<style>
    p {
        margin-bottom: 0;
    }
    ul {
        padding-left: 15px;
        margin-top: 0;
    }
    :global(.password_strength_dialog .mdc-dialog__surface) {
        max-width: 400px !important;
    }

    span {
        color: rgba(74, 101, 114, 0.6);
    }

</style>
