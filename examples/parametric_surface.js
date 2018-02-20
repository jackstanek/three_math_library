var container = require('div');
var $ = require('jquery');
var THREE = require('three@0.90');
var db = require('db');


var TrackballControls = require('three-trackballcontrols@0.0.7');



var width = $(container).width();
var height = $(container).height();

var renderer = new THREE.WebGLRenderer( {antialias:true, alpha:true } );
renderer.setSize(width, height);
container.append( renderer.domElement );

var scene = new THREE.Scene();

var VIEW_ANGLE = 10, ASPECT = width / height, NEAR = 10.0, FAR = 20000;
var camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
scene.add(camera);

camera.position.set(30,60,40);
camera.up = new THREE.Vector3(0,0,1);
camera.lookAt(scene.position);	

var controls = new TrackballControls( camera, renderer.domElement );


function f_surface(u,v) {

    var x = 4*u-2;
    var y = 4*v-2;
    var z = x*x-y*y;
    
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
//     color: 0xffbbff,
//     fog: false,
//   },
// });
// thesurface.add(sprite);
// sprite.position.x = 10;
// sprite.scale.set(0.1,0.1,0.1);
// console.log(sprite.scale);


// animation loop
animate();

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    controls.update();
}
