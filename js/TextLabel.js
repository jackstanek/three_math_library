// add text label

// still need to work on getting the text to show up at a good size
// If make font size small, then it shows up blurry.
// Haven't figured out why the fontsize/scale seem to have
// different effects in different contexts.

'use strict';

var CanvasTextLabel = function (message, parameters) {
    /* Nested helper function to find the next largest power of two */
    function nextPowerOfTwo(x) {
        return Math.pow(2, Math.ceil(Math.log2(x)));
    }

    if (!parameters) {
        parameters = {};
    }

    var fontFace   = parameters.fontFace   || "sans-serif";
    var fontSize   = parameters.fontSize   || 512;
    var scale      = parameters.scale      || 0.7;
    var textColor  = parameters.textColor  || "#000000";
    var fontWeight = parameters.fontWeight || "Bold ";

    /* Make a canvas drawing context */
    var canvas = document.createElement('canvas');
    this.context = canvas.getContext('2d');

    /* Do font measurement to get a correct canvas size */
    this.context.font  = fontWeight + fontSize + "px " + fontFace;
    var metrics = this.context.measureText(message);
    canvas.width  = nextPowerOfTwo(metrics.width);
    canvas.height = nextPowerOfTwo(fontSize);

    /* Reset our font style */
    this.context.font         = fontWeight + fontSize + "px " + fontFace;
    this.context.fillStyle    = textColor;
    this.context.textBaseline = "bottom";
    this.context.font = fontWeight + fontSize + "px " + fontFace;

    this.context.fillText(message, 0, canvas.height, canvas.width);

    // canvas contents will be used for a texture
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.minFilter = THREE.NearestFilter;
    this.material = new THREE.SpriteMaterial({map: this.texture});

    THREE.Sprite.call(this, this.material);

    this.scale.set(scale, scale, 1);
}

CanvasTextLabel.prototype = Object.create(THREE.Sprite.prototype);

// change the text label to a new message
CanvasTextLabel.prototype.set = function(message) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let metrics = this.context.measureText(message);
    this.canvas.width = metrics.width;
    this.canvas.height = metrics.height;
    this.context.fillText(message, this.canvas.width / 2, this.canvas.height / 2, this.canvas.width);
    this.texture.needsUpdate = true;
}
