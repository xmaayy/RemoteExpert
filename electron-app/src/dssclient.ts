/*
for the purposes of our fourth year project, the hololens will play the role
of the caller, initializing the offer and broadcasting the video feed. The electron client
is the non-caller here. the caller in this code will attempt to broadcast its signal
to the hololens, whereas the non-caller will only listen. keep this in mind while
you're reading the code
*/
import axios from 'axios';
import * as communication from './communication';

// The Hololens application uses Enum values corresponding to integers to represent the sdp message types
const SDP_TYPE = {
    // OFFER the initial sdp offer (usually performed by the hololens)
    OFFER: 1,
    // ANSWER the response to the offer (usually performed by the )
    ANSWER: 2,
    // CANDIDATE messages sending possible ICE candidates
    CANDIDATE: 3,
}

// Ice candidate messages consist of three fields delimited by a separation character
// the default choice of character is |
const ICE_SEPARATOR_CHAR = "|"

// The client polls the signalling server to receive new offers, answers, and candidates left for its id
// pollInterval determines how frequently the server should be polled
const pollInterval = 2000;

// References for the connection create div and the video streams div
const divOffers = (<HTMLDivElement>window.document.getElementById("connect"));
const divConsultingRoom = (<HTMLDivElement>window.document.getElementById("consultingRoom"));

// References for each of the inputs 
const inputMyId = (<HTMLInputElement>window.document.getElementById("myId"));
const inputPeerId = (<HTMLInputElement>window.document.getElementById("peerId"));
const inputUri = (<HTMLInputElement>window.document.getElementById("signallingServerUrl"));
const inputTwoWayVideo =(<HTMLInputElement>window.document.getElementById("twoWayVideo"));

// References for the two buttons to control activity
// Poll offers should poll the signalling server for 
const btnPollOffers = (<HTMLButtonElement>window.document.getElementById("pollOffers"));
const btnCreateOffer = (<HTMLButtonElement>window.document.getElementById("createOffer"));

const localVideo = (<HTMLMediaElement>window.document.getElementById("localVideo"));
localVideo.muted = true;
const remoteVideo = (<HTMLMediaElement>window.document.getElementById("remoteVideo"));
var remoteVideoSource: MediaStream;
// TODO remove these two variables below
var exitPoll = false;
var encryption = true;
var key = 'This is a test key'
var iv = 'This is a test IV'

// variables
// needed some defaults
const iceServers: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.services.mozilla.com' },
        { urls: 'stun:stun.l.google.com:19302' }
    ]
}
const streamConstraints = { audio: true, video: true };
// but realistically it could be anywhere

// attaching the join-room function to the button on the page
btnCreateOffer.onclick = function () {
    if (inputPeerId.value === '') {
        alert("please input a peer id")
    } else if (inputMyId.value === '') {
        alert("please input your id")
    } else {
        // Create an offer
        // We need to start showing our stream on the 'local' client
        if(inputTwoWayVideo.checked){

        } else {

        }
        initializeLocalVideoStream(iceServers).then((rtcPeerConnection: RTCPeerConnection) => {
            offer(rtcPeerConnection).then(() => {
                divOffers.style.display = "none";
                divConsultingRoom.style.display = "block";
                poll(rtcPeerConnection, inputUri.value, inputMyId.value, exitPoll);
            })
        })
    }
};

btnPollOffers.onclick = () => {
    if (inputPeerId.value === '') {
        alert("please input a peer id")
    } else if (inputMyId.value === '') {
        alert("please input your id")
    } else {
        if(inputTwoWayVideo.checked){
            initializeLocalVideoStream(iceServers).then((rtcPeerConnection: RTCPeerConnection) => {
                divOffers.style.display = "none";
                divConsultingRoom.style.display = "block";
                poll(rtcPeerConnection, inputUri.value, inputMyId.value, exitPoll);
            })
        } else {
            const rtcPeerConnection = initializeRtc(iceServers);
            divOffers.style.display = "none";
            divConsultingRoom.style.display = "block";
            poll(rtcPeerConnection, inputUri.value, inputMyId.value, exitPoll);
        }
        // We need to start showing our stream on the 'local' client
    }
}

const initializeRtc = (iceServers: RTCConfiguration): RTCPeerConnection => {
    const rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    return rtcPeerConnection
}

const initializeLocalVideoStream = (iceServers: RTCConfiguration): Promise<RTCPeerConnection> => {
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
            const localStream = stream;
            localVideo.srcObject = stream;

            const rtcPeerConnection = initializeRtc(iceServers);
            rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
            rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);

            divOffers.style.display = "none";
            resolve(rtcPeerConnection);
        }).catch(function (err) {
            console.log('an error ocurred when accessing media devices', err);
        });
    })
}

