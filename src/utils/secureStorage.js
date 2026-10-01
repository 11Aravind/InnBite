import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY || 'orderly_secure_secret_key_2026';

const decryptOrRaw = (rawValue) => {
    if (!rawValue) return null;

    // CryptoJS AES ciphertext always starts with "U2FsdGVkX1" ("Salted__" in Base64)
    if (typeof rawValue === 'string' && rawValue.startsWith('U2FsdGVkX1')) {
        try {
            const bytes = CryptoJS.AES.decrypt(rawValue, SECRET_KEY);
            const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
            if (decryptedValue) {
                try {
                    return JSON.parse(decryptedValue);
                } catch {
                    return decryptedValue;
                }
            }
        } catch {
            // Decryption failed (e.g. key changed or mismatched ciphertext), fall back to raw parsing
        }
    }

    // Fallback for unencrypted legacy data or plain strings/JSON
    try {
        return JSON.parse(rawValue);
    } catch {
        return rawValue;
    }
};

export const secureStorage = {
    setItem: (key, value) => {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            const encryptedValue = CryptoJS.AES.encrypt(stringValue, SECRET_KEY).toString();
            localStorage.setItem(key, encryptedValue);
        } catch (error) {
            console.error('Error encrypting and saving to localStorage:', error);
        }
    },
    getItem: (key) => {
        try {
            const rawValue = localStorage.getItem(key);
            return decryptOrRaw(rawValue);
        } catch {
            return null;
        }
    },
    removeItem: (key) => {
        localStorage.removeItem(key);
    },
    setSessionItem: (key, value) => {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            const encryptedValue = CryptoJS.AES.encrypt(stringValue, SECRET_KEY).toString();
            sessionStorage.setItem(key, encryptedValue);
        } catch (error) {
            console.error('Error encrypting and saving to sessionStorage:', error);
        }
    },
    getSessionItem: (key) => {
        try {
            const rawValue = sessionStorage.getItem(key);
            return decryptOrRaw(rawValue);
        } catch {
            return null;
        }
    },
    removeSessionItem: (key) => {
        sessionStorage.removeItem(key);
    }
};
