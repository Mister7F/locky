<script>
    import Textfield from '@smui/textfield'

    import Icon from '../Icon.svelte'
    import IconButton from '../IconButton.svelte'
    import Button from '../Button.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import { createEventDispatcher } from 'svelte'

    const dispatch = createEventDispatcher()

    export let type = 'text'
    export let label = ''

    let fieldNameDialogOpen = false

    let deleteConfirmation = false

    function onDelete() {
        dispatch('remove')
        deleteConfirmation = false
    }

    function onKeyPressFieldLabel(e) {
        if (!e) e = window.event
        if ((e.keyCode || e.which) == 13) {
            // Press enter
            fieldNameDialogOpen = false
            return false
        }
    }
</script>

<IconButton
    on:click={() => (fieldNameDialogOpen = true)}
    color="on-primary"
    icon="create"
/>

<Dialog bind:open={fieldNameDialogOpen} title="Edit Field">
    Change type
    <br />
    <Button
        class="field_type_button"
        icon="title"
        color="secondary"
        variant={type === 'text' ? '' : 'outlined'}
        on:click={() => (type = 'text')}
    />
    <Button
        class="field_type_button"
        icon="vpn_key"
        color="secondary"
        variant={type === 'password' ? '' : 'outlined'}
        on:click={() => (type = 'password')}
    />
    <Button
        class="field_type_button"
        icon="link"
        color="secondary"
        variant={type === 'url' ? '' : 'outlined'}
        on:click={() => (type = 'url')}
    />
    <br />
    Rename
    <br />
    <Textfield
        class="field_name"
        on:keypress={onKeyPressFieldLabel}
        bind:value={label}
    />

    <div slot="actions">
        {#if deleteConfirmation}
            <Button
                style="float: right; margin-top: 10px;"
                color="secondary"
                variant="outlined"
                on:click={() => (deleteConfirmation = false)}
            >
                Cancel
            </Button>
            <Button
                style="float: right; margin-top: 10px;"
                color="secondary"
                variant="text"
                on:click={onDelete}
            >
                Delete
            </Button>
        {:else}
            <Button
                style="float: right; margin-top: 10px;"
                color="secondary"
                variant="text"
                on:click={() => (deleteConfirmation = true)}
            >
                Delete
            </Button>
            <Button
                style="float: right; margin-top: 10px;"
                color="secondary"
                variant="outlined"
                on:click={() => (fieldNameDialogOpen = false)}
            >
                Close
            </Button>
        {/if}
    </div>
</Dialog>

<style>
    :global(.menu_field_type) {
        margin-top: 310px;
        margin-left: -60px;
        min-width: 60px;
        width: 60px;
        z-index: 999999;
        box-sizing: border-box;
    }
    :global(.field_type_button) {
        margin: 10px 20px;
    }
    :global(.field_name) {
        width: 100%;
    }
</style>
