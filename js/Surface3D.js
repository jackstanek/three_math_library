/**
 * Represents a 3D mathematical surface. For now it's just a
 * ParametricGeometry object but more features may be added in the
 * future.
 */

var Surface3D = function(func, parameters) {
    THREE.ParametricGeometry.call(this, func);
}
