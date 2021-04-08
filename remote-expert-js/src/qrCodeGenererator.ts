// This module is for generating and returning a QR code with the inputs of ip address, userId, peerId, initialization vector, and private key
import * as ZXing from '@zxing/library';

export const generateQr = (ip: string, id: string, iv: string, key: string): SVGElement => {
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
}
