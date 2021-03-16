using UnityEngine;
using Microsoft.MixedReality.Toolkit.Input;
using Microsoft.MixedReality.Toolkit;
using System.Collections.Generic;
using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace com.RemoteExpert
{
        public class MarkerInstance {
            public GameObject GameObject;
            private Vector3 Location;

            private Color color;
            public Guid id;

            public MarkerInstance (GameObject gameObject, Vector3 location){
                GameObject = gameObject;
                Location = location;

                id = Guid.NewGuid();

                color = getRandomColor();
                setColor(gameObject, color);
            }

            private Color getRandomColor() {
                System.Random rnd = new System.Random();
                return new Color32(Convert.ToByte(rnd.Next(256)), Convert.ToByte(rnd.Next(256)), Convert.ToByte(rnd.Next(256)), 255);
            }

            private void setColor(GameObject gameObject, Color color){
                var renderer = gameObject.GetComponent<Renderer>();
                renderer.material.SetColor("_Color", color);
            }

            public void SetLocation (Vector3 location){
                GameObject.transform.TransformPoint(location);
                Location = location;
            }
        }

        public class RestModel: MonoBehaviour, IMixedRealityPointerHandler {

            public GameObject Prefab;
            public LayerMask LayerMask;
            public float MaxDistance;
            public Dictionary<Guid, MarkerInstance> Instances = new Dictionary<Guid, MarkerInstance>();
            public Dictionary<Guid, GameObject> Prefabs = new Dictionary<Guid, GameObject>();

            public float[] InputCoordinates;
            private Raycaster raycaster = new Raycaster();
            public void place(float[] inputCoordinates, GameObject prefab = null){
                if (prefab == null) {
                    prefab = Prefab;
                }
                if (prefab != null){
                    RaycastHit hit = raycaster.getHit(inputCoordinates, LayerMask, MaxDistance);
                    GameObject gameObject = Instantiate(prefab, hit.point, Quaternion.identity);
                    MarkerInstance instance = new MarkerInstance(gameObject, hit.point);
                    Instances[instance.id] = instance;
                }
            }

            public MarkerInstance get(Guid id) {
                MarkerInstance instance = Instances[id];
                if (instance != null){
                    return instance;
                }
                throw new KeyNotFoundException("Could not find the instance");
            }

            public Guid remove(Guid id) {
                MarkerInstance instance = get(id);
                Destroy(instance.GameObject);
                Instances.Remove(id);

                return id;
            }

            public MarkerInstance raycastMove(Guid id, float[] inputCoordinates){
                RaycastHit hit = raycaster.getHit(inputCoordinates, LayerMask, MaxDistance);

                return move(id, hit.point);
            }

            public MarkerInstance move(Guid id, Vector3 location){
                MarkerInstance instance = get(id);
                instance.SetLocation(location);
                return instance;
            }

            private void OnEnable() {
                CoreServices.InputSystem?.RegisterHandler<IMixedRealityPointerHandler>(this);
            }
            private void OnDisable() {
                CoreServices.InputSystem?.UnregisterHandler<IMixedRealityPointerHandler>(this);
            }

            /// <inheritdoc/>
            public void OnPointerClicked(MixedRealityPointerEventData eventData) {
                place(InputCoordinates, Prefab);
            }
            /// <inheritdoc/>
            public void OnPointerDown(MixedRealityPointerEventData eventData) { }

            /// <inheritdoc/>
            public void OnPointerDragged(MixedRealityPointerEventData eventData) { }

            /// <inheritdoc/>
            public void OnPointerUp(MixedRealityPointerEventData eventData) { }

            public void coordinateMessage(string value){

                var coords = JObject.Parse(value);

                float x = coords["x"].Value<float>();
                float y = coords["y"].Value<float>();

                float[] inputCoordinates = {x, y};
                place(inputCoordinates);
            }

        }
}