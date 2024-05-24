<script>
    import Button from '@smui/button'
    import Dialog, { Title, Content, Actions } from '@smui/dialog'
    import QRious from 'qrious'

    export let account
    let qrCodeDialog

    export function open() {
        qrCodeDialog.open()
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

<Dialog bind:this={qrCodeDialog} class="account_editor_dialog">
    <Title>2FA QR Code</Title>
    <Content>
        <p>Scan this QR Code with Google Authenticator, FreeOTP...</p>
        <p style="text-align: center"><canvas id="qr_code_canvas"></canvas></p>
        <Button
            style="float: right; margin-top: 10px;"
            color="secondary"
            on:click={() => qrCodeDialog.close()}
        >
            Close
        </Button>
    </Content>
</Dialog>

<style>
    #qr_code_canvas {
        width: 250px;
        height: 250px;
    }
</style>
