using UnityEngine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace com.RemoteExpert
{
    public class MessageHandler {
        public RestModel Rest;

        public MessageHandler(RestModel rest) {
            Rest = rest;
        }
        public void coordinateMessage(string value){

            var coords = JObject.Parse(value);

            float x = coords["x"].Value<float>();
            float y = coords["y"].Value<float>();

            float[] inputCoordinates = {x, y};
            Rest.place(inputCoordinates);
        }
    }
}