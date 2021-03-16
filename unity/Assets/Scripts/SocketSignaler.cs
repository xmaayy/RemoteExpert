using System.Collections;
using System.Collections.Generic;
using System.Threading;
using UnityEngine;
using System.Net.WebSockets;
using Microsoft.MixedReality.WebRTC.Unity;

public class SocketSignaler : NodeDssSignaler
{

    // [Tooltip("The socket signalling service to connect to")]
    // public string SocketAddress = "http://127.0.0.1.:3000/";

    // [Tooltip("The id of the room to connect to")]
    // public string RoomId = "1";
    // private ClientWebSocket webSocket = new ClientWebSocket();

    // private override void Start()
    // {
    //     if (string.IsNullOrEmpty(HttpServerAddress))
    //     {
    //         throw new ArgumentNullException("HttpServerAddress");
    //     }
    //     if (!HttpServerAddress.EndsWith("/"))
    //     {
    //         HttpServerAddress += "/";
    //     }

    //     if (string.IsNullOrEmpty(RoomId))
    //     {
    //         throw new ArgumentNullException("RoomId");
    //     }


    //     // Establish our Socket Connection
    //     ConnectWebSocketAsync();
    // }

    // private async Task ConnectWebSocketAsync()
    // {

    //     // For now this task will not be cancelled, so the token source is just used as a filler
    //     CancellationTokenSource _tokenSource = new CancellationTokenSource();
    //     CancellationToken _token = _tokenSource.Token;

    //     // Connect to the server using the Socket Address
    //     return webSocket.Connection(SocketAddress, token);
    // }

    // private override IENumerator PostToServer(NodeDssMessage msg)
    // {
    //     if (RemotePeerId.Length == 0)
    //     {
    //         throw new InvalidOperationException("Cannot send SDP message to remote peer");
    //     }

    //     if (webSocket.State == WebSocketState.Open){


    //         CancellationTokenSource _tokenSource = new CancellationTokenSource();
    //         CancellationToken _token = _tokenSource.Token;
    //         var messageText = "";

    //         webSocket.SendAsync(, WebSocketMessageType., false, _token)


    //     } else if (webSocket.State == WebSocketState.Connecting) {
    //         // TODO handle if the websocket state is still connecting
    //     } else {
    //         // if the connection is not either connecting connected, try to connect again
    //         ConnectWebSocketAsync();
    //     }
    // }
    

}
