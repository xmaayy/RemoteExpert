using UnityEngine;
public class Raycaster {
    public Raycaster() {}
    private Ray getRay(float[] offset, Camera camera) {
        if (offset.Length >= 2){
            return camera.ViewportPointToRay(new Vector3(offset[0], offset[1], 0));
        } else {
            return camera.ViewportPointToRay(new Vector3(0, 0, 0));
        }
    }
    public RaycastHit getHit(float[] offset, LayerMask layerMask, float maxDistance, Camera camera) {
        RaycastHit hit;

        Ray ray = getRay(offset, camera);

        Physics.Raycast(ray, out hit, maxDistance, layerMask);
        return(hit);
    }
}