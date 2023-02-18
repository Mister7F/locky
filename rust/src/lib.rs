extern crate crypto;
// sudo snap install rustup --classic
// curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sudo sh
// cargo install wasm-pack

// cargo test --release
// rustfmt ./src/*.rs
// wasm-pack build --target web

// https://github.com/DaGenix/rust-crypto
// https://github.com/buttercup/rust-crypto-wasm

use getrandom;
mod wasm_utils;

use chacha20poly1305::{
    aead::{generic_array::GenericArray, Aead, KeyInit},
    XChaCha20Poly1305,
};

use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use std::io::prelude::*;

use crypto::buffer::{BufferResult, ReadBuffer, WriteBuffer};
use crypto::scrypt::{scrypt, ScryptParams};
use crypto::{aes, blockmodes, buffer, symmetriccipher};
use std::io::Read;
use std::str;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
use wasm_bindgen::prelude::*;


fn derive_key(password: String, salt: &[u8]) -> Vec<u8> {
    assert!(salt.len() == 16);
    let mut result = vec![0u8; 64];
    let params = ScryptParams::new(
        15, // log2(N)
        15, // r
        1,  // p
    );

    scrypt(password.as_bytes(), salt, &params, &mut result);
    result
}

fn aes_encrypt(
    iv: [u8; 16],
    plaintext: Vec<u8>,
    key: &[u8],
) -> Result<Vec<u8>, symmetriccipher::SymmetricCipherError> {
    assert!(iv.len() == 16);

    let mut encryptor =
        aes::cbc_encryptor(aes::KeySize::KeySize256, key, &iv, blockmodes::PkcsPadding);

    let mut final_result = Vec::<u8>::new();
    let mut read_buffer = buffer::RefReadBuffer::new(&plaintext);
    let mut buffer = [0; 4096];
    let mut write_buffer = buffer::RefWriteBuffer::new(&mut buffer);

    loop {
        let result = encryptor.encrypt(&mut read_buffer, &mut write_buffer, true)?;
        final_result.extend(
            write_buffer
                .take_read_buffer()
                .take_remaining()
                .iter()
                .map(|&i| i),
        );
        match result {
            BufferResult::BufferUnderflow => break,
            BufferResult::BufferOverflow => {}
        }
    }
    Ok(final_result)
}

fn aes_decrypt(
    ciphertext: &[u8],
    key: &[u8],
) -> Result<Vec<u8>, symmetriccipher::SymmetricCipherError> {
    let iv = &ciphertext[0..16];
    let ciphertext = &ciphertext[16..ciphertext.len()];
    let mut decryptor =
        aes::cbc_decryptor(aes::KeySize::KeySize256, key, iv, blockmodes::PkcsPadding);
    let mut final_result = Vec::<u8>::new();
    let mut read_buffer = buffer::RefReadBuffer::new(ciphertext);
    let mut buffer = [0; 4096];
    let mut write_buffer = buffer::RefWriteBuffer::new(&mut buffer);
    loop {
        let result = decryptor.decrypt(&mut read_buffer, &mut write_buffer, true)?;
        final_result.extend(
            write_buffer
                .take_read_buffer()
                .take_remaining()
                .iter()
                .map(|&i| i),
        );
        match result {
            BufferResult::BufferUnderflow => break,
            BufferResult::BufferOverflow => {}
        }
    }
    Ok(final_result)
}

#[wasm_bindgen]
pub fn encrypt(plaintext: String, password: String) -> Vec<u8> {
    let mut salt = [0u8; 16];

    getrandom::getrandom(&mut salt).unwrap();

    let key = derive_key(password, &salt);

    let chacha_key = &key[0..32];
    let aes_key = &key[32..64];

    // gzip decompression
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(&plaintext.as_bytes()).unwrap();
    let compressed = encoder.finish().unwrap();

    println!("Uncompressed size {}", plaintext.len());
    println!("Compressed size {}", compressed.clone().len());

    // ChaCha encrypt
    let chacha_key = GenericArray::clone_from_slice(&chacha_key);
    let cipher = XChaCha20Poly1305::new(&chacha_key);
    let mut nonce = [0u8; 24];
    getrandom::getrandom(&mut nonce).unwrap();

    let ciphertext_ = cipher
        .encrypt(&GenericArray::clone_from_slice(&nonce), compressed.as_ref())
        .unwrap();

    assert!(ciphertext_.len() == compressed.len() + 16);

    let mut ciphertext = nonce.to_vec();
    ciphertext.append(&mut ciphertext_.to_vec());

    assert!(ciphertext.len() == compressed.len() + 16 + 24);
    assert!(ciphertext.clone().into_iter().nth(0).unwrap() == nonce[0]);

    // AES encrypt
    let mut iv = [0u8; 16];
    getrandom::getrandom(&mut iv).unwrap();
    let mut ciphertext = aes_encrypt(iv, ciphertext, aes_key).unwrap();

    let mut ret = salt.to_vec();
    ret.append(&mut iv.to_vec());
    ret.append(&mut ciphertext);
    ret
}

