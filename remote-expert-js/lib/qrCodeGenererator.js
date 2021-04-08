"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQr = void 0;
// This module is for generating and returning a QR code with the inputs of ip address, userId, peerId, initialization vector, and private key
const ZXing = __importStar(require("@zxing/library"));
const generateQr = (ip, id, iv, key) => {
    var input = {
        "ip": "http://127.0.0.1:3000/",
        "id": "mattiasLightstone",
        "iv": iv,
        "key": key
    };
    // Create a new 
    const writer = new ZXing.BrowserQRCodeSvgWriter();
    const svgElement = writer.write(JSON.stringify(input), 300, 300);
    return svgElement;
};
exports.generateQr = generateQr;
