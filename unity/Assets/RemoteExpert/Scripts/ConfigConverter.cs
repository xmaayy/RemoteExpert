using System.Reflection;
using System;
using System.IO;
using System.Collections.Generic;
using UnityEngine;
using Newtonsoft.Json.Linq; 

namespace com.RemoteExpert{
    public class ConfigConverter : MonoBehaviour
    {
        public Router Router;
        public RestModel Model;

        public ConfigConverter(RestModel model) {
            this.Model = model;
        }
        private void Awake()
        {
            string path = Application.dataPath +  "/Resources/config.json";
            // Read the file from the current directory
            string conf = System.IO.File.ReadAllText(path);
            // print(configuration);
            // Parse the object into JSON
            // Read the configuration file in the resources directory
            // var configJson = Resources.Load<TextAsset>("config.json");
            // string configuration = configJson.ToString();
            // Parse the object into JSON
            JObject configObject = JObject.Parse(conf);
            JToken restConfigTokens = configObject["rest"];
            JToken customConfigTokens = configObject["customHandlers"];

            List<RestConfig> restConfigs = new List<RestConfig>();
            List<Config> customConfigs = new List<Config>();

            foreach (JToken token in restConfigTokens){
                RestConfig restConfig = new RestConfig(token);
                restConfigs.Add(restConfig);
            }
            foreach (JToken token in customConfigTokens){
                Config config = new Config(token);
                customConfigs.Add(config);
            }
            this.Router = new Router(restConfigs.ToArray(), customConfigs.ToArray(), this.Model);
        }

        // Get the json
        // For each rest item
        // Make a new handler with Rest
        // MakeRestHandler, with Prefab, available verbs, allowed attributes

    }

    public class Router : MonoBehaviour
    {
        // fed in a series of handlers, and 
        public Dictionary<string, Handler> Routes = new Dictionary<string, Handler>();
        public Router(RestConfig[] restConfigs, Config[] customHandlerConfigs, RestModel model){
            // for every configuration create a route with an associated handler
            foreach(RestConfig restConfig in restConfigs){
                // create the rest handler
                Handler handler = new RestHandler(restConfig.verbs, restConfig.prefab, model);
                this.Routes.Add(restConfig.name, handler);
            }
            // for the other configurations these use custom handlers
            foreach(Config config in customHandlerConfigs){
                // we need to get the type of the handler from the string provided
                Type T = Type.GetType(config.handler);
                // Check that the type is a subclass of handler, otherwise the conversion would fail
                if (T.IsSubclassOf(typeof(Handler))){
                    ConstructorInfo constructor = T.GetConstructors()[0];
                    // create arguments
                    object[] array = {};
                    // There are no arguments so we generate a new Handler
                    this.Routes.Add(config.name, constructor.Invoke(array) as Handler);
                }
            }
        }

        public string route(string message){
            JObject messageObject = JObject.Parse(message);

            string name = messageObject["name"].Value<string>();

            Handler handler = this.Routes[name];
            return handler.handle(messageObject);
        }
    }

    // public class Sender() {
    // }

    public class Config {
        public string name;
        public string handler;
        public string[] verbs;

        public Config (JToken config) {
            this.name = config["name"].Value<string>();
            this.verbs = config["verbs"].ToObject<string[]>();
            this.handler = config["handler"].Value<string>();
        }
    }

    public class RestConfig {
        public string name;
        public string prefab;
        public string[] verbs;
        public string attributes; 

        public RestConfig(JToken config){
            this.name = config["name"].Value<string>();
            this.prefab = config["prefab"].Value<string>();
            this.verbs = config["verbs"].ToObject<string []>();
            // Attribute control can be added in future iterations
            // this.attributes = config["attributes"].ToString();
        }
    }

    public abstract class Handler : MonoBehaviour
    {
        public Handler(){}
        public string handle (JObject message){
            return "Handle method not implemented";
        }
    }


    public class RestHandler : Handler
    {

        public string PrefabFileName;
        public GameObject Prefab;
        public RestModel Model;
        public string[] Verbs;
        public RestHandler(string[] verbs, string prefabFileName, RestModel model) : base(){

            this.Model = model;
            this.Verbs = verbs;
            this.PrefabFileName = prefabFileName;
        }

        public void Awake() {
            GameObject prefab = Resources.Load("Prefabs/" + this.PrefabFileName) as GameObject;
            this.Prefab = prefab;
        }

        public string handle (JObject message){
            string method = message["method"].Value<string>();
            string name = message["name"].Value<string>();
            string body = message["body"].ToString();
            string id = message["id"].Value<string>();

            if (!Array.Exists(this.Verbs, verb => verb == method )){
                return "Not a valid request";
            } 

            if (method == "getAll"){
                return this.Model.getAll(name);
            }

            if (method == "post"){
                return this.Model.post(name, body, this.Prefab);
            }

            if (id == ""){
                return "No id provided";
            }

            Guid uid = Guid.Parse(id);

            if (method == "get"){
                return this.Model.get(name, uid);
            }

            if (method == "put"){
                return this.Model.put(name, uid, body);
            }

            if (method == "delete"){
                return this.Model.delete(name, uid);
            }

            return "Request failed";
        }
    }
}