const offer = function(rtcPeerConnection: RTCPeerConnection): Promise<void> {
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
                // axios.post(inputUri.value+'/data/'+ inputPeerId.value, {
                communication.post(inputUri.value+'/data/'+ inputPeerId.value, {
                    MessageType: SDP_TYPE.OFFER,
                    Data: sessionDescription.sdp
                }, encryption, key, iv).then((res) => {
                    resolve();
                }).catch((err) => {
                    console.log('Could not send offer')
                    reject(err);
                })
            })
            .catch(err => {
                reject(err);
            })
        })
}


const handleOffer = function(sdp: string, rtcPeerConnection: RTCPeerConnection, uri: string, peerId: string): Promise<void> {
    // this ready offer should only be acted on by the one joining a room because
    // they're going to be listening to the caller. so they dont add any media
    // tracks to their session description.
    return new Promise((resolve, reject) => {
        console.log('Handling offer')
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription({sdp: sdp, type: 'offer'})).then(() => {
            rtcPeerConnection.createAnswer()
                .then(sessionDescription => {
                    // once we've created a session description without any media tracks
                    // send the answer back through the socket
                    rtcPeerConnection.setLocalDescription(sessionDescription);
                    // axios.post(uri+'/data/'+peerId, {
                    communication.post(uri+'/data/'+peerId, {
                        MessageType: SDP_TYPE.ANSWER,
                        Data: sessionDescription.sdp,
                    }, encryption, key, iv).then((response) => {
                        resolve()
                    }).catch(err => {reject(err)})
                .catch(error => {
                    reject(error)
                })
        }).catch((err) => {
            reject(err);
        })
    })})
}

var handleAnswer = (sdp: string, rtcPeerConnection: RTCPeerConnection): Promise<void> => {
    return rtcPeerConnection.setRemoteDescription(new RTCSessionDescription({sdp: sdp, type: 'answer'}))
}

// This is the main event loop polling the signalling server for incoming connections
const poll = (rtcPeerConnection: RTCPeerConnection, uri: string, myId: string, exitPoll: boolean) => {
    setTimeout(() => {
        // axios.get(inputUri.value+'/data/'+inputMyId.value).then((res) => {
        communication.get(inputUri.value+'/data/'+inputMyId.value, encryption, key, iv).then((res) => {
                switch(res.data.MessageType){
                    case SDP_TYPE.OFFER:
                        handleOffer(res.data.Data, rtcPeerConnection, inputUri.value, inputPeerId.value)
                        break
                    case SDP_TYPE.ANSWER:
                        handleAnswer(res.data.Data, rtcPeerConnection)
                        break
                    case SDP_TYPE.CANDIDATE:
                        handleCandidate(res.data.Data, rtcPeerConnection, res.data.IceDataSeparator)
                        break
                    default: 
                        break
            }
        }).catch((err) => {
            // If the request is sent, and the server responds with a failure request
            if (err.response){
                // nothing needs to be done here the server either resulted in a 404 or a 500
            } else {
                console.error(err);
            }
        })
        if (!exitPoll){
            poll(rtcPeerConnection, uri, myId, exitPoll);
        }
    }, pollInterval)
}

var handleCandidate = (data: string, rtcPeerConnection: RTCPeerConnection, separatorChar: string) => {
    const ice = data.split(separatorChar);
    console.log('Handling Ice Candidate', ice)
    var candidate = new RTCIceCandidate({
        sdpMid: ice[2],
        sdpMLineIndex: parseInt(ice[1]),
        candidate: ice[0]
    });
    rtcPeerConnection.addIceCandidate(candidate).then(() => {
        console.log('Added Ice Candidate', rtcPeerConnection);
        return rtcPeerConnection;
    })
}

// handler functions
function onIceCandidate(event) {
    if (event.candidate) {
        console.log('Sending ice candidate');
        // axios.post(inputUri.value + '/data/' + inputPeerId.value, {
        communication.post(inputUri.value + '/data/' + inputPeerId.value, {
            MessageType: SDP_TYPE.CANDIDATE,
            Data: 
                [event.candidate.candidate,
                event.candidate.sdpMLineIndex,
                event.candidate.sdpMid].join(ICE_SEPARATOR_CHAR),
            IceDataSeparator: ICE_SEPARATOR_CHAR
        }, encryption, key, iv)
    }
}

function onAddStream(event) {
    console.log('Adding stream', event)
    // remoteVideo.srcObject = event.streams[0];
    if (remoteVideo.srcObject) {
        remoteVideoSource.addTrack(event.track);
        remoteVideo.srcObject = remoteVideoSource;
    } else {
        console.log('constructing mediastream')
        remoteVideoSource = new MediaStream([event.track]);
        remoteVideo.srcObject = remoteVideoSource;
    }
}