"use strict";
// create
// localVideoElement
// remoteVideoElement
// iceServers
// pollInterval;
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
exports.RemoteExpertConnection = void 0;
const communication = __importStar(require("./communication"));
const SDP_TYPE = {
    // OFFER the initial sdp offer (usually performed by the hololens)
    OFFER: 1,
    // ANSWER the response to the offer (usually performed by the )
    ANSWER: 2,
    // CANDIDATE messages sending possible ICE candidates
    CANDIDATE: 3,
};
class RemoteExpertConnection {
    constructor(args) {
        this.pollOffers = (inputPeerId, inputMyId, url, key = "", iv = "") => {
            if (inputPeerId === '') {
                alert("please input a peer id");
            }
            else if (inputMyId === '') {
                alert("please input your id");
            }
            else {
                const rtcPeerConnection = this.initializeRtc(this.iceServers);
                this.onPollingOffers();
                this.poll(rtcPeerConnection);
                // We need to start showing our stream on the 'local' client
            }
        };
        this.createOffer = (inputPeerId, inputMyId, url, key = "", iv = "") => {
            if (inputPeerId === '') {
                alert("please input a peer id");
            }
            else if (inputMyId === '') {
                alert("please input your id");
            }
            else {
                this.peerId = inputPeerId;
                this.id = inputMyId;
                this.url = url;
                this.key = key;
                this.iv = iv;
                this.initializeLocalVideoStream().then((rtcPeerConnection) => {
                    this.offer(rtcPeerConnection).then(() => {
                        this.onOfferCreated();
                        this.poll(rtcPeerConnection);
                    });
                });
            }
        };
        this.initializeLocalVideoStream = () => {
            return new Promise((resolve, reject) => {
                navigator.mediaDevices.getUserMedia(this.streamConstraints).then((stream) => {
                    const localStream = stream;
                    this.localVideoElement.srcObject = stream;
                    const rtcPeerConnection = this.initializeRtc(this.iceServers);
                    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
                    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
                    this.onLocalStreamInitialized();
                    resolve(rtcPeerConnection);
                }).catch(function (err) {
                    console.log('an error ocurred when accessing media devices', err);
                });
            });
        };
        this.initializeRtc = (iceServers) => {
            const rtcPeerConnection = new RTCPeerConnection(iceServers);
            rtcPeerConnection.onicecandidate = this.onIceCandidate;
            rtcPeerConnection.ontrack = this.onAddStream;
            // Each end calls this when a new channel is created.
            rtcPeerConnection.ondatachannel = this.receiveChannelCallback;
            // Create a channel that we aptly call sendChannel for transmitting data
            // between the two ends
            console.log('create data channel');
            this.sendChannel = rtcPeerConnection.createDataChannel("sendChannel");
            this.sendChannel.onopen = this.handleSendChannelStatusChange;
            this.sendChannel.onclose = this.handleSendChannelStatusChange;
            return rtcPeerConnection;
        };
        // This is the main event loop polling the signalling server for incoming connections
        this.poll = (rtcPeerConnection) => {
            setTimeout(() => {
                communication.get(this.url + '/data/' + this.id, this.encrypted, this.key, this.iv).then((res) => {
                    switch (res.data.MessageType) {
                        case SDP_TYPE.OFFER:
                            this.handleOffer(res.data.Data, rtcPeerConnection);
                            break;
                        case SDP_TYPE.ANSWER:
                            this.handleAnswer(res.data.Data, rtcPeerConnection);
                            break;
                        case SDP_TYPE.CANDIDATE:
                            this.handleCandidate(res.data.Data, rtcPeerConnection, res.data.IceDataSeparator);
                            break;
                        default:
                            break;
                    }
                }).catch((err) => {
                    // If the request is sent, and the server responds with a failure request
                    if (err.response) {
                        // nothing needs to be done here the server either resulted in a 404 or a 500
                    }
                    else {
                        console.error(err);
                    }
                });
                if (!this.exitPoll) {
                    this.poll(rtcPeerConnection);
                }
            }, this.pollInterval);
        };
        this.handleCandidate = (data, rtcPeerConnection, separatorChar) => {
            const ice = data.split(separatorChar);
            console.log('Handling Ice Candidate', ice);
            var candidate = new RTCIceCandidate({
                sdpMid: ice[2],
                sdpMLineIndex: parseInt(ice[1]),
                candidate: ice[0]
            });
            rtcPeerConnection.addIceCandidate(candidate).then(() => {
                console.log('Added Ice Candidate', rtcPeerConnection);
                return rtcPeerConnection;
            });
        };
        // handler functions
        this.onIceCandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ice candidate');
                communication.post(this.url + '/data/' + this.peerId, {
                    MessageType: SDP_TYPE.CANDIDATE,
                    Data: [event.candidate.candidate,
                        event.candidate.sdpMLineIndex,
                        event.candidate.sdpMid].join(ICE_SEPARATOR_CHAR),
                    IceDataSeparator: ICE_SEPARATOR_CHAR
                }, this.encrypted, this.key, this.iv);
            }
        };
        this.onAddStream = (event) => {
            console.log('Adding stream', event);
            // remoteVideo.srcObject = event.streams[0];
            if (this.remoteVideoElement.srcObject) {
                this.remoteVideoSource.addTrack(event.track);
                this.remoteVideoElement.srcObject = this.remoteVideoSource;
            }
            else {
                console.log('constructing mediastream');
                this.remoteVideoSource = new MediaStream([event.track]);
                this.remoteVideoElement.srcObject = this.remoteVideoSource;
            }
        };
        this.handleReceiveMessage = (event) => {
            // This is the callback that gets run every time a new event
            // is made avaiable by the data channel
            console.log(event.data);
            this.onMessageReceived(event);
        };
        this.receiveChannelCallback = (event) => {
            // If we detect that someone else made a data channel then here
            // is where we register the callback that allows us to handle data
            var receiveChannel = event.channel;
            receiveChannel.onmessage = this.handleReceiveMessage;
            receiveChannel.onopen = this.handleReceiveChannelStatusChange;
            receiveChannel.onclose = this.handleReceiveChannelStatusChange;
        };
        this.sendMessage = (message) => {
            // Ezpz method for sending data. There are 3 other versions
            // for sending non-string data, but all this one does is send
            // string data
            if (this.sendChannel) {
                this.sendChannel.send(message);
            }
            else {
                throw ('Send channel is not established yet');
            }
        };
        this.handleSendChannelStatusChange = (event) => {
            // If for some reason the other end closes the channel we can
            // alert the operator here
            if (event.channel) {
                var state = event.channel.readyState;
                if (state === "open") {
                    console.log("The state of the data channel is open");
                }
                else {
                    console.log("The state of the data channel is closed");
                }
            }
        };
        this.handleReceiveChannelStatusChange = (event) => {
            if (event.channel) {
                console.log("Receive channel's status has changed to " +
                    event.channel.readyState);
            }
        };
        this.offer = (rtcPeerConnection) => {
            // on ready received, this should only be acted on by the creator of the room
            // (known here as the caller) because they're the ones that are going to be
            // broadcasting to the rest of the clients in the room
            return new Promise((resolve, reject) => {
                rtcPeerConnection.createOffer()
                    .then(sessionDescription => {
                    // once the tracks have been added and we create the sdp params
                    // from the broadcaster side we can send the offer to the stuni
                    // server (local) for rebroadcasting to the room
                    rtcPeerConnection.setLocalDescription(sessionDescription);
                    communication.post(this.url + '/data/' + this.peerId, {
                        MessageType: SDP_TYPE.OFFER,
                        Data: sessionDescription.sdp
                    }, this.encrypted, this.key, this.iv).then((res) => {
                        resolve();
                    }).catch((err) => {
                        console.log('Could not send offer');
                        reject(err);
                    });
                })
                    .catch(err => {
                    reject(err);
                });
            });
        };
        this.handleOffer = (sdp, rtcPeerConnection) => {
            // this ready offer should only be acted on by the one joining a room because
            // they're going to be listening to the caller. so they dont add any media
            // tracks to their session description.
            return new Promise((resolve, reject) => {
                console.log('Handling offer');
                rtcPeerConnection.setRemoteDescription(new RTCSessionDescription({ sdp: sdp, type: 'offer' })).then(() => {
                    rtcPeerConnection.createAnswer()
                        .then(sessionDescription => {
                        // once we've created a session description without any media tracks
                        // send the answer back through the socket
                        rtcPeerConnection.setLocalDescription(sessionDescription);
                        communication.post(this.url + '/data/' + this.peerId, {
                            MessageType: SDP_TYPE.ANSWER,
                            Data: sessionDescription.sdp,
                        }, this.encrypted, this.key, this.iv).then((response) => {
                            resolve();
                        }).catch(err => { reject(err); })
                            .catch(error => {
                            reject(error);
                        });
                    }).catch((err) => {
                        reject(err);
                    });
                });
            });
        };
        this.handleAnswer = (sdp, rtcPeerConnection) => {
            this.onConnected();
            return rtcPeerConnection.setRemoteDescription(new RTCSessionDescription({ sdp: sdp, type: 'answer' }));
        };
        this.localVideoElement = args.localVideoElement;
        this.remoteVideoElement = args.remoteVideoElement;
        this.iceServerUrls = args.iceServerUrls;
        this.pollInterval = args.pollInterval;
        this.encrypted = args.encrypted;
        this.onOfferCreated = args.onOfferCreated;
        this.onPollingOffers = args.onPollingOffers;
        this.onConnected = args.onConnected;
        this.onMessageReceived = args.onMessageReceived;
        this.onLocalStreamInitialized = args.onLocalStreamInitialized;
        this.exitPoll = false;
        this.remoteVideoSource = new MediaStream();
        this.id = "";
        this.peerId = "";
        this.url = "";
        this.iv = "";
        this.key = "";
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.services.mozilla.com' },
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };
        this.streamConstraints = { audio: true, video: true };
        this.sendChannel = undefined;
    }
}
exports.RemoteExpertConnection = RemoteExpertConnection;
// The client polls the signalling server to receive new offers, answers, and candidates left for its id
// pollInterval determines how frequently the server should be polled
// The Hololens application uses Enum values corresponding to integers to represent the sdp message types
// Ice candidate messages consist of three fields delimited by a separation character
// the default choice of character is |
const ICE_SEPARATOR_CHAR = "|";
// pollOffers()
// createOffers(peerId, )
// send Message
