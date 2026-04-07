use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use keyring::Entry;
use rand::RngCore;
use thiserror::Error;

const SERVICE_NAME: &str = "ferrumdb";
const KEY_ACCOUNT: &str = "encryption_key";

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
    #[error("Keyring error: {0}")]
    KeyringError(String),
    #[error("Key not found")]
    KeyNotFound,
}

/// Generate a random 256-bit key
fn generate_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut key);
    key
}

/// Get or create the encryption key from the system keyring
pub fn get_or_create_key() -> Result<[u8; 32], CryptoError> {
    let entry = Entry::new(SERVICE_NAME, KEY_ACCOUNT)
        .map_err(|e| CryptoError::KeyringError(e.to_string()))?;

    // Try to retrieve existing key
    if let Ok(key_str) = entry.get_password() {
        let key_bytes = BASE64.decode(&key_str)
            .map_err(|e| CryptoError::KeyringError(e.to_string()))?;

        if key_bytes.len() == 32 {
            let mut key = [0u8; 32];
            key.copy_from_slice(&key_bytes);
            return Ok(key);
        }
    }

    // Generate new key and store in keyring
    let key = generate_key();
    let key_str = BASE64.encode(key);

    entry.set_password(&key_str)
        .map_err(|e| CryptoError::KeyringError(e.to_string()))?;

    Ok(key)
}

/// Encrypt a password using AES-256-GCM
pub fn encrypt_password(plaintext: &str) -> Result<String, CryptoError> {
    let key = get_or_create_key()?;
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

    // Generate random 96-bit nonce
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Encrypt
    let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?;

    // Combine nonce + ciphertext and encode as base64
    let mut combined = nonce_bytes.to_vec();
    combined.extend(ciphertext);

    Ok(BASE64.encode(combined))
}

/// Decrypt a password using AES-256-GCM
pub fn decrypt_password(ciphertext: &str) -> Result<String, CryptoError> {
    let key = get_or_create_key()?;
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

    // Decode base64
    let combined = BASE64.decode(ciphertext)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

    if combined.len() < 12 {
        return Err(CryptoError::DecryptionFailed("Invalid ciphertext".to_string()));
    }

    // Split nonce and ciphertext
    let (nonce_bytes, ciphertext_bytes) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    // Decrypt
    let plaintext = cipher.decrypt(nonce, ciphertext_bytes)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))?;

    String::from_utf8(plaintext)
        .map_err(|e| CryptoError::DecryptionFailed(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let plaintext = "my_secret_password";

        let encrypted = encrypt_password(plaintext).unwrap();
        assert_ne!(encrypted, plaintext);

        let decrypted = decrypt_password(&encrypted).unwrap();
        assert_eq!(decrypted, plaintext);
    }
}