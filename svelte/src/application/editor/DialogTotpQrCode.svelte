<script>
    import Button from '../../helpers/Button.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import QRious from 'qrious'

    export let account
    let qrCodeDialogOpen = false

    export function open() {
        qrCodeDialogOpen = true
        setTimeout(() => {
            new QRious({
                element: document.getElementById('qr_code_canvas'),
                value:
                    'otpauth://totp/' +
                    encodeURIComponent(account.name) +
                    ':' +
                    encodeURIComponent(account.login) +
                    '?secret=' +
                    encodeURIComponent(account.totp) +
                    '&issuer=' +
                    encodeURIComponent(account.name),
                foreground: 'var(--on-primary)',
                backgroundAlpha: '0',
            })
        })
    }
</script>

<Dialog
    bind:open={qrCodeDialogOpen}
    class="account_editor_dialog"
    title="2FA QR Code"
>
    <p>Scan this QR Code with Google Authenticator, FreeOTP...</p>
    <p style="text-align: center"><canvas id="qr_code_canvas"></canvas></p>
    <Button
        style="float: right; margin-top: 10px;"
        color="secondary"
        variant="text"
        on:click={() => (qrCodeDialogOpen = false)}
    >
        Close
    </Button>
</Dialog>

<style>
    #qr_code_canvas {
        width: 250px;
        height: 250px;
    }
    p {
        color: var(--on-primary);
    }
</style>
