var container = require('div');
var $ = require('jquery');
var THREE = require('three@0.90');
var db = require('db');

var TrackballControls = require('three-trackballcontrols@0.0.7');
var OrbitControls = require('three-orbitcontrols@2.0.0');

var control_panel = $("<div id='control-panel'>").appendTo($(container));
var graph = $("<div id='graph'>").appendTo($(container));


control_panel.append("<p>\\(x(u,v) =\\) <input type='text' id='xval'><br/>\\(y(u,v) =\\) <input type='text' id='yval'><br/>\\(z(u,v) =\\) <input type='text' id='zval'><br/>(Can use \\(x\\) and \\(y\\) as shortcuts in \\(z\\).)</p>");

// render start panel labels with mathjax
MathJax.Hub.Register.StartupHook("End",function () { MathJax.Hub.Queue(["Typeset",MathJax.Hub,"control-panel"]);});


// not sure of the right procedure here, as not sure when db is populated
// Want to use value from the database, if it exists.
// Else use these default values
if(db.height === undefined || isNaN(db.height))
    db.height=300;
if(db.width === undefined || isNaN(db.width))
    db.width=300;

if(db.xval === undefined)
    db.xval = '4u-2';
if(db.yval === undefined)
    db.yval = '4v-2';
if(db.zval === undefined)
    db.zval = '(4u-2)^2 - (4v-2)^2';


$('#xval').val(db.xval);
$('#yval').val(db.yval);
$('#zval').val(db.zval);


// set size of graph from
graph.height(db.height);
graph.width(db.width);


var xt=MathExpression.fromText(db.xval);
var yt=MathExpression.fromText(db.yval);
var zt=MathExpression.fromText(db.zval);

$('#xval').on('input', function () {
    db.xval = $(this).val();
});
$('#yval').on('input', function () {
    db.yval = $(this).val();
});
$('#zval').on('input', function () {
    db.zval = $(this).val();
});

// recalculate surface on any changes in db
// Probably should run update only on changes of relevant variables
db.on("change", function(event) {
    // ignore errors for now
    try {
	xt=MathExpression.fromText(db.xval);
    }
    catch (error) {
    }
    try {
	yt=MathExpression.fromText(db.yval);
    }
    catch (error) {
    }
    try{
	zt=MathExpression.fromText(db.zval);
    }
    catch(error) {
    }

    // should also update?
    $('#xval').val(db.xval);
    $('#yval').val(db.yval);
    $('#zval').val(db.zval);


    recalculate_surface();

});



var width = graph.width();
var height = graph.height();

var renderer = new THREE.WebGLRenderer( {antialias:true, alpha:true } );
renderer.setSize(width, height);
graph.append( renderer.domElement );

var scene = new THREE.Scene();

var VIEW_ANGLE = 10, ASPECT = width / height, NEAR = 10.0, FAR = 20000;
var camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
scene.add(camera);

camera.position.set(30,60,40);
camera.up = new THREE.Vector3(0,0,1);
camera.lookAt(scene.position);

//var controls = new TrackballControls( camera, renderer.domElement );
var controls = new OrbitControls( camera, renderer.domElement );


function f_surface(u,v) {

    var x = xt.f({u: u, v:v});
    var y = yt.f({u: u, v:v});
    var z = zt.f({u: u, v:v, x:x, y:y});

    return new THREE.Vector3(x, y, z);
}


var Nu=30, Nv=80;

var surfaceGeometry = new THREE.ParametricGeometry(f_surface, Nu, Nv, false);

var surfaceMaterial = new THREE.MeshLambertMaterial({color: 0x999999, opacity: 0.9, transparent: false, side: THREE.DoubleSide});

var thesurface = new THREE.Mesh( surfaceGeometry, surfaceMaterial )
scene.add(thesurface);

// Colored lights
var light = new THREE.DirectionalLight( 0xff0000 );
light.position.set( 10, 10, 10 );
scene.add( light );
light = new THREE.DirectionalLight( 0x00ff00 );
light.position.set( 10, -10, 10 );
scene.add( light );
light = new THREE.DirectionalLight( 0x0000ff );
light.position.set( -10, -10, 10 );
scene.add( light );
light = new THREE.DirectionalLight( 0x555555 );
light.position.set( 0, 0, -10 );
scene.add( light );
light = new THREE.AmbientLight( 0x222222 );
scene.add( light );

// let sprite = new THREE.TextSprite({
//   textSize: 1,
//   redrawInterval: 250,
//   texture: {
//     text: 'Carpe Diem',
//     fontFamily: 'Arial, Helvetica, sans-serif',
//   },
//   material: {
//     color 0xffbbff,
//     fog: false,
//   },
// });
// thesurface.add(sprite);
// sprite.position.x = 10;
// sprite.scale.set(0.1,0.1,0.1);
// console.log(sprite.scale);

let label = new TextLabel("hello world");

scene.add(label);

// animation loop
animate();

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    controls.update();
}


function recalculate_surface() {

    // should be a way to avoid this check
    // but now, can get called before surface defined
    if(surfaceGeometry === undefined)
	return;

    for (var i = 0; i <= Nv; i ++ ) {
	var v = i / Nv;

	for (var j = 0; j <= Nu; j ++ ) {

	    var u = j / Nu;

	    surfaceGeometry.vertices[i*(Nu+1)+j].copy(f_surface( u, v ));

	}
    }
    surfaceGeometry.dynamic=true;
    surfaceGeometry.verticesNeedUpdate = true;
    surfaceGeometry.elementsNeedUpdate = true;
    surfaceGeometry.uvsNeedUpdate = true;
    surfaceGeometry.normalsNeedUpdate = true;
    surfaceGeometry.tangentsNeedUpdate = true;
    surfaceGeometry.colorsNeedUpdate = true;
}
