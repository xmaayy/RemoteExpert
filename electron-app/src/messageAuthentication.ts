import CryptoJS from 'crypto-js';

export const sign = (message: Object, key: string): string => {
    const stringMessage = JSON.stringify(message);
    const signature = CryptoJS.HmacSHA256(stringMessage, key).toString();
    return signature;
}

export const verify = (message: Object, signature: string, key: string): Boolean => {
    const stringMessage = JSON.stringify(message);
    const calculatedSignature = CryptoJS.HmacSHA256(stringMessage, key).toString()
    return calculatedSignature === signature;
}