/*
for the purposes of our fourth year project, the hololens will play the role
of the caller, initializing the offer and broadcasting the video feed. The electron client
is the non-caller here. the caller in this code will attempt to broadcast its signal
to the hololens, whereas the non-caller will only listen. keep this in mind while
you're reading the code
*/
import { generateQr } from 'remote-expert-js';
import { RemoteExpertConnection } from 'remote-expert-js';


// References for the connection create div and the video streams div
const divOffers = (<HTMLDivElement>window.document.getElementById("connect"));
const divConsultingRoom = (<HTMLDivElement>window.document.getElementById("consultingRoom"));

// References for each of the inputs 
const inputMyId = (<HTMLInputElement>window.document.getElementById("myId"));
const inputPeerId = (<HTMLInputElement>window.document.getElementById("peerId"));
const inputUri = (<HTMLInputElement>window.document.getElementById("signallingServerUrl"));

// References for the two buttons to control activity
// Poll offers should poll the signalling server for 
const btnPollOffers = (<HTMLButtonElement>window.document.getElementById("pollOffers"));
const btnCreateOffer = (<HTMLButtonElement>window.document.getElementById("createOffer"));

const localVideo = (<HTMLMediaElement>window.document.getElementById("localVideo"));
localVideo.muted = true;
const remoteVideo = (<HTMLMediaElement>window.document.getElementById("remoteVideo"));
var remoteVideoSource: MediaStream;

const connection: RemoteExpertConnection = new RemoteExpertConnection({
    localVideoElement: localVideo,
    remoteVideoElement: remoteVideo,
    iceServerUrls: [
        { urls: 'stun:stun.services.mozilla.com' },
        { urls: 'stun:stun.l.google.com:19302' }
    ],
    pollInterval: 2000,
    encrypted: false,
    onOfferCreated: () => {
        console.log('Offer created')
        divOffers.style.display = "none";
        divConsultingRoom.style.display = "block";
    },
    onPollingOffers: () => {
        console.log('Polling offers')
        divOffers.style.display = "none";
        divConsultingRoom.style.display = "block";
    },
    onConnected: () => console.log('Connected'),
    onMessageReceived: (message: string) => console.log('Message Received', message),
    onLocalStreamInitialized: () => {
        console.log('Local video stream initialized')
        divOffers.style.display = "none";
    },
})

remoteVideo.onclick = function clickEvent(e: MouseEvent) {
    // e = Mouse click event.
    // This cast shouldnt be necesary but TypeScript doesnt understand
    // the normal use case here https://github.com/facebook/react/issues/16201
    const node = e.target as HTMLElement;
    var rect = node.getBoundingClientRect();
    var x = e.clientX - rect.left; //x position within the element.
    var y = e.clientY - rect.top;  //y position within the element.
    console.log("Left? : " + x + " ; Top? : " + y + ".");

    // These coords are distance from the top left corner of the
    // bounding rect around the video feed. 
    // Now we construct a post request using the coordinates
    const request = {
        name: "cube",
        verb: "post",
        body: {
            x : x/rect.width,
            y : (1 - y/rect.height)
        }
    }
    connection.sendMessage(JSON.stringify(request));
};

var key = 'SPI6ZRQehawswqxYSvWhSsMFod8hlJ+4Zfw8VHgyY64=';
var iv = 'bjdnbK4WYt1Ly0LBK6eYq8==';

const svgElement = generateQr("http://127.0.0.1:3000", "mattiasLightstone", iv, key);

document.getElementById("mySVG")!.appendChild(svgElement);

// attaching the join-room function to the button on the page
btnCreateOffer.onclick = function () {
    connection.createOffer(inputPeerId.value, inputMyId.value, inputUri.value);
};

btnPollOffers.onclick = () => {
    connection.pollOffers(inputPeerId.value, inputMyId.value, inputUri.value);
}
