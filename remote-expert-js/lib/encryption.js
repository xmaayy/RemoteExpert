"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const encrypt = (plaintext, key, iv) => {
    const hexKey = crypto_js_1.default.enc.Base64.parse(key);
    const hexIv = crypto_js_1.default.enc.Base64.parse(iv);
    return crypto_js_1.default.AES.encrypt(JSON.stringify(plaintext), hexKey, { iv: hexIv }).toString();
};
exports.encrypt = encrypt;
const decrypt = (ciphertext, key, iv) => {
    const hexKey = crypto_js_1.default.enc.Base64.parse(key);
    const hexIv = crypto_js_1.default.enc.Base64.parse(iv);
    const bytes = crypto_js_1.default.AES.decrypt(ciphertext, hexKey, { iv: hexIv });
    const plaintext = bytes.toString(crypto_js_1.default.enc.Utf8);
    return JSON.parse(plaintext);
};
exports.decrypt = decrypt;
