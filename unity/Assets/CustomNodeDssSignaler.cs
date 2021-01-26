// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
using System;
using System.Collections;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using com.RemoteExpert;

namespace Microsoft.MixedReality.WebRTC.Unity
{
    /// <summary>
    /// Simple signaler for debug and testing.
    /// This is based on https://github.com/bengreenier/node-dss and SHOULD NOT BE USED FOR PRODUCTION.
    /// </summary>
    [AddComponentMenu("MixedReality-WebRTC/NodeDSS Signaler")]
    public class CustomNodeDssSignaler : Signaler
    {
        public string Base64Key;
        public string Base64IV;
        private byte[] Key {get; set;}
        private byte[] IV {get; set;}
        public bool Encrypt = false;
        /// <summary>
        /// Automatically log all errors to the Unity console.
        /// </summary>
        [Tooltip("Automatically log all errors to the Unity console")]
        public bool AutoLogErrors = true;

        /// <summary>
        /// Unique identifier of the local peer.
        /// </summary>
        [Tooltip("Unique identifier of the local peer")]
        public string LocalPeerId;

        /// <summary>
        /// Unique identifier of the remote peer.
        /// </summary>
        [Tooltip("Unique identifier of the remote peer")]
        public string RemotePeerId;

        /// <summary>
        /// The https://github.com/bengreenier/node-dss HTTP service address to connect to
        /// </summary>
        [Header("Server")]
        [Tooltip("The node-dss server to connect to")]
        public string HttpServerAddress = "http://127.0.0.1:3000/";

        /// <summary>
        /// The interval (in ms) that the server is polled at
        /// </summary>
        [Tooltip("The interval (in ms) that the server is polled at")]
        public float PollTimeMs = 500f;

        /// <summary>
        /// Message exchanged with a <c>node-dss</c> server, serialized as JSON.
        /// </summary>
        /// <remarks>
        /// The names of the fields is critical here for proper JSON serialization.
        /// </remarks>
        [Serializable]
        private class NodeDssMessage
        {
            /// <summary>
            /// Separator for ICE messages.
            /// </summary>
            public const string IceSeparatorChar = "|";

            /// <summary>
            /// Possible message types as-serialized on the wire to <c>node-dss</c>.
            /// </summary>
            public enum Type
            {
                /// <summary>
                /// An unrecognized message.
                /// </summary>
                Unknown = 0,

                /// <summary>
                /// A SDP offer message.
                /// </summary>
                Offer,

                /// <summary>
                /// A SDP answer message.
                /// </summary>
                Answer,

                /// <summary>
                /// A trickle-ice or ice message.
                /// </summary>
                Ice
            }

            /// <summary>
            /// Convert a message type from <see xref="string"/> to <see cref="Type"/>.
            /// </summary>
            /// <param name="stringType">The message type as <see xref="string"/>.</param>
            /// <returns>The message type as a <see cref="Type"/> object.</returns>
            public static Type MessageTypeFromString(string stringType)
            {
                if (string.Equals(stringType, "offer", StringComparison.OrdinalIgnoreCase))
                {
                    return Type.Offer;
                }
                else if (string.Equals(stringType, "answer", StringComparison.OrdinalIgnoreCase))
                {
                    return Type.Answer;
                }
                throw new ArgumentException($"Unkown signaler message type '{stringType}'", "stringType");
            }

            public static Type MessageTypeFromSdpMessageType(SdpMessageType type)
            {
                switch (type)
                {
                case SdpMessageType.Offer: return Type.Offer;
                case SdpMessageType.Answer: return Type.Answer;
                default: return Type.Unknown;
                }
            }

            public IceCandidate ToIceCandidate()
            {
                if (MessageType != Type.Ice)
                {
                    throw new InvalidOperationException("The node-dss message it not an ICE candidate message.");
                }
                var parts = Data.Split(new string[] { IceSeparatorChar }, StringSplitOptions.RemoveEmptyEntries);
                // Note the inverted arguments; candidate is last in IceCandidate, but first in the node-dss wire message
                return new IceCandidate
                {
                    SdpMid = parts[2],
                    SdpMlineIndex = int.Parse(parts[1]),
                    Content = parts[0]
                };
            }

