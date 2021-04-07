import { AxiosResponse } from 'axios';
export declare const post: (uri: string, rawData: Object, encryption?: boolean, key?: string, iv?: string) => Promise<AxiosResponse<any>>;
export declare const get: (uri: string, decryption?: boolean, key?: string, iv?: string) => Promise<AxiosResponse<any>>;
