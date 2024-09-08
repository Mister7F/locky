# Technologies

Locky has been developed as a PWA server-less, so it can be easily installed on mobile.

The data persistence is done thanks to Dropbox and your password are encrypted using
AES-256 in CBC mode and xChaCha20.

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

To encrypt with xChaCha20

https://github.com/jedisct1/libsodium.js/

## scrypt-async-js

To derive the password with scrypt

https://github.com/dchest/scrypt-async-js

## Svelte material UI

The components are inspired from

https://github.com/hperrin/svelte-material-ui

## Icons

https://fonts.google.com/icons

```html
<link
  href="https://fonts.googleapis.com/icon?family=Material+Icons"
  rel="stylesheet"
/>
<span class="material-icons">family_restroom</span>
```
