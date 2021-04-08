# Remote Expert Javascript - remote-expert-js
![Remote Expert](../Docs/Logos/01.jpg)

This npm package is the base-station library for the RemoteExpert application.

## Installation

```npm install remote-expert-js```

## Modules

There are two main modules. The QR Code generator, and the Remote Expert Connection.

### QR Code generator

QR code generation is used to generate a unique qr code that contains all the information needed for a HoloLens running a Remote Expert Application to connect to the javascript application.

The qr code generator is simple to use.

Import it with

`import { generateQr } from 'remote-expert-js';`

Then use it by calling `generateQr`;

This function takdes 4 arguments.
- The url and port number of the signalling server: string
- An id that represents the user of the baseStation: string
- A 128bit base64 initialization vector: string
- A 256bit base64 shared secret key: string

`
    const svgElement = generateQr("http://127.0.0.1:3000", "base-station-user", 'bjdnbK4WYt1Ly0LBK6eYq8==', 'SPI6ZRQehawswqxYSvWhSsMFod8hlJ+4Zfw8VHgyY64='); 
`

The function will return an svgElement that can be embeded into your application

### Remote Expert Connection

The remote expert connection is the module that creates the connection through a signaler, manages the connection, streams audio and video, and handles the data channel for the underlying WebRTC connection to the Remote Agent.

Import it with:

`import { RemoteExpertConnection } from 'remote-expert-js'`

An instance of the RemoteExpertConnection class can be initialized using the class constructor which takes an object as the argument with the following fields:
- localVideoElement: an HTML Media element, this is where the video stream that is captured through your webcam will be rendered
- remoteVideoElement: an HTML Media element, this is where the video stream received from the Remote Agenet will be rendered
- iceServerUrls: Ice servers can be read about (here)[https://en.wikipedia.org/wiki/Interactive_Connectivity_Establishment]
- pollInterval: a number, how long between each poll of the signalling server (ms),
- encrypted: boolean, should the signalling process be encrypted
- onOfferCreated: callback function when the connection manager creates an offer
- onPollingOffers: callback function when the connection manager polls for offers
- onLocalStreamInitialized: callback function when the local video stream has been initialized
- onConnected: callback function when a connection between the peers has been negotiated
- onMessageReceived: callback functino when a message is received from the server. Takes one argument, the received message (string).

Once a RemoteExpertConnection instance has been initialized there are two options for creating a connection
- Polling for offers
- Creating an offer

#### Polling for offers
If the other peer has created an offer, you can poll for it by calling the `pollOffers` function.
This takes the following arguments
- The id that identifies the base-station: string
- The id that identifies the remote agent: string
- The url of the signalling server: string
- The private key: string, or empty if not encrypted
- The initialization vector: string, or empty if not encrypted

#### Creating an offer
If you would like to create an offer, you can create one using the `createOffer` function.
This takes the same arguments as polling for offers.
- The id that identifies the base-station: string
- The id that identifies the remote agent: string
- The url of the signalling server: string
- The private key: string, or empty if not encrypted
- The initialization vector: string, or empty if not encrypted

The Remote Agent should now scan the QR code that you have generated, and the connection will be negotiated between the two Peers.

#### Sending a message
Once a connection has been established you can send messages to the Remote Agent using the `sendMessage` function

This only takes one argument message which is a string. See the Readme in the Unity package to see the format of requests supported by the Remote Agent.

### Demo

In the github repository there is a demo application that uses this library and its accompanying Unity library.
