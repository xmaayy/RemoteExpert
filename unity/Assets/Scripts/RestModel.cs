using UnityEngine;
using Microsoft.MixedReality.Toolkit.Input;
using Microsoft.MixedReality.Toolkit;
using System.Collections.Generic;
using System;

namespace com.RemoteExpert
{
        public class MarkerInstance {
            public GameObject GameObject;
            private Vector3 Location;
            public Guid id;

            public MarkerInstance (GameObject gameObject, Vector3 location){
                GameObject = gameObject;
                Location = location;

                id = Guid.NewGuid();
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

            public float[] InputCoordinates;
            private Raycaster raycaster = new Raycaster();
            public Guid place(){
                if (Prefab != null){
                    RaycastHit hit = raycaster.getHit(InputCoordinates, LayerMask, MaxDistance);
                    GameObject gameObject = Instantiate(Prefab, hit.point, Quaternion.identity);
                    MarkerInstance instance = new MarkerInstance(gameObject, hit.point);
                    Instances[instance.id] = instance;
                    return instance.id;
                } else {
                    throw new KeyNotFoundException("Could not properly create");
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
                place();
            }
            /// <inheritdoc/>
            public void OnPointerDown(MixedRealityPointerEventData eventData) { }

            /// <inheritdoc/>
            public void OnPointerDragged(MixedRealityPointerEventData eventData) { }

            /// <inheritdoc/>
            public void OnPointerUp(MixedRealityPointerEventData eventData) { }

        }
}