using UnityEngine;
public class Raycaster {
    public Raycaster() {}
    private Ray getRay(float[] offset) {
        if (offset.Length >= 2){
            return Camera.main.ViewportPointToRay(new Vector3(offset[0], offset[1], 0));
        } else {
            return Camera.main.ViewportPointToRay(new Vector3(0, 0, 0));
        }
    }
    public RaycastHit getHit(float[] offset, LayerMask layerMask, float maxDistance) {
        RaycastHit hit;

        Ray ray = getRay(offset);

        Physics.Raycast(ray, out hit, maxDistance, layerMask);
        return(hit);
    }
}