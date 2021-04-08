import CryptoJS from 'crypto-js';

export const sign = (message: Object, key: string): string => {
    const hexKey = CryptoJS.enc.Base64.parse(key);
    const stringMessage = JSON.stringify(message);
    const words = CryptoJS.HmacSHA256(stringMessage, hexKey);
    const signature = CryptoJS.enc.Base64.stringify(words);
    return signature;
}

export const verify = (message: Object, signature: string, key: string): Boolean => {
    const hexKey = CryptoJS.enc.Base64.parse(key);
    const stringMessage = JSON.stringify(message);
    const words = CryptoJS.HmacSHA256(stringMessage, hexKey);
    const calculatedSignature = CryptoJS.enc.Base64.stringify(words);
    return calculatedSignature === signature;
}