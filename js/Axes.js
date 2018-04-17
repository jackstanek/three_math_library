'use strict';

/* Some default axis labels for R3 */
const AXIS_LABELS = ["x", "y", "z"];
const AXIS_DEFAULT_PARAMS = {
    size: 1,
    negSize: 1,
    showLabels: true,
    color: 0x000000,
    axisWidth: 2,
    axisTickIncrement: 1,
    axisTickSize: 0.1
};

/**
 * The Axis class is essentially a glorified THREE.Line object. The
 * constructor does some fancy things like add arrowheads,
 * automatically set the length, and add a label. An Axis is always
 * "centered" around the origin and extends according to the lenght
 * parameters given.
 */
var Axis = function(axis, label, parameters) {
    parameters = parameters || {};
    setParamsFromDefaults(parameters,
                          AXIS_DEFAULT_PARAMS);


    /* Get some points to represent the ends of the axis */
    let minExtent = new THREE.Vector3(),
        maxExtent = new THREE.Vector3();
    minExtent.setComponent(axis, -parameters.negSize);
    maxExtent.setComponent(axis, parameters.size);

    /* Create a THREE geometry out of that */
    let geometry = new THREE.Geometry();
    geometry.vertices.push(minExtent, maxExtent);

    let material = new THREE.LineBasicMaterial({
        color: parameters.color,
        linewidth: parameters.axisWidth
    });

    THREE.Line.call(this, geometry, material);

    /* add a label */
    let text_label = new CanvasTextLabel(label);
    text_label.position.setComponent(axis, parameters.size);
    this.add(text_label);

    /* add tick marks */
    this.ticks = new Array();
    for (let tick = -parameters.negSize; tick < parameters.size; tick += parameters.axisTickIncrement) {
        let tickMinExtent = new THREE.Vector3(),
            tickMaxExtent = new THREE.Vector3();

        /* Set tick position along axis */
        tickMinExtent.setComponent(axis, tick);
        tickMaxExtent.setComponent(axis, tick);

        /* "Inflate" the tick */
        tickMaxExtent.setComponent((axis + 1) % 3, parameters.axisTickSize);

        let tickGeometry = new THREE.Geometry();
        tickGeometry.vertices.push(tickMinExtent, tickMaxExtent);

        let tickObject = new THREE.Line(tickGeometry, material);
        this.ticks.push(tickObject);
        this.add(tickObject);
    }

    this.type = "Axis";
};

Axis.prototype = Object.create(THREE.Line.prototype);

/* An Axes3D object is an empty THREE.Object3D with three children
 * which make up the basis axes for R3. The parameters object has the
 * same properties as a single axis, and these properties are used to
 * construct each axis.
 */
var Axes3D = function(parameters) {
    THREE.Object3D.call(this);

    for (let a = 0; a < 3; a++) {
        this.add(new Axis(a, AXIS_LABELS[a], parameters));
    }

    this.type = "Axes3D";
}

Axes3D.prototype = Object.create(THREE.Object3D.prototype);
