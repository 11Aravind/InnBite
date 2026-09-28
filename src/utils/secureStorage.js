import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_ENCRYPTION_KEY || 'orderly_secure_secret_key_2026';

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
            const encryptedValue = localStorage.getItem(key);
            if (!encryptedValue) return null;
            
            const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
            const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedValue) {
                throw new Error("Decryption resulted in empty string (likely unencrypted data)");
            }

            try {
                return JSON.parse(decryptedValue);
            } catch {
                return decryptedValue; // Return as string if it's not JSON
            }
        } catch (error) {
            console.error('Error reading/decrypting from localStorage:', error);
            // Fallback for unencrypted old data
            const rawValue = localStorage.getItem(key);
            if (rawValue) {
                try {
                    return JSON.parse(rawValue);
                } catch {
                    return rawValue;
                }
            }
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
            const encryptedValue = sessionStorage.getItem(key);
            if (!encryptedValue) return null;
            
            const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
            const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedValue) {
                throw new Error("Decryption resulted in empty string (likely unencrypted data)");
            }

            try {
                return JSON.parse(decryptedValue);
            } catch {
                return decryptedValue; // Return as string if it's not JSON
            }
        } catch (error) {
            console.error('Error reading/decrypting from sessionStorage:', error);
            // Fallback for unencrypted old data
            const rawValue = sessionStorage.getItem(key);
            if (rawValue) {
                try {
                    return JSON.parse(rawValue);
                } catch {
                    return rawValue;
                }
            }
            return null;
        }
    },
    removeSessionItem: (key) => {
        sessionStorage.removeItem(key);
    }
};
