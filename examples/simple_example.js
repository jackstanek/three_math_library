var SimpleExample = SimpleExample || {};

SimpleExample.GRAPH_SIZE = 300;

SimpleExample.App = function(div = document.body) {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(SimpleExample.GRAPH_SIZE,
                          SimpleExample.GRAPH_SIZE);

    this.camera = new THREE.PerspectiveCamera(10, 1, 0.1, 1000);
    this.camera.position.set(30, 60, 40);
    this.camera.up = new THREE.Vector3(0, 0, 1);
    this.camera.lookAt(0, 0, 0);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    var light = new THREE.DirectionalLight( 0xff0000 );
    light.position.set( 10, 10, 10 );
    this.scene.add(light);
    light = new THREE.DirectionalLight( 0x00ff00 );
    light.position.set( 10, -10, 10 );
    this.scene.add( light );
    light = new THREE.DirectionalLight( 0x0000ff );
    light.position.set( -10, -10, 10 );
    this.scene.add( light );
    light = new THREE.DirectionalLight( 0x555555 );
    light.position.set( 0, 0, -10 );
    this.scene.add( light );
    light = new THREE.AmbientLight( 0x222222 );
    this.scene.add( light );

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;

    this.surfaceGeometry = new SurfaceGeometry(function(x, y) {
        return (Math.pow(x, 2) - Math.pow(y, 2)) / 5;
    });

    this.scene.add(new THREE.Mesh(this.surfaceGeometry,
                                  new THREE.MeshLambertMaterial({color:0x999999,
                                                                 side: THREE.DoubleSide})));

    this.scene.add(new Axes3D({size: 6,
                               negSize: 6}));

    div.appendChild(this.renderer.domElement);
}

SimpleExample.App.prototype.animate = function() {
    let t = this;
    requestAnimationFrame(function() { t.animate(); });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
}

window.onload = function() {
    let app = new SimpleExample.App(document.getElementById("display-container"));
    app.animate();
}
