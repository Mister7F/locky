"""Python script which can be used to encrypt your Wallet.

> pip install pycryptodome
"""
import gzip
import json
import os

from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Util import Padding


wallet = {
    'accounts': [
        {'name': 'Account test %i' % i} for i in range(1000)
    ],
    'folders': [
        {'id': 0, 'name': 'All', 'icon': 'home'},
    ],
}

password = b"azerty"
plaintext = json.dumps(wallet).encode()

salt = os.urandom(16)
iv = os.urandom(16)

key = PBKDF2(password, salt, 32, count=100000, hmac_hash_module=SHA256)

compressed = gzip.compress(plaintext)
data = iv + Padding.pad(compressed, 16, style='pkcs7')

cipher = AES.new(key, AES.MODE_CBC)
ciphertext = cipher.encrypt(data)

ciphertext = salt + ciphertext

with open('encrypted.lck', 'wb') as file:
    file.write(ciphertext)
