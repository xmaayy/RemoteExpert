import CryptoJS from 'crypto-js';

export const encrypt = (plaintext: Object, key: string): string  => {
    return CryptoJS.AES.encrypt(JSON.stringify(plaintext), key).toString();
}

export const decrypt = (ciphertext: string, key: string): Object  => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(plaintext);
}