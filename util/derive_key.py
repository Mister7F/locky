import base64

from passlib.hash import argon2
""" Javascript equivalent,

sodium.crypto_pwhash(32, password, salt, 4,
    8192 * 1024, sodium.crypto_pwhash_ALG_ARGON2ID13, "uint8array")

8192 * 1024    ->   in JS, the memory is in bytes and not in Kb !
"""


def derive_key(password, salt):
    if len(salt) != 16:
        raise Exception('Salt length must be 16')

    hash = argon2.using(
        digest_size=32,  # 256 bits, same size as the AES-256 key
        rounds=3,
        memory_cost=8192,
        salt=salt,
        parallelism=1,
    ).hash(password)

    # By default the hash has to form, extract the hash to convert it into bytes array
    # $argon2id$v=19$m=8192,t=4,p=1$MTIzNDU2Nzg5MGFiY2RlZg$Ocn6YCtS979y84KsIOSUFw
    hash = hash.split("$")[-1] + "============"
    hash = base64.b64decode(hash)
    return hash
