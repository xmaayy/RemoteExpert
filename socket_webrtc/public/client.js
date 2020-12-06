/*
For the purposes of our fourth year project, the Hololens will play the role
of the caller, creating the room and broadcasting its signal. The Electron client
is the non-caller here. The caller in this code will attempt to broadcast its signal
to the hololens, whereas the non-caller will only listen. Keep this in mind while
you're reading the code
*/


// getting dom elements
var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

// variables
var roomNumber;
var localStream;
var remoteStream;
var rtcPeerConnection;
// Needed some defaults
var iceServers = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]
}
var streamConstraints = { audio: true, video: true };
var isCaller;

// This is initializing the connection to the STUN server. In our case its local
// but realistically it could be anywhere
var socket = io('http://localhost:3000');

// Attatching the join-room function to the button on the page
btnGoRoom.onclick = function () {
    if (inputRoomNumber.value === '') {
        alert("Please type a room number")
    } else {
        roomNumber = inputRoomNumber.value;
        socket.emit('create or join', roomNumber);
        divSelectRoom.style = "display: none;";
        divConsultingRoom.style = "display: block;";
    }
};

socket.on('created', function (room) {
    // When we create the channel we need to make sure we know that we're the one
    // that opened it (everything gets rebroadcast so knowing the origin is important)
    // and then we also need to start showing our stream on the 'local' client
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

socket.on('joined', function (room) {
    // You can see that when we join (not create) a room, we need to not get
    // a camera and audio feed because those are already in use by the other
    // client we have open. So just tell the other client we're ready to go!
    socket.emit('ready', room);
});

socket.on('candidate', function (event) {
    // Simple handler for adding an ICE candidate. We use two hardcoded ones
    // already
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('ready', function () {
    // On ready recieved, this should only be acted on by the creator of the room
    // (known here as the caller) because they're the ones that are going to be
    // broadcasting to the rest of the clients in the room
    if (isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                // Once the tracks have been added and we create the SDP params
                // from the broadcaster side we can send the offer to the STUN 
                // server (local) for rebroadcasting to the room
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('offer', function (event) {
    // This ready offer should only be acted on by the one joining a room because
    // they're going to be listening to the caller. So they dont add any media
    // tracks to their session description.
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                // Once we've created a session description without any media tracks
                // send the answer back through the socket
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('answer', function (event) {
    // Again this is the caller that should be acting on this
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
})

// handler functions
function onIceCandidate(event) {
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}

function onAddStream(event) {
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.stream;
}