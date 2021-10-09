# Technologies
Locky has been developed as a PWA server-less, so it can be easily installed on mobile.

The data persistence is done thanks to Google Drive and your password are encrypted using
AES-256 in CBC mode.

Your password will be compressed, encrypted and save in the indexDB of your browser, so
when you refresh the page you keep your password.

You can synchronize your passwords with Dropbox or download the encrypted wallet to save
it on your disk (if you want to host your own instance of Locky, you might want to change
the Dropbox API client id to match your domain name).

## Dropbox
Dropbox app
https://www.dropbox.com/developers/apps/info/c53nc5eenquwokp

Documentation;
https://dropbox.github.io/dropbox-sdk-js/

## Compression
https://github.com/101arrowz/fflate

## Lib Sodium
To encrypt with xChaCha20 and derive key with Argon2id

https://github.com/jedisct1/libsodium.js/

## Svelte material UI
https://github.com/hperrin/svelte-material-ui
