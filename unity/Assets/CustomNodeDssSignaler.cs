// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace Microsoft.MixedReality.WebRTC.Unity
{
    /// <summary>
    /// Simple signaler for debug and testing.
    /// This is based on https://github.com/bengreenier/node-dss and SHOULD NOT BE USED FOR PRODUCTION.
    /// </summary>
    [AddComponentMenu("MixedReality-WebRTC/NodeDSS Signaler")]
    public class CustomNodeDssSignaler : NodeDssSignaler
    {
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
