"""Python script which can be used to decrypt your Wallet.

> pip install pycryptodome
"""
import gzip
import json

from Crypto.Cipher import AES, ChaCha20_Poly1305
from Crypto.Util import Padding

from derive_key import derive_key


password = b"azerty"
with open("wallet.lck", "rb") as file:
    data = file.read()


# Key derivation
salt = data[:16]
key = derive_key(password, salt)


# AES-CBC decryption
ciphertext = data[16:]
cipher = AES.new(key, AES.MODE_CBC)
data = cipher.decrypt(ciphertext)
data = data[16:]  # Remove the IV
data = Padding.unpad(data, 16, style="pkcs7")  # remove the padding


# xChaCha20 decryption
nonce = data[:24]
ciphertext = data[24:-16]
signature = data[-16:]
cipher = ChaCha20_Poly1305.new(key=key, nonce=nonce)
plaintext = cipher.decrypt_and_verify(ciphertext, signature)


# GZIP decompression
decompressed = gzip.decompress(plaintext)

print(json.dumps(json.loads(decompressed.decode()), indent=4))