            private string EnsureSemanticGrouping(string sdpMessage)
            {
                //Checks if the msid semantic group has been set in the message.
                if (!sdpMessage.Contains("msid-semantic: WMS\r"))
                    return sdpMessage;

                return sdpMessage.Replace("msid-semantic: WMS\r", "msid-semantic: WMS local_av_stream\r").Replace("msid:-", "msid:-local_av_stream");
            }

            public NodeDssMessage(SdpMessage message)
            {
                MessageType = MessageTypeFromSdpMessageType(message.Type);
                Data = EnsureSemanticGrouping(message.Content);
                IceDataSeparator = string.Empty;
            }

            public NodeDssMessage(IceCandidate candidate)
            {
                MessageType = Type.Ice;
                Data = string.Join(IceSeparatorChar, candidate.Content, candidate.SdpMlineIndex.ToString(), candidate.SdpMid);
                IceDataSeparator = IceSeparatorChar;
            }

            /// <summary>
            /// The message type.
            /// </summary>
            public Type MessageType = Type.Unknown;

            /// <summary>
            /// The primary message contents.
            /// </summary>
            public string Data;

            /// <summary>
            /// The data separator needed for proper ICE serialization.
            /// </summary>
            public string IceDataSeparator;
        }

        /// <summary>
        /// Internal timing helper
        /// </summary>
        private float timeSincePollMs = 0f;

        /// <summary>
        /// Internal last poll response status flag
        /// </summary>
        private bool lastGetComplete = true;


        #region ISignaler interface

        /// <inheritdoc/>
        public override Task SendMessageAsync(WebRTC.SdpMessage message)
        {
            return SendMessageImplAsync(new NodeDssMessage(message));
        }

        /// <inheritdoc/>
        public override Task SendMessageAsync(IceCandidate candidate)
        {
            return SendMessageImplAsync(new NodeDssMessage(candidate));
        }

        #endregion

        private Task SendMessageImplAsync(NodeDssMessage message)
        {
            // This method needs to return a Task object which gets completed once the signaler message
            // has been sent. Because the implementation uses a Unity coroutine, use a reset event to
            // signal the task to complete from the coroutine after the message is sent.
            // Note that the coroutine is a Unity object so needs to be started from the main Unity app thread.
            // Also note that TaskCompletionSource<bool> is used as a no-result variant; there is no meaning
            // to the bool value.
            // https://stackoverflow.com/questions/11969208/non-generic-taskcompletionsource-or-alternative
            var tcs = new TaskCompletionSource<bool>();
            _mainThreadWorkQueue.Enqueue(() => StartCoroutine(PostToServerAndWait(message, tcs)));
            return tcs.Task;
        }

        private byte[] Base64ToBytes(string base64, int expectedLength){
            if (base64.Length != expectedLength){
                throw new ArgumentException("Base64 value needs to be" + expectedLength + "but was " + base64.Length.ToString());
            }
            return System.Convert.FromBase64String(base64);
        }

        /// <summary>
        /// Unity Engine Start() hook
        /// </summary>
        /// <remarks>
        /// https://docs.unity3d.com/ScriptReference/MonoBehaviour.Start.html
        /// </remarks>
        private void Start()
        {
            if (string.IsNullOrEmpty(HttpServerAddress))
            {
                throw new ArgumentNullException("HttpServerAddress");
            }
            if (!HttpServerAddress.EndsWith("/"))
            {
                HttpServerAddress += "/";
            }

            // If not explicitly set, default local ID to some unique ID generated by Unity
            if (string.IsNullOrEmpty(LocalPeerId))
            {
                LocalPeerId = SystemInfo.deviceName;
            }

            if (Encrypt){
                //check for hexKey and hexIV if they are fields 
                if (Base64Key.Length > 0){
                    this.Key = Base64ToBytes(Base64Key, 44);
                }
                if (Base64IV.Length > 0){
                    this.IV = Base64ToBytes(Base64IV, 24);
                }
            }
        }

