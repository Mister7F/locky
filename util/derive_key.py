import time

from Crypto.Protocol.KDF import scrypt


def derive_key(password, salt):
    if len(salt) != 16:
        raise Exception('Salt length must be 16')

    t = time.time()

    hash = scrypt(
        password=password,
        salt=salt,
        key_len=64,
        N=32768,  # time and memory complexity
        r=15,  # number of rounds
        p=1,  # parallelism
    )

    print('Key derivation took', (time.time() - t) * 1000, 'ms')

    return hash
