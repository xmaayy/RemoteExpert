import axios, { AxiosResponse } from 'axios';
import {encrypt, decrypt} from './encryption';
import {sign, verify } from './messageAuthentication';

export const post = (uri: string, rawData: Object, encryption: boolean = false, key: string = ''): Promise<AxiosResponse<any>> => {
    let data;
    if (encryption) {
        data = {
            cipher: encrypt(rawData, key),
            hmac: sign(rawData, key)
        }
    } else {
        data = rawData;
    }

    return axios.post(uri, data)
}

export const get = (uri, decryption: boolean = false, key: string = ''): Promise<AxiosResponse<any>> => {
    return new Promise((resolve, reject) => {
        axios.get(uri).then((response) => {
            const rawData = response.data;
            if(decryption) {
                const data = decrypt(rawData['cipher'], key)
                const hmac = rawData['hmac'];
                if (verify(response.data, hmac, key)){
                    response.data = data;
                } else {
                    reject('HMAC did not match');
                }
            } else {
                response.data = rawData;
            }
            resolve(response);
        }).catch((err) => {
            reject(err);
        })
    })
}