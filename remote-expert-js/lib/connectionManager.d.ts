interface ConnectionProperties {
    localVideoElement: HTMLMediaElement;
    remoteVideoElement: HTMLMediaElement;
    iceServerUrls: {
        urls: string;
    }[];
    pollInterval: number;
    encrypted: boolean;
    onOfferCreated: () => void;
    onPollingOffers: () => void;
    onLocalStreamInitialized: () => void;
    onConnected: () => void;
    onMessageReceived: (message: string) => void;
}
export declare class RemoteExpertConnection {
    localVideoElement: HTMLMediaElement;
    remoteVideoElement: HTMLMediaElement;
    iceServerUrls: {
        urls: string;
    }[];
    pollInterval: number;
    encrypted: boolean;
    onOfferCreated: () => void;
    onPollingOffers: () => void;
    onLocalStreamInitialized: () => void;
    onConnected: () => void;
    onMessageReceived: (message: string) => void;
    sendChannel: RTCDataChannel | undefined;
    iceServers: RTCConfiguration;
    streamConstraints: any;
    exitPoll: boolean;
    id: string;
    peerId: string;
    url: string;
    iv: string;
    key: string;
    remoteVideoSource: MediaStream;
    constructor(args: ConnectionProperties);
    pollOffers: (inputPeerId: string, inputMyId: string, url: string, key?: string, iv?: string) => void;
    createOffer: (inputPeerId: string, inputMyId: string, url: string, key?: string, iv?: string) => void;
    initializeLocalVideoStream: () => Promise<RTCPeerConnection>;
    initializeRtc: (iceServers: RTCConfiguration) => RTCPeerConnection;
    poll: (rtcPeerConnection: RTCPeerConnection) => void;
    handleCandidate: (data: string, rtcPeerConnection: RTCPeerConnection, separatorChar: string) => void;
    onIceCandidate: (event: any) => void;
    onAddStream: (event: any) => void;
    handleReceiveMessage: (event: any) => void;
    receiveChannelCallback: (event: any) => void;
    sendMessage: (message: string) => void;
    handleSendChannelStatusChange: (event: any) => void;
    handleReceiveChannelStatusChange: (event: RTCDataChannelEvent) => void;
    offer: (rtcPeerConnection: RTCPeerConnection) => Promise<void>;
    handleOffer: (sdp: string, rtcPeerConnection: RTCPeerConnection) => Promise<void>;
    handleAnswer: (sdp: string, rtcPeerConnection: RTCPeerConnection) => Promise<void>;
}
export {};
