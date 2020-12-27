/*
for the purposes of our fourth year project, the hololens will play the role
of the caller, initializing the offer and broadcasting the video feed. The electron client
is the non-caller here. the caller in this code will attempt to broadcast its signal
to the hololens, whereas the non-caller will only listen. keep this in mind while
you're reading the code
*/
import axios from 'axios';

// The Hololens application uses Enum values corresponding to integers to represent the sdp message types
const SDP_TYPE = {
    // OFFER the initial sdp offer (usually performed by the hololens)
    OFFER: 1,
    // ANSWER the response to the offer (usually performed by the )
    ANSWER: 2,
    // CANDIDATE messages sending possible ICE candidates
    CANDIDATE: 3,
}

const iceSeparatorCharacter = "|"

// The client polls the signalling server to receive new offers, answers, and candidates left for its id
// pollInterval determines how frequently the server should be polled
const pollInterval = 100;

const divOffers = (<HTMLDivElement>window.document.getElementById("connect"));
const divConsultingRoom = (<HTMLDivElement>window.document.getElementById("consultingRoom"));
const inputMyId = (<HTMLInputElement>window.document.getElementById("myId"));
const inputPeerId = (<HTMLInputElement>window.document.getElementById("peerId"));
const inputUri = (<HTMLInputElement>window.document.getElementById("signallingServerUrl"));
const btnPollOffers = (<HTMLButtonElement>window.document.getElementById("pollOffers"));
const btnCreateOffer = (<HTMLButtonElement>window.document.getElementById("createOffer"));
const localVideo = (<HTMLMediaElement>window.document.getElementById("localVideo"));
const remoteVideo = (<HTMLMediaElement>window.document.getElementById("remoteVideo"));

// variables
var localStream;
var remoteStream;
var rtcPeerConnection;
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
        navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
            localStream = stream;
            localVideo.srcObject = stream;
            offer();
        }).catch(function (err) {
            console.log('an error ocurred when accessing media devices', err);
        });
        divOffers.style.display = "none";
        divConsultingRoom.style.display = "block";
    }
};

btnPollOffers.onclick = () => {
    if (inputPeerId.value === '') {
        alert("please input a peer id")
    } else if (inputMyId.value === '') {
        alert("please input your id")
    } else {
        poll();
        // navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        //     localStream = stream;
        //     localVideo.srcObject = stream;
        //     isCaller = true;
        //     poll();
        // }).catch(function (err) {
        //     console.log('an error ocurred when accessing media devices', err);
        // });
        // We need to start showing our stream on the 'local' client
        divOffers.style.display = "none";
        divConsultingRoom.style.display = "block";
    }
}

const offer = function() {
    // on ready received, this should only be acted on by the creator of the room
    // (known here as the caller) because they're the ones that are going to be
    // broadcasting to the rest of the clients in the room
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection.createOffer()
        .then(sessionDescription => {
            // once the tracks have been added and we create the sdp params
            // from the broadcaster side we can send the offer to the stuni
            // server (local) for rebroadcasting to the room
            rtcPeerConnection.setLocalDescription(sessionDescription);
            axios.post(inputUri.value+'/data/'+ inputPeerId.value, {
                MessageType: SDP_TYPE.OFFER,
                Data: sessionDescription.sdp
            }).then((res) => {
                poll();
            }).catch((err) => {
                console.error(err);
                console.log('Could not send offer')
            })
        })
        .catch(error => {
            console.log(error)
        })
}


const handleOffer = function(sdp) {
    // this ready offer should only be acted on by the one joining a room because
    // they're going to be listening to the caller. so they dont add any media
    // tracks to their session description.
    console.log('Handling offer')
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription({sdp: sdp, type: 'offer'})).then(() => {
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                // once we've created a session description without any media tracks
                // send the answer back through the socket
                rtcPeerConnection.setLocalDescription(sessionDescription);
                axios.post(inputUri.value+'/data/'+inputPeerId.value, {
                    MessageType: SDP_TYPE.ANSWER,
                    Data: sessionDescription.sdp,
                })
            })
            .catch(error => {
                console.error(error)
            })
    }).catch((err) => {
        console.log('Could not set remote description')
        console.error(err);
    })
}

// This is the main event loop polling the signalling server for incoming connections
const poll = () => {
    setTimeout(() => {
        axios.get(inputUri.value+'/data/'+inputMyId.value).then((res) => {
                switch(res.data.MessageType){
                    case SDP_TYPE.OFFER:
                        handleOffer(res.data.Data)
                        break
                    case SDP_TYPE.ANSWER:
                        handleAnswer(res.data.Data)
                        break
                    case SDP_TYPE.CANDIDATE:
                        handleCandidate(res.data.Data, res.data.IceDataSeparator)
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
        poll();
    }, pollInterval)
}

var handleAnswer = (sdp) => {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription({sdp: sdp, type: 'answer'})).then((remoteDescription) => {
        console.log('Successfully processed answer');
    }).catch((err) => {
        console.log('Could not handle answer');
        console.error(err);
    });
}

var handleCandidate = (data, separatorChar) => {
    console.log('Handling Ice Candidate')
    const ice = data.split(separatorChar);
    var candidate = new RTCIceCandidate({
        sdpMid: ice[2],
        sdpMLineIndex: ice[1],
        candidate: ice[0]
    });
    rtcPeerConnection.addIceCandidate(candidate);
}

// handler functions
function onIceCandidate(event) {
    if (event.candidate) {
        console.log('Sending ice candidate');
        axios.post(inputUri.value + '/data/' + inputPeerId.value, {
            MessageType: SDP_TYPE.CANDIDATE,
            Data: 
                [event.candidate.candidate,
                event.candidate.sdpMLineIndex,
                event.candidate.sdpMid].join(iceSeparatorCharacter),
            IceDataSeparator: "|"
        })
    }
}

function onAddStream(event) {
    console.log('Adding stream')
    debugger;
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.stream;
}