<script>
    import Button from './Button.svelte'
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

<Button
    class="file_input_button"
    color="secondary"
    variant="outlined"
    icon="file_upload"
    on:click={() => fileInput.click()}
>
    {truncatedFilename || 'Upload'}
</Button>
<input on:change={onFileUploaded} type="file" bind:this={fileInput} />

<style>
    :global(.file_input_button) {
        width: 100%;
    }
    input {
        display: none;
    }
</style>
