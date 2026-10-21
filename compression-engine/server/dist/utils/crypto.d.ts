/**
 * AES-256-GCM encryption for sensitive data at rest (API keys, tokens).
 *
 * Storage format (base64-encoded):  IV(12) || TAG(16) || CIPHERTEXT
 *
 * The encryption key comes from ENCRYPTION_KEY env var — a 32-byte
 * (64-hex-char) random value. Rotating this key requires re-encrypting
 * all stored secrets. NEVER commit or share the key.
 *
 * Also provides SHA-256 hashing for tokens and fingerprints — these
 * are one-way and used for lookups/duplicate detection without ever
 * having to decrypt.
 */
/**
 * Encrypt a plaintext string. Output is base64-encoded and safe for DB storage.
 */
export declare function encrypt(plaintext: string): string;
/**
 * Decrypt a previously-encrypted payload. Throws if tampered or wrong key.
 */
export declare function decrypt(payload: string): string;
/**
 * SHA-256 hex digest. Used for token hashes and secret fingerprints.
 * One-way — cannot be reversed.
 */
export declare function sha256(input: string): string;
/**
 * Take the first `n` characters of a plaintext key for UI display,
 * masking the rest. e.g. "sk-abcd..." for "sk-abcdef123456...".
 */
export declare function keyPrefix(plaintext: string, chars?: number): string;
/**
 * Constant-time comparison to avoid timing attacks on secrets.
 */
export declare function safeEqual(a: string, b: string): boolean;
//# sourceMappingURL=crypto.d.ts.map