<script lang="ts">
    import IconButton from '../../helpers/IconButton.svelte'

    import Icon from '../../helpers/Icon.svelte'
    import { onMount } from 'svelte'
    import Field from '../../helpers/field/Field.svelte'
    import Img from '../../helpers/Img.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import Button from '../../helpers/Button.svelte'

    interface Props {
        src: string
        chooseIcon?: boolean
        readonly: boolean
        size: string
        srcs: string[]
    }

    let {
        src = $bindable(''),
        chooseIcon = false,
        readonly = false,
        size = '100px',
        srcs = $bindable([]),
    }: Props = $props()

    let previewSrc = $state(src || 'img/accounts/default.svg')
    let searchValue = $state('')
    let downloadError = $state('')
    let svgDialogOpen = $state(false)
    let svgCode = $state('')
    let svgError = $state('')

    const MAX_STORED_IMAGE_SIZE = 1024 * 1024

    let currentSrcs = $derived(
        !searchValue || !searchValue.length
            ? srcs
            : srcs.filter((url) => {
                  return (
                      url.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0
                  )
              })
    )

    // Fetch the list of account logos
    onMount(async () => {
        let response = await fetch('img/accounts/files.txt')
        srcs = (await response.text())
            .split(/\r?\n/)
            .filter((url) => url && url.length)
            .map((src) => 'img/accounts/' + src)
    })

    function open() {
        chooseIcon = readonly ? false : true
    }

    function choose(isrc: string) {
        searchValue = ''
        downloadError = ''
        src = isrc
        previewSrc = isrc || 'img/accounts/default.svg'
        chooseIcon = false
    }

    async function downloadAndChoose() {
        downloadError = ''

        try {
            const response = await fetch(src, {
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
            })
            if (!response.ok) {
                throw new Error(`Image download failed (${response.status})`)
            }

            const image = await response.blob()
            if (!image.type.startsWith('image/')) {
                throw new Error('The URL did not return an image')
            }
            if (image.size > MAX_STORED_IMAGE_SIZE) {
                throw new Error('The image is larger than 1 MiB')
            }

            choose(await blobToDataUri(image))
        } catch (error) {
            console.error(error)
            downloadError =
                error instanceof TypeError
                    ? 'The image could not be downloaded (the server may block cross-origin access)'
                    : error instanceof Error
                      ? error.message
                      : 'The image could not be downloaded'
        }
    }

    function blobToDataUri(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
        })
    }

    async function storeSvg() {
        svgError = ''

        if (svgCode.length > MAX_STORED_IMAGE_SIZE) {
            svgError = 'The SVG is larger than 1 MiB'
            return
        }

        const dataUri = await blobToDataUri(
            new Blob([svgCode], { type: 'image/svg+xml' })
        )
        svgDialogOpen = false
        svgCode = ''
        choose(dataUri)
    }
</script>

<div class="image_picker" style="--size: {size}">
    <div class="img {readonly ? 'readonly' : ''}" onclick={open}>
        <Img src={previewSrc} alt={previewSrc} />
    </div>
    <div class="icons {chooseIcon && !readonly ? 'visible' : ''}">
        <div class="img-header">
            <div class="url">
                <Field
                    label="Image URL"
                    copy={false}
                    bind:value={src}
                    message={downloadError}
                    messagePersistent={true}
                    oninput={() => (downloadError = '')}
                />
                <div class="url-actions">
                    <IconButton
                        title="Use image URL"
                        onclick={() => choose(src)}
                        icon="link"
                    />
                    <IconButton
                        title="Download and store image"
                        onclick={downloadAndChoose}
                        icon="download"
                    />
                    <IconButton
                        title="Enter SVG code"
                        onclick={() => {
                            svgError = ''
                            svgDialogOpen = true
                        }}
                        icon="code"
                    />
                </div>
            </div>
            <Field label="Search" copy={false} bind:value={searchValue} />
        </div>
        <div class="container">
            {#each currentSrcs as iconSrc}
                <img
                    src={iconSrc}
                    onclick={() => choose(iconSrc)}
                    alt={iconSrc}
                />
            {/each}
        </div>
    </div>
</div>

<Dialog bind:open={svgDialogOpen} title="Store SVG code">
    <textarea
        bind:value={svgCode}
        oninput={() => (svgError = '')}
        placeholder="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot;>…</svg>"
        spellcheck="false"
    ></textarea>
    {#if svgError}
        <div class="svg-error">{svgError}</div>
    {/if}

    {#snippet actions()}
        <Button
            onclick={() => (svgDialogOpen = false)}
            color="secondary"
            variant="outlined"
        >
            Cancel
        </Button>
        <Button onclick={storeSvg} color="primary">Store SVG</Button>
    {/snippet}
</Dialog>

<style>
    .image_picker {
        width: 100%;
        max-height: 100%;
    }

    .img {
        cursor: pointer;
        width: var(--size);
        margin: auto;
        max-width: 100%;
        max-height: 100%;
    }

    .image_picker :global(svg),
    .image_picker :global(Img),
    img {
        max-width: 100%;
        max-height: 100%;
        height: var(--size);
        margin: auto;
    }

    .readonly {
        cursor: default;
    }
    .icons {
        position: absolute;
        z-index: 99999999;
        top: 0;
        left: 0;
        width: 100%;
        overflow-y: scroll;
        height: 0;
        transition: 0.4s;
        padding: 0 20px;
        box-sizing: border-box;
        transition-timing-function: ease-in-out;
        background-color: var(--primary);
    }

    .icons.visible {
        height: 100vh;
    }

    .icons img {
        max-width: 40px;
        max-height: 40px;
        margin: 10px;
        cursor: pointer;
    }

    .container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        margin-top: 10px;
        max-height: calc(100% - 155px);
        overflow: hidden;
        overflow-y: auto;
        width: 90%;
        margin: auto;
        padding-top: 10px;
    }

    .container::after {
        /* To align the last row to the left */
        content: '';
        flex: auto;
    }

    .img-header {
        width: 100%;
        position: sticky;
        height: 140px;
        padding-top: 15px;
    }

    .url {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }

    .url > :global(.field) {
        flex: 1;
        min-width: 0;
    }

    .url-actions {
        display: flex;
        flex-direction: row;
    }

    textarea {
        box-sizing: border-box;
        width: min(600px, 70vw);
        height: min(350px, 50vh);
        resize: vertical;
        border: 1px solid var(--on-primary);
        border-radius: 4px;
        padding: 10px;
        color: var(--on-primary);
        background: var(--primary);
        font-family: monospace;
    }

    textarea:focus {
        border-color: var(--secondary);
        outline: none;
    }

    .svg-error {
        margin-top: 8px;
        color: var(--error);
    }
</style>
