"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = exports.sign = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const sign = (message, key) => {
    const hexKey = crypto_js_1.default.enc.Base64.parse(key);
    const stringMessage = JSON.stringify(message);
    const words = crypto_js_1.default.HmacSHA256(stringMessage, hexKey);
    const signature = crypto_js_1.default.enc.Base64.stringify(words);
    return signature;
};
exports.sign = sign;
const verify = (message, signature, key) => {
    const hexKey = crypto_js_1.default.enc.Base64.parse(key);
    const stringMessage = JSON.stringify(message);
    const words = crypto_js_1.default.HmacSHA256(stringMessage, hexKey);
    const calculatedSignature = crypto_js_1.default.enc.Base64.stringify(words);
    return calculatedSignature === signature;
};
exports.verify = verify;
