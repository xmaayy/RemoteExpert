/*
for the purposes of our fourth year project, the hololens will play the role
of the caller, initializing the offer and broadcasting the video feed. The electron client
is the non-caller here. the caller in this code will attempt to broadcast its signal
to the hololens, whereas the non-caller will only listen. keep this in mind while
you're reading the code
*/

// The Hololens application uses Enum values corresponding to integers to represent the sdp message types
const SDP_TYPE = {
    // OFFER the initial sdp offer (usually performed by the hololens)
    OFFER: 1,
    // ANSWER the response to the offer (usually performed by the )
    ANSWER: 2,
    // CANDIDATE messages sending possible ICE candidates
    CANDIDATE: 4,
}

// The client polls the signalling server to receive new offers, answers, and candidates left for its id
// pollInterval determines how frequently the server should be polled
const pollInterval = 5000;

var divOffers = document.getElementById("connect");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputMyId = document.getElementById("myId");
var inputPeerId = document.getElementById("peerId");
var inputUri = document.getElementById("signallingServerUrl")
var btnPollOffers = document.getElementById("pollOffers");
var btnCreateOffer = document.getElementById("createOffer")
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

// variables
var localStream;
var remoteStream;
var rtcPeerConnection;
// needed some defaults
var iceServers = {
    'iceservers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]
}
var streamConstraints = { audio: true, video: true };
var isCaller;

// this is initializing the connection to the stun server. in our case its local
// but realistically it could be anywhere
var uri = 'http://localhost:3000'

// attaching the join-room function to the button on the page
btnCreateOffer.onclick = function () {
    if (inputPeerId.value === '') {
        alert("please input a peer id")
    } else if (inputMyId === '') {
        alert("please input your id")
    } else {
        peerId = inputPeerId.value;
        myId = inputMyId.value;
        // Create an offer
        // We need to start showing our stream on the 'local' client
        navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
            localStream = stream;
            localVideo.srcObject = stream;
            isCaller = true;
            offer();
        }).catch(function (err) {
            console.log('an error ocurred when accessing media devices', err);
        });
        divOffers.style = "display: none;";
        divConsultingRoom.style = "display: block;";
    }
};

btnPollOffers.onclick = () => {
    if (inputPeerId.value === '') {
        alert("please input a peer id")
    } else if (inputMyId === '') {
        alert("please input your id")
    } else {
        peerId = inputPeerId.value;
        myId = inputMyId.value;
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
        divOffers.style = "display: none;";
        divConsultingRoom.style = "display: block;";
    }
}

var offer = function() {
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
            // from the broadcaster side we can send the offer to the stun 
            // server (local) for rebroadcasting to the room
            rtcPeerConnection.setLocalDescription(sessionDescription);
            axios.post(uri+'/data/'+peerId, {
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


var handleOffer = function(sdp) {
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
                axios.post(inputUri.value+'/data/'+peerId, {
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
var poll = () => {
    setTimeout(() => {
        axios.get(inputUri.value+'/data/'+myId).then((res) => {
                switch(res.data.MessageType){
                    case SDP_TYPE.OFFER:
                        handleOffer(res.data.Data)
                        break
                    case SDP_TYPE.ANSWER:
                        handleAnswer(res.data.Data)
                        break
                    case SDP_TYPE.CANDIDATE:
                        handleCandidate(res.data.Data)
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

var handleCandidate = (data) => {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: data.label,
        candidate: data.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
}

// handler functions
function onIceCandidate(event) {
    if (event.candidate) {
        console.log('Sending ice candidate');
        axios.post(inputUri.value + '/data/' + peerId, {
            MessageType: SDP_TYPE.CANDIDATE,
            Data: {
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMID,
                candidate: event.candidate.candidate,
            }
        })
    }
}

function onAddStream(event) {
    console.log('Adding stream')
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.stream;
}