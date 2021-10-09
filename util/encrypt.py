"""Python script which can be used to encrypt your Wallet.

> pip install pycryptodome
"""
import gzip
import json
import os

from Crypto.Cipher import AES, ChaCha20_Poly1305
from Crypto.Util import Padding

from derive_key import derive_key


wallet = {
    'accounts': [{
        'name': 'Account test %i' % i,
        'login': 'account_%i@example.com' % i,
        'password': 'azerty_' * 30,
    } for i in range(200)],
    'folders': [
        {'id': 0, 'name': 'All', 'icon': 'home'},
    ],
}

password = b"azerty"
plaintext = json.dumps(wallet).encode()

# GZIP compression
compressed = gzip.compress(plaintext)


# Key derivation
salt = os.urandom(16)
key = derive_key(password, salt)


# xChaCha20 encryption
nonce = os.urandom(24)
cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
ciphertext, signature = cipher.encrypt_and_digest(compressed)
ciphertext = nonce + ciphertext + signature


# AES-CBC encryption
iv = os.urandom(16)
ciphertext = iv + Padding.pad(ciphertext, 16, style='pkcs7')
cipher = AES.new(key, AES.MODE_CBC)
ciphertext = cipher.encrypt(ciphertext)
ciphertext = salt + ciphertext


# Write the file
with open('encrypted.lck', 'wb') as file:
    file.write(ciphertext)
