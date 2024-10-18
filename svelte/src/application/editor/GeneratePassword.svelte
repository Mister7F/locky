<script>
    import Slider from '../../helpers/Slider.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import Button from '../../helpers/Button.svelte'
    import Icon from '../../helpers/Icon.svelte'

    let { onuse } = $props()

    function generate() {
        let password = ''
        let alphabet = ''
        if (useLower) {
            alphabet = alphabet + 'abcdefghijklmnopqrstuvwxyz'
        }
        if (useUpper) {
            alphabet = alphabet + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        }
        if (useNumber) {
            alphabet = alphabet + '0123456789'
        }
        if (useSymbol) {
            alphabet = alphabet + `~&$(){}[]+-*€$£#%^,.:;!?<>@_|'"`
        }

        if (alphabet && passwordLength) {
            const positions = window.crypto.getRandomValues(
                new Uint32Array(passwordLength)
            )
            for (const pos of positions) {
                password = password + alphabet[pos % alphabet.length]
            }
        }
        return password
    }

    let useLower = $state(true)
    let useUpper = $state(true)
    let useNumber = $state(true)
    let useSymbol = $state(true)

    let passwordLength = $state(32)
    let password = $state(generate())
    let generatePasswordDialogOpen = $state(false)

    export function open() {
        generatePasswordDialogOpen = true
    }

    function onUse() {
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
            onclick={() => (useLower = !useLower)}
            variant={useLower ? '' : 'outlined'}
        >
            a
        </Button>
        <Button
            color="secondary"
            onclick={() => (useUpper = !useUpper)}
            variant={useUpper ? '' : 'outlined'}
        >
            A
        </Button>
        <Button
            color="secondary"
            onclick={() => (useNumber = !useNumber)}
            variant={useNumber ? '' : 'outlined'}
        >
            9
        </Button>
        <Button
            color="secondary"
            onclick={() => (useSymbol = !useSymbol)}
            variant={useSymbol ? '' : 'outlined'}
        >
            $
        </Button>
    </div>
    <div class="password-length">
        <Slider min={4} max={50} bind:value={passwordLength} />
        <span>{passwordLength}</span>
    </div>
    <p>{password}</p>

    <Button
        style="margin-top: 10px;"
        color="secondary"
        variant="outlined"
        onclick={onUse}
    >
        Use
    </Button>
    <Button
        style="margin-top: 10px; margin-left: 20px"
        color="secondary"
        variant="outlined"
        onclick={() => (password = generate())}
    >
        Generate
    </Button>
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

    span {
        color: var(--on-primary);
    }
    p {
        width: 200px;
        height: 75px;
        color: var(--on-primary);
        overflow-wrap: anywhere;
    }

    .options {
        width: 100%;
        display: flex;
        justify-content: space-between;
        flex-direction: row;
    }

    .options :global(i) {
        margin: 0;
    }
    .options :global(button) {
        min-width: 0;
        width: 50px;
        text-transform: none;
        margin: 5px 10px;
    }
</style>
