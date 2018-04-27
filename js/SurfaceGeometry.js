var PARAMETRIC_SURFACE_DEFAULT_PARAMS = {
    xMin: -5,
    xMax:  5,
    yMin: -5,
    yMax:  5,
    slices: 25
};

/**
 * A SurfaceGeometry is a geometry of the graph of some function f :
 * R2 -> R1, f(x, y) = z; This mesh represents the graph of this
 * function in R3.
 *
 * The constructor takes a function f which takes two numbers as
 * parameters and returns a single number. The parametric geometry is
 * then passed a function returning (u, v, f(u, v)) for u, v in [0, 1]
 *
 * This class is essentially a thin, configurable wrapper around the
 * ParametricGeometry class in three.js.
 */
var SurfaceGeometry = function(f, params = {}) {
    setParamsFromDefaults(params, PARAMETRIC_SURFACE_DEFAULT_PARAMS);

    THREE.ParametricGeometry.call(this, function(u, v, t) {
        let result = t || new THREE.Vector3(),
            xRange = (params.xMax - params.xMin),
            yRange = (params.yMax - params.yMin),
            x = params.xMin + u * xRange,
            y = params.yMin + v * yRange;

        return result.set(x, y, f(x, y));
    }, params.slices, params.slices);

    this.type = "SurfaceGeometry";
}

SurfaceGeometry.prototype = Object.create(THREE.ParametricGeometry.prototype);
SurfaceGeometry.prototype.constructor = SurfaceGeometry;
