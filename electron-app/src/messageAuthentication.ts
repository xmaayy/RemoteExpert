import CryptoJS from 'crypto-js';

export const sign = (message: Object, key: string): string => {
    const stringMessage = JSON.stringify(message);
    return CryptoJS.HmacSHA1(stringMessage, key);
}

export const verify = (message: Object, signature: string, key: string): Boolean => {
    const stringMessage = JSON.stringify(message);
    return CryptoJS.HmacSHA1(stringMessage, key) == signature;
}