#[wasm_bindgen]
pub fn decrypt(ciphertext: &[u8], password: String) -> String {
    let salt = &ciphertext[0..16];
    let ciphertext = &ciphertext[16..ciphertext.len()];
    let key = derive_key(password, salt);

    assert!(key.len() == 64);
    let chacha_key = &key[0..32];
    let aes_key = &key[32..64];

    // aes decryption
    let ciphertext = aes_decrypt(ciphertext, aes_key).unwrap();

    // chacha decryption
    let cipher = XChaCha20Poly1305::new(&GenericArray::clone_from_slice(chacha_key));
    let nonce = GenericArray::clone_from_slice(&ciphertext[0..24]);
    let ciphertext = &ciphertext[24..ciphertext.len()];
    let compressed_plaintext = cipher.decrypt(&nonce, ciphertext.as_ref()).unwrap();

    // gzip decompression
    let mut plaintext = Vec::new();
    let mut z = GzDecoder::new(&compressed_plaintext[..]);
    z.read_to_end(&mut plaintext).unwrap();
    str::from_utf8(&plaintext).unwrap().to_string()
}


#[wasm_bindgen]
pub fn test() {
    wasm_utils::log("encrypt");

    wasm_utils::Timeout::new(0, || wasm_utils::log("timeout"));

    let password = "azerty".to_string();
    let salt: [u8; 16] = [
        4, 54, 154, 21, 59, 78, 188, 101, 17, 207, 254, 9, 181, 89, 11, 3,
    ];
    let key = derive_key(password.clone(), &salt);

}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn key_derivation() {
        let password = "azerty".to_string();
        let salt: [u8; 16] = [
            4, 54, 154, 21, 59, 78, 188, 101, 17, 207, 254, 9, 181, 89, 11, 3,
        ];
        let key = derive_key(password.clone(), &salt);
        assert_eq!(
            key,
            [
                85, 197, 233, 24, 204, 52, 126, 105, 102, 49, 200, 165, 35, 202, 243, 191, 240, 41,
                99, 8, 33, 22, 120, 221, 205, 140, 50, 78, 101, 25, 34, 84, 165, 233, 173, 116,
                182, 206, 59, 124, 110, 61, 248, 56, 149, 220, 10, 193, 79, 147, 217, 232, 17, 150,
                197, 159, 36, 148, 17, 225, 101, 216, 102, 189
            ]
        );
        assert_eq!(64, key.len());
    }

    #[test]
    fn decryption() {
        let password = "azerty".to_string();
        let ciphertext = [
            237, 24, 155, 102, 84, 238, 6, 208, 60, 131, 250, 20, 63, 223, 12, 112, 21, 228, 225,
            224, 242, 172, 194, 238, 35, 53, 139, 143, 66, 52, 210, 199, 111, 199, 96, 42, 173,
            147, 219, 162, 160, 237, 73, 254, 36, 25, 31, 139, 123, 49, 227, 225, 52, 27, 202, 58,
            68, 248, 138, 99, 218, 48, 239, 211, 180, 186, 163, 50, 80, 56, 184, 120, 175, 7, 184,
            26, 234, 196, 158, 26, 62, 57, 44, 205, 201, 63, 92, 37, 86, 131, 223, 223, 238, 238,
            246, 181, 60, 71, 143, 88, 224, 93, 150, 218, 231, 191, 196, 129, 63, 124, 183, 200,
        ];
        let plaintext = decrypt(&ciphertext, password);
        assert_eq!(plaintext, "this is a test");
    }
    #[test]
    fn encryption() {
        let password = "azerty".to_string();
        let ciphertext = encrypt("this is a test".to_string(), password.clone());
        assert_eq!(112, ciphertext.len());
        let plaintext = decrypt(&ciphertext, password);
        assert_eq!(plaintext, "this is a test");
    }
}
