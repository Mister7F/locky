"""Python script which can be used to decrypt your Wallet.

> pip install pycryptodome
"""
import gzip
import json

from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Util import Padding


password = b"azerty"
with open("wallet.lck", "rb") as file:
    data = file.read()


salt = data[:16]
ciphertext = data[16:]
key = PBKDF2(password, salt, 32, count=100000, hmac_hash_module=SHA256)

cipher = AES.new(key, AES.MODE_CBC)
plaintext = cipher.decrypt(ciphertext)

# Remove the IV
plaintext = plaintext[16:]

plaintext = Padding.unpad(plaintext, 16, style='pkcs7')

decompressed = gzip.decompress(plaintext)

print(json.dumps(json.loads(decompressed.decode()), indent=4))
