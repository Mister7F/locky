<script lang="ts">
    import Slider from '../../helpers/Slider.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import Button from '../../helpers/Button.svelte'
    import Icon from '../../helpers/Icon.svelte'
    import { concatenate, generatePassword } from '../../helpers/crypto.ts'

    interface Props {
        onuse: (password: string) => void
    }

    let { onuse }: Props = $props()

    let mouseEntropy = Promise.resolve(new Uint8Array())
    let lastPointerX: number | undefined
    let lastPointerY: number | undefined
    let mouseSampleCount = $state(0)
    let generation = 0

    function getAlphabet() {
        let alphabet = ''
        if (useLower) {
            alphabet += 'abcdefghijklmnopqrstuvwxyz'
        }
        if (useUpper) {
            alphabet += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        }
        if (useNumber) {
            alphabet += '0123456789'
        }
        if (useSymbol) {
            alphabet += `+-,.:;!?@_`
        }
        if (useComplexSymbol) {
            alphabet += `~&$(){}[]+-*€$£#%^,.:;!?<>@_|'"`
        }
        return [...new Set(alphabet)].join('')
    }

    let useLower = $state(true)
    let useUpper = $state(true)
    let useNumber = $state(true)
    let useSymbol = $state(true)
    let useComplexSymbol = $state(false)

    let passwordLength = $state(32)
    let password = $state('')
    let generatePasswordDialogOpen = $state(false)
    let entropyBits = $derived(
        passwordLength * Math.log2(getAlphabet().length || 1)
    )
    let requiredMouseSamples = $derived(Math.ceil(entropyBits))
    let mouseReady = $derived(
        requiredMouseSamples > 0 && mouseSampleCount >= requiredMouseSamples
    )

    async function regenerate() {
        const currentGeneration = ++generation
        password = ''
        if (!mouseReady) {
            return
        }
        const additionalEntropy = await mouseEntropy
        if (currentGeneration !== generation) {
            return
        }
        const generated = await generatePassword(
            getAlphabet(),
            passwordLength,
            additionalEntropy
        )
        if (currentGeneration === generation) {
            password = generated
        }
    }

    function collectMouseEntropy(event: PointerEvent) {
        if (
            !event.isTrusted ||
            (event.clientX === lastPointerX && event.clientY === lastPointerY)
        ) {
            return
        }
        lastPointerX = event.clientX
        lastPointerY = event.clientY

        const sample = new Uint8Array(72)
        const view = new DataView(sample.buffer)
        const values = [
            event.timeStamp,
            performance.now(),
            event.clientX,
            event.clientY,
            event.screenX,
            event.screenY,
            event.movementX,
            event.movementY,
            event.pressure,
        ]
        values.forEach((value, index) =>
            view.setFloat64(index * 8, value, false)
        )
        mouseEntropy = mouseEntropy.then(
            async (entropy) =>
                new Uint8Array(
                    await window.crypto.subtle.digest(
                        'SHA-512',
                        concatenate(entropy, sample) as BufferSource
                    )
                )
        )
        mouseSampleCount += 1
        regenerate()
    }

    export function open() {
        generation += 1
        mouseEntropy = Promise.resolve(new Uint8Array())
        mouseSampleCount = 0
        lastPointerX = undefined
        lastPointerY = undefined
        generatePasswordDialogOpen = true
        password = ''
    }

    function onUse() {
        generation += 1
        const newPassword = password
        password = ''
        generatePasswordDialogOpen = false
        onuse(newPassword)
    }
</script>

<Dialog bind:open={generatePasswordDialogOpen} title="Generate a password">
    <div class="options">
        <Button
            color="secondary"
            onclick={() => {
                useLower = !useLower
                regenerate()
            }}
            variant={useLower ? 'standard' : 'outlined'}
            title="Lower case"
        >
            a
        </Button>
        <Button
            color="secondary"
            onclick={() => {
                useUpper = !useUpper
                regenerate()
            }}
            variant={useUpper ? 'standard' : 'outlined'}
            title="Upper case"
        >
            A
        </Button>
        <Button
            color="secondary"
            onclick={() => {
                useNumber = !useNumber
                regenerate()
            }}
            variant={useNumber ? 'standard' : 'outlined'}
            title="Digits"
        >
            9
        </Button>
        <Button
            color="secondary"
            onclick={() => {
                useSymbol = !useSymbol
                regenerate()
            }}
            variant={useSymbol ? 'standard' : 'outlined'}
            title="Standard symbols"
        >
            !
        </Button>
        <Button
            color="secondary"
            onclick={() => {
                useComplexSymbol = !useComplexSymbol
                regenerate()
            }}
            variant={useComplexSymbol ? 'standard' : 'outlined'}
            title="Complex symbols"
        >
            £
        </Button>
    </div>
    <div class="password-length">
        <Slider
            min={4}
            max={64}
            bind:value={passwordLength}
            onchange={regenerate}
        />
        <span>{passwordLength}</span>
    </div>
    <div class="entropy-panel" onpointermove={collectMouseEntropy}>
        <Icon>gesture</Icon>
        <span>
            Move your pointer to add entropy
            <br />
            (<span>{mouseSampleCount}/{requiredMouseSamples} samples</span>)
        </span>
    </div>
    <span class:weak={entropyBits < 128}>
        Entropy: {entropyBits.toFixed(1)} bits
    </span>
    <div class="password">{password}</div>

    {#snippet actions()}
        <Button
            color="secondary"
            variant="outlined"
            onclick={onUse}
            disabled={!password || !mouseReady}
        >
            Use
        </Button>
        <Button
            color="secondary"
            variant="outlined"
            onclick={regenerate}
            disabled={!mouseReady}
        >
            Generate
        </Button>
    {/snippet}
</Dialog>

<style>
    .password-length {
        padding-top: 20px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
    .password-length span {
        margin-left: 10px;
        color: var(--on-primary);
    }

    .entropy-panel {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        height: 120px;
        margin: 16px 0 8px;
        padding: 12px;
        border: 1px dashed var(--secondary);
        border-radius: 4px;
        color: var(--on-primary);
        text-align: center;
        touch-action: none;
        user-select: none;
    }

    .entropy-panel :global(i) {
        margin: 0;
    }

    .weak {
        color: var(--error);
    }

    span {
        color: var(--on-primary);
    }
    .password {
        width: 0;
        min-width: 100%;
        min-height: 75px;
        margin: 16px 0;
        color: var(--on-primary);
        font-family: monospace;
        line-break: anywhere;
    }

    .options {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: space-between;
        flex-direction: row;
    }

    .options :global(i) {
        margin: 0;
    }
    .options :global(button) {
        min-width: 0;
        width: 50px;
        flex: 0 0 50px;
        text-transform: none;
        margin: 0;
    }
</style>
