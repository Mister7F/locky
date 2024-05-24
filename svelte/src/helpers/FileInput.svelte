<script>
    import IconButton, { Icon } from '@smui/icon-button'
    import Button, { Label } from '@smui/button'
    import { createEventDispatcher } from 'svelte'

    const dispatch = createEventDispatcher()

    let filedata = null
    let filename = null

    let fileInput = null

    $: truncatedFilename =
        !filename || filename.length <= 18
            ? filename
            : filename.substr(0, 15) + '...'

    async function onFileUploaded(event) {
        const target = event.target

        const file = target.files && target.files.length && target.files[0]
        if (!file) {
            filename = null
            filedata = null
            dispatch('removed')
            return
        }

        filename = file.name
        filedata = await file.arrayBuffer()
        dispatch('uploaded', { file: filedata })
    }
</script>

<div class="file">
    <Button
        color="secondary"
        variant="outlined"
        on:click={() => fileInput.click()}
    >
        <Icon class="material-icons">file_upload</Icon>
        <Label>{truncatedFilename || 'Upload'}</Label>
    </Button>
    <input on:change={onFileUploaded} type="file" bind:this={fileInput} />
</div>

<style>
    .file {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }
    input {
        display: none;
    }
</style>
