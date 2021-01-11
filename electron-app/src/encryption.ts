import CryptoJS from 'crypto-js';

export const encrypt = (plaintext: Object, key: string, iv: string): string  => {
    return CryptoJS.AES.encrypt(JSON.stringify(plaintext), key, {iv: iv}).toString();
}

export const decrypt = (ciphertext: string, key: string, iv: string): Object  => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key, {iv: iv});
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(plaintext);
}