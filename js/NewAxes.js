'use strict';

/* Get the vector compotent from the letter name of its axis. */
function axisLetterToIndex(letter) {
    switch (letter) {
    case "X":
    case "x":
        return 0;
    case "Y":
    case "y":
        return 1;
    case "Z":
    case "z":
        return 2;
    default:
        return NaN;
    }
}

const AXIS_DEFAULT_PARAMS = {
    axis: "x",
    size: 1,
    negSize: 1,
    label: "x",
    showLabels: true,
    color: 0x000000,
    axisWidth: 2
};

/**
 * The Axis class is essentially a glorified THREE.Line object. The
 * constructor does some fancy things like add arrowheads,
 * automatically set the length, and add a label. An Axis is always
 * "centered" around the origin and extends according to the lenght
 * parameters given.
 */
var Axis = function(parameters) {
    parameters = parameters || {};
    setParamsFromDefaults(parameters,
                          AXIS_DEFAULT_PARAMS);
    let axisIndex = axisLetterToIndex(parameters.axis);

    /* Get some points to represent the ends of the axis */
    let minExtent = new THREE.Vector3(),
        maxExtent = new THREE.Vector3();
    minExtent.setComponent(axisIndex, -parameters.negSize);
    maxExtent.setComponent(axisIndex, parameters.size);

    /* Create a THREE geometry out of that */
    let geometry = new THREE.Geometry();
    geometry.vertices.push(minExtent, maxExtent);

    let material = new THREE.LineBasicMaterial({
        color: parameters.color,
        linewidth: parameters.axisWidth
    });

    THREE.Line.call(this, geometry, material);

    let label = new CanvasTextLabel(parameters.label);
    label.position.setComponent(axisIndex, parameters.size);
    this.add(label);
};

Axis.prototype = Object.create(THREE.Line.prototype);
