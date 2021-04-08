import CryptoJS from 'crypto-js';

export const encrypt = (plaintext: Object, key: string, iv: string): string  => {
    const hexKey = CryptoJS.enc.Base64.parse(key);
    const hexIv = CryptoJS.enc.Base64.parse(iv);
    return CryptoJS.AES.encrypt(JSON.stringify(plaintext), hexKey, {iv: hexIv}).toString();
}

export const decrypt = (ciphertext: string, key: string, iv: string): Object  => {
    const hexKey = CryptoJS.enc.Base64.parse(key);
    const hexIv = CryptoJS.enc.Base64.parse(iv);
    const bytes = CryptoJS.AES.decrypt(ciphertext, hexKey, {iv: hexIv});
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(plaintext);
}