        /// <summary>
        /// Internal helper for sending HTTP data to the node-dss server using POST
        /// </summary>
        /// <param name="msg">the message to send</param>
        private IEnumerator PostToServer(NodeDssMessage msg)
        {
            if (RemotePeerId.Length == 0)
            {
                throw new InvalidOperationException("Cannot send SDP message to remote peer; invalid empty remote peer ID.");
            }

            byte[] data;

            if (Encrypt){
                data = System.Text.Encoding.UTF8.GetBytes(JsonUtility.ToJson(new EncryptedMessage(msg, this.Key, this.IV)));
            } else {
                data = System.Text.Encoding.UTF8.GetBytes(JsonUtility.ToJson(msg));
            }
            var www = new UnityWebRequest($"{HttpServerAddress}data/{RemotePeerId}", UnityWebRequest.kHttpVerbPOST);
            www.uploadHandler = new UploadHandlerRaw(data);

            yield return www.SendWebRequest();

            if (AutoLogErrors && (www.isNetworkError || www.isHttpError))
            {
                Debug.Log($"Failed to send message to remote peer {RemotePeerId}: {www.error}");
            }
        }

        private class EncryptedMessage{
            public string Cipher;
            public string Hmac;

            public EncryptedMessage(NodeDssMessage msg, byte[] Key, byte[] IV){
                var jsonMessage = JsonUtility.ToJson(msg);
                Cipher = System.Convert.ToBase64String(AES.EncryptStringToBytes_Aes(jsonMessage, Key, IV));
                Hmac = System.Convert.ToBase64String(HMAC.Sign(Key, jsonMessage));
            }

            public static NodeDssMessage DecryptMessage(string cipherText, string hmac, byte[] Key, byte[] IV){
                byte[] cipherBytes = System.Convert.FromBase64String(cipherText);
                byte[] hmacBytes = System.Convert.FromBase64String(hmac);
                var jsonPlainText = AES.DecryptStringFromBytes_Aes(cipherBytes, Key, IV);
                if (HMAC.Verify(Key, jsonPlainText, hmacBytes)){
                    NodeDssMessage nodeMessage = JsonUtility.FromJson<NodeDssMessage>(jsonPlainText);
                    return nodeMessage;
                }else{
                    throw new InvalidOperationException("Cannot verify the sender of the SDP message; invalid HMAC");
                }
            }
        }

        /// <summary>
        /// Internal helper to wrap a coroutine into a synchronous call for use inside
        /// a <see cref="Task"/> object.
        /// </summary>
        /// <param name="msg">the message to send</param>
        private IEnumerator PostToServerAndWait(NodeDssMessage message, TaskCompletionSource<bool> tcs)
        {
            yield return StartCoroutine(PostToServer(message));
            const bool dummy = true; // unused
            tcs.SetResult(dummy);
        }
 
