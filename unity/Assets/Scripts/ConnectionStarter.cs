using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Microsoft.MixedReality.WebRTC.Unity;

public class ConnectionStarter : MonoBehaviour
{
    // Start is called before the first frame update
    public PeerConnection pc;

    void Start()
    {
    }

    // Update is called once per frame
    void Update()
    {
    }

    public void Connect(){
        print("Trying to connect");
        // var config = new PeerConnectionConfiguration{
        //     IceServers = new List<IceServer> {
        //         Urls = { "stun:stun.1.google.com:19302"}
        //     }
        // };
        // await pc.InitializeAsync(config);
        print("Peer connection initialized.");
    }

}
