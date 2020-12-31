import axios, { AxiosResponse } from 'axios';
import {encrypt, decrypt} from './encryption';

export const post = (uri: string, rawData: Object, encryption: boolean = false, key: string = ''): Promise<AxiosResponse<any>> => {
    let data;
    if (encryption) {
        data = {
            cipher: encrypt(rawData, key)
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
            debugger;
            if(decryption) {
                response.data = decrypt(rawData['cipher'], key)
            } else {
                response.data = rawData;
            }
            resolve(response);
        }).catch((err) => {
            reject(err);
        })
    })
}