        /// <summary>
        /// Internal coroutine helper for receiving HTTP data from the DSS server using GET
        /// and processing it as needed
        /// </summary>
        /// <returns>the message</returns>
        private IEnumerator CO_GetAndProcessFromServer()
        {
            if (HttpServerAddress.Length == 0)
            {
                throw new InvalidOperationException("Cannot receive SDP messages from remote peer; invalid empty HTTP server address.");
            }
            if (LocalPeerId.Length == 0)
            {
                throw new InvalidOperationException("Cannot receive SDP messages from remote peer; invalid empty local peer ID.");
            }

            var www = UnityWebRequest.Get($"{HttpServerAddress}data/{LocalPeerId}");
            yield return www.SendWebRequest();

            if (!www.isNetworkError && !www.isHttpError)
            {
                var json = www.downloadHandler.text;

                NodeDssMessage msg;

                if (Encrypt){
                    EncryptedMessage encryptedMessage = JsonUtility.FromJson<EncryptedMessage>(json);
                    msg = EncryptedMessage.DecryptMessage(encryptedMessage.Cipher, encryptedMessage.Hmac, this.Key, this.IV);
                } else {
                    msg = JsonUtility.FromJson<NodeDssMessage>(json);
                }

                // {"Cipher":"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","Hmac":"b4302c1cc75d5916f009768e9396194d6bb7ff4fead75c62534779a778bb7f94"}



                // if the message is good
                if (msg != null)
                {
                    // depending on what type of message we get, we'll handle it differently
                    // this is the "glue" that allows two peers to establish a connection.
                    DebugLogLong($"Received SDP message: type={msg.MessageType} data={msg.Data}");
                    switch (msg.MessageType)
                    {
                    case NodeDssMessage.Type.Offer:
                        // Apply the offer coming from the remote peer to the local peer
                        var sdpOffer = new WebRTC.SdpMessage { Type = SdpMessageType.Offer, Content = msg.Data };
                        PeerConnection.HandleConnectionMessageAsync(sdpOffer).ContinueWith(_ =>
                        {
                            // If the remote description was successfully applied then immediately send
                            // back an answer to the remote peer to acccept the offer.
                            _nativePeer.CreateAnswer();
                        }, TaskContinuationOptions.OnlyOnRanToCompletion | TaskContinuationOptions.RunContinuationsAsynchronously);
                        break;

                    case NodeDssMessage.Type.Answer:
                        // No need to wait for completion; there is nothing interesting to do after it.
                        var sdpAnswer = new WebRTC.SdpMessage { Type = SdpMessageType.Answer, Content = msg.Data };
                        _ = PeerConnection.HandleConnectionMessageAsync(sdpAnswer);
                        break;

                    case NodeDssMessage.Type.Ice:
                        // this "parts" protocol is defined above, in OnIceCandidateReadyToSend listener
                        _nativePeer.AddIceCandidate(msg.ToIceCandidate());
                        break;

                    default:
                        Debug.Log("Unknown message: " + msg.MessageType + ": " + msg.Data);
                        break;
                    }

                    timeSincePollMs = PollTimeMs + 1f; //fast forward next request
                }
                else if (AutoLogErrors)
                {
                    Debug.LogError($"Failed to deserialize JSON message : {json}");
                }
            }
            else if (AutoLogErrors && www.isNetworkError)
            {
                Debug.LogError($"Network error trying to send data to {HttpServerAddress}: {www.error}");
            }
            else
            {
                // This is very spammy because the node-dss protocol uses 404 as regular "no data yet" message, which is an HTTP error
                //Debug.LogError($"HTTP error: {www.error}");
            }

            lastGetComplete = true;
        }

        private void OnEnable()
        {
            print("Enabled the Signaler");
        }

        /// <inheritdoc/>
        protected override void Update()
        {
            // Do not forget to call the base class Update(), which processes events from background
            // threads to fire the callbacks implemented in this class.
            print("updating");
            base.Update();

            // If we have not reached our PollTimeMs value...
            if (timeSincePollMs <= PollTimeMs)
            {
                // ...then we keep incrementing our local counter until we do.
                timeSincePollMs += Time.deltaTime * 1000.0f;
                return;
            }

            // If we have a pending request still going, don't queue another yet.
            if (!lastGetComplete)
            {
                return;
            }

            // When we have reached our PollTimeMs value...
            timeSincePollMs = 0f;

            // ...begin the poll and process.
            lastGetComplete = false;
            StartCoroutine(CO_GetAndProcessFromServer());
        }

        private void DebugLogLong(string str)
        {
#if !UNITY_EDITOR && UNITY_ANDROID
            // On Android, logcat truncates to ~1000 characters, so split manually instead.
            const int maxLineSize = 1000;
            int totalLength = str.Length;
            int numLines = (totalLength + maxLineSize - 1) / maxLineSize;
            for (int i = 0; i < numLines; ++i)
            {
                int start = i * maxLineSize;
                int length = Math.Min(start + maxLineSize, totalLength) - start;
                Debug.Log(str.Substring(start, length));
            }
#else
            Debug.Log(str);
#endif
        }
    }
}

