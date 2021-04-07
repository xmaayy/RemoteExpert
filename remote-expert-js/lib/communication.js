"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.post = void 0;
const axios_1 = __importDefault(require("axios"));
const encryption_1 = require("./encryption");
const messageAuthentication_1 = require("./messageAuthentication");
const post = (uri, rawData, encryption = false, key = '', iv = '') => {
    let data;
    if (encryption) {
        data = {
            Cipher: encryption_1.encrypt(rawData, key, iv),
            Hmac: messageAuthentication_1.sign(rawData, key)
        };
    }
    else {
        data = rawData;
    }
    return axios_1.default.post(uri, data);
};
exports.post = post;
const get = (uri, decryption = false, key = '', iv = '') => {
    return new Promise((resolve, reject) => {
        axios_1.default.get(uri).then((response) => {
            const rawData = response.data;
            if (decryption) {
                const cipher = encryption_1.decrypt(rawData['Cipher'], key, iv);
                const hmac = rawData['Hmac'];
                if (messageAuthentication_1.verify(cipher, hmac, key)) {
                    response.data = cipher;
                }
                else {
                    reject('HMAC did not match');
                }
            }
            else {
                response.data = rawData;
            }
            resolve(response);
        }).catch((err) => {
            reject(err);
        });
    });
};
exports.get = get;
