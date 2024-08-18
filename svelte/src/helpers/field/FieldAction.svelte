<script>
    import TextInput from '../../helpers/TextInput.svelte'
    import Icon from '../Icon.svelte'
    import IconButton from '../IconButton.svelte'
    import Button from '../Button.svelte'
    import Dialog from '../../helpers/Dialog.svelte'

    let { type = $bindable('text'), label = $bindable(''), onremove } = $props()

    let fieldNameDialogOpen = $state(false)
    let deleteConfirmation = $state(false)

    function onDelete() {
        onremove()
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
    onclick={() => (fieldNameDialogOpen = true)}
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
        onclick={() => (type = 'text')}
    />
    <Button
        class="field_type_button"
        icon="vpn_key"
        color="secondary"
        variant={type === 'password' ? '' : 'outlined'}
        onclick={() => (type = 'password')}
    />
    <Button
        class="field_type_button"
        icon="link"
        color="secondary"
        variant={type === 'url' ? '' : 'outlined'}
        onclick={() => (type = 'url')}
    />
    <br />
    Rename
    <br />
    <TextInput
        class="field_name"
        onkeypress={onKeyPressFieldLabel}
        bind:value={label}
    />

    <div slot="actions">
        {#if deleteConfirmation}
            <Button
                style="float: right; margin-top: 10px;"
                color="secondary"
                variant="outlined"
                onclick={() => (deleteConfirmation = false)}
            >
                Cancel
            </Button>
            <Button
                style="float: right; margin-top: 10px;"
                color="secondary"
                variant="text"
                onclick={onDelete}
            >
                Delete
            </Button>
        {:else}
            <Button
                style="float: right; margin-top: 10px;"
                color="secondary"
                variant="text"
                onclick={() => (deleteConfirmation = true)}
            >
                Delete
            </Button>
            <Button
                style="float: right; margin-top: 10px;"
                color="secondary"
                variant="outlined"
                onclick={() => (fieldNameDialogOpen = false)}
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
