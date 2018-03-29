// add text label

// still need to work on getting the text to show up at a good size
// If make font size small, then it shows up blurry.
// Haven't figured out why the fontsize/scale seem to have
// different effects in different contexts.

'use strict';

var CanvasTextLabel = function (message, parameters) {
    if (!parameters) {
        parameters = {};
    }

    var fontFace   = parameters.fontFace   || "Arial";
    var fontSize   = parameters.fontSize   || 512;
    var scale      = parameters.scale      || 25;
    var textColor  = parameters.textColor  || "#000000";
    var fontWeight = parameters.fontWeight || "Bold ";

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.context.font         = fontWeight + fontSize + "px " + fontFace;
    this.context.fillStyle    = textColor;
    this.context.textAlign    = "center";
    this.context.textBaseline = "middle";

    var metrics = this.context.measureText(message);
    this.canvas.width  = metrics.width;
    this.canvas.height = fontSize;

    this.context.fillText(message, this.canvas.width/2, this.canvas.height/2, this.canvas.width);

    // canvas contents will be used for a texture
    this.texture = new THREE.CanvasTexture(this.canvas);
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
