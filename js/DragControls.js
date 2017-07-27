/* Based on THREE.DragControls. 
 * Modified to detect if object is draggable or contrained to parent
 * Modifed to optionally include two camera, such as 
 * when having an orthographic camera for a screen overlay

 * @author zz85 / https://github.com/zz85
 * @author mrdoob / http://mrdoob.com
 * Running this will allow you to drag three.js objects around the screen.
 */



// keeps track of objects that can be dragged with the mouse
// or that can occlude other objects from being dragged with mouse

// objects is array of draggable objects or occluding objects
// if object.draggable=true, then object is draggable otherwise it occludes
// if object.constrain_to_parent=true, then object can only be moved to 
// points on its parent

// can have two cameras so that can include an orthographic overlay scene
// assumption is that the orthographic camera is pointing from z direction
// and that objects in orthographic overlay scene are in front of 
// regular perspective scene

/*
 * Parameters: can be null
 * camera2: second camera object for orthographic overlay scenes--doesn't have to be an orthographic camera though?
 * objects2: array of draggable objects for camera2
 * linePrecision
 * parentLinePrecision
 *
 *
 */


DragControls = function ( _objects, _camera, _domElement, _parameters ) {
    "use strict";
    
    var _plane = new THREE.Plane();
    var _raycaster = new THREE.Raycaster();
    var _raycaster2 = new THREE.Raycaster();

    var _mouse = new THREE.Vector2();
    var _offset = new THREE.Vector3();
    var _intersection = new THREE.Vector3();

    var _vector = new THREE.Vector3();
    
    var _selected = null, _hovered = null;
    var _potentialHighlight=null;

    var _raycasterUsed = null;
    var _cameraUsed = null;
    var _orthoCameraUsed = false;

    var _cameraIsOrtho = false

    if(_camera instanceof THREE.OrthographicCamera) {
	_cameraIsOrtho = true;
    }

    if ( _parameters === undefined ) _parameters = {};

    var _camera2 = _parameters.hasOwnProperty("camera2") ? 
	_parameters["camera2"] : null;
    var _camera2IsOrtho = false;
    if(_camera2) {
	if(_camera2 instanceof THREE.OrthographicCamera) {
	    _camera2IsOrtho = true;
	}
    }

    // _topCamera is camera used to check intersections first
    // default is to make topCamera be orthoGraphic camera, if exists,
    var _topCamera = _parameters.hasOwnProperty("topCamera") ? 
	_parameters["topCamera"] : null;
    if(_topCamera === null) {
	_topCamera = 1;
	if(_camera2IsOrtho && !_cameraIsOrtho) {
	    _topCamera = 2;
	}
    }
    
    var _linePrecision = _parameters.hasOwnProperty("linePrecision") ? 
	_parameters["linePrecision"] : null;
    var _parentLinePrecision = _parameters.hasOwnProperty("parentLinePrecision") ? 
	_parameters["parentLinePrecision"] : null;

    var _objects2 = _parameters.hasOwnProperty("objects2") ?
	_parameters["objects2"] : [];
    

    
    var scope = this;

    scope.parentInfo = null;
    

    function activate() {

	_domElement.addEventListener( 'mousemove', onContainerMouseMove, false );
	_domElement.addEventListener( 'mousedown', onContainerMouseDown, false );
	_domElement.addEventListener( 'mouseup', onContainerMouseUp, false );
	_domElement.addEventListener( 'mouseout', onContainerMouseOut, false);

    }

    function deactivate() {

	_domElement.removeEventListener( 'mousemove', onContainerMouseMove, false );
	_domElement.removeEventListener( 'mousedown', onContainerMouseDown, false );
	_domElement.removeEventListener( 'mouseup', onContainerMouseUp, false );
	_domElement.removeEventListener( 'mouseout', onContainerMouseOut, false);
	

    }

    function dispose() {

	deactivate();

    }

    function onContainerMouseMove( event ) {

	event.preventDefault();

	var rect = _domElement.getBoundingClientRect();
	var pos = cursorPositionInCanvas( _domElement, event );
	
	_mouse.x = pos[0] / $(_domElement).width() * 2 - 1;
	_mouse.y = -pos[1]/ $(_domElement).height() * 2 + 1;


	_raycaster.setFromCamera( _mouse, _camera );
	if(_linePrecision !== null) {
	    _raycaster.linePrecision = _linePrecision;
	}
    

	if(_camera2) {
	    _raycaster2.setFromCamera( _mouse, _camera2 );
	    if(_linePrecision !== null) {
		_raycaster2.linePrecision = _linePrecision;
	    }
	}
	
	if ( _selected && scope.enabled ) {
	    if(_selected.constrain_to_parent) {
		moveConstrainedObject();
	    }
	    else {
		moveUnconstrainedObject();
	    }

	    return	    

	}

	// if nothing selected then first try intersection with topCamera.
	// if second camera exists, use that next
	var intersects=null;
	if(_topCamera===2) {
	    intersects = _raycaster2.intersectObjects( _objects2 );
	    if(intersects.length > 0){
		_cameraUsed=_camera2;
	    }
	    else {
		intersects = _raycaster.intersectObjects( _objects );
		_cameraUsed=_camera;
	    }
	}
	else {
	    intersects = _raycaster.intersectObjects( _objects );
	    if(intersects.length > 0){
		_cameraUsed=_camera;
	    }
	    else if (raycaster2) {
		intersects = _raycaster2.intersectObjects( _objects2 );
		_cameraUsed=_camera2;
	    }
	}

	if(_cameraUsed === _camera2) {
	    _raycasterUsed = _raycaster2
	    _orthoCameraUsed = _camera2IsOrtho;
	}
	else {
	    _raycasterUsed = _raycaster
	    _orthoCameraUsed = _cameraIsOrtho;
	}


	var hover_object = null
	if ( intersects.length > 0 ) {
	    hover_object = intersects[ 0 ].object;
	    hover_object = setHover(hover_object);
	}
	if(!hover_object) {
	    unsetHover();
	}


    }

    function moveConstrainedObject () {

	// want imprecision for dragging objects along lines
	if(_parentLinePrecision !== null) {
	    _raycasterUsed.linePrecision=_parentLinePrecision;
	}
	else {
	    _raycasterUsed.linePrecision=10; 
	}

	if(_orthoCameraUsed) {
	    _vector.copy(_raycasterUsed.ray.origin).sub(_offset);
	    _raycasterUsed.set(_vector, _raycasterUsed.ray.direction);

	}
	else {

	    // To modify ray to go through the point where the center
	    // of SELECTED will be, intersect ray through drag plane,
	    // adjust by offset calculated on mouse down
	    // then modify ray to go through this offset point
	    _raycasterUsed.ray.intersectPlane( _plane, _intersection);
	    _vector.copy(_intersection).sub(_offset);
	    _vector.sub( _cameraUsed.position ).normalize()
	    _raycasterUsed.set( _cameraUsed.position, _vector);

	}
	// now intersect parent with this new ray
	var intersects=_raycasterUsed.intersectObject(_selected.parent);

	if (intersects.length > 0) {
	    // need to adjust from world coordinates
	    // to the coordinates local to the parent
	    // this adjusts for rotations and translations
	    // of parent and its parents
	    _selected.position.copy( _selected.parent.worldToLocal(intersects[ 0 ].point));
	    // record information about location of parent 
	    // on which SELECTED is now positioned
	    scope.parentInfo = intersects[0];
	    
	    scope.dispatchEvent( { type: 'drag', object: _selected } );
	    _selected.dispatchEvent( {type: 'moved'} );
	    
	}
	
	// if no intersection with parent, then don't move SELECTED
	// and leave parentInfo at previous state
    }

    
    function moveUnconstrainedObject () {
	
	// for unconstrained object using orthographic camera
	// position at mouse point
	// offset is vector from location at which grabbed object
	// to the central position of the object
	if(_orthoCameraUsed) {
	    _vector.set( _mouse.x, _mouse.y, 0.5 );
	    _vector.unproject(_cameraUsed);
	    _vector.sub(_offset);
	    // adjust for possible transformations of parent
	    if(_selected.parent) {
		_selected.parent.worldToLocal(_vector);
	    }
	    _vector.z = _selected.position.z;
	    _selected.position.copy(_vector);
	    
	}
	else {


	    // if selected is not constrained to parent
	    // move along the invisible this.plane
	    // offset is vector from central position of the object
	    // to location where original ray intersected drag plane
	    if ( _raycaster.ray.intersectPlane( _plane, _intersection ) ) {

		_selected.position.copy( _intersection.sub( _offset ) );

	    }
	    
	    // adjust for any transformations of parent
	    if(_selected.parent) {
		_selected.parent.worldToLocal(_selected.position);
	    }
	}

	scope.dispatchEvent( { type: 'drag', object: _selected } );
	_selected.dispatchEvent( {type: 'moved'} );
	
    }

    
    function setHover(object) {

	if(! (object.draggable || object.highlightOnHover ||
	      object.highlightOnClick) ) {
	    return null;
	}

	_vector.copy(object.position);
	if(object.parent) {
	    object.parent.localToWorld(_vector);
	}
	
	_plane.setFromNormalAndCoplanarPoint( _camera.getWorldDirection( _plane.normal ), _vector );

	if ( _hovered !== object ) {


	    // if previously had a different _hovered
	    // restore appearance of former _hovered
	    if ( _hovered && !_hovered.highlightOnClick) {
		highlightObject(_hovered, false);
	    }

	    // set _hovered to new object
	    _hovered = object;

	     if(_hovered.draggable || _hovered.highlightOnHover) {
		highlightObject(_hovered);
	     }

	    scope.dispatchEvent( { type: 'hoveron', object: object } );

	    if(_hovered.draggable || _hovered.highlightOnClick) {
		_domElement.style.cursor = 'pointer';
	    }
	    else {
		_domElement.style.cursor = 'auto';
	    }
	    
	}

    }
    function unsetHover() {
	
	// if previously had a INTERSECTED object
	// restore appearance of former INTERSECTED
	if ( _hovered !== null) {
	    if(!_hovered.highlightOnClick) {
		highlightObject(_hovered, false);
	    }
	    scope.dispatchEvent( { type: 'hoveroff', object: _hovered } );
	    
	    _domElement.style.cursor = 'auto';
	    _hovered = null;
	    
	}
	
    }



    function onContainerMouseDown( event ) {

	event.preventDefault();

	_raycaster.setFromCamera( _mouse, _camera );
	if(_linePrecision !== null) {
	    _raycaster.linePrecision = _linePrecision;
	}
    

	if(_camera2) {
	    _raycaster2.setFromCamera( _mouse, _camera2 );
	    if(_linePrecision !== null) {
		_raycaster2.linePrecision = _linePrecision;
	    }
	}

	var intersects=null;
	if(_topCamera===2) {
	    intersects = _raycaster2.intersectObjects( _objects2 );
	    if(intersects.length > 0){
		_cameraUsed=_camera2;
	    }
	    else {
		intersects = _raycaster.intersectObjects( _objects );
		_cameraUsed=_camera;
	    }
	}
	else {
	    intersects = _raycaster.intersectObjects( _objects );
	    if(intersects.length > 0){
		_cameraUsed=_camera;
	    }
	    else if (raycaster2) {
		intersects = _raycaster2.intersectObjects( _objects2 );
		_cameraUsed=_camera2;
	    }
	}

	if(_cameraUsed === _camera2) {
	    _raycasterUsed = _raycaster2
	    _orthoCameraUsed = _camera2IsOrtho;
	}
	else {
	    _raycasterUsed = _raycaster
	    _orthoCameraUsed = _cameraIsOrtho;
	}



	if ( intersects.length > 0 ) {

	    // if have draggable object, then select the object
	    // and mark offsets for new positions after mouse move
	    if(intersects[0].object.draggable) {

		
		_selected = intersects[ 0 ].object;

		if(_orthoCameraUsed) {
		    // for orthographic camera, offset is vector from
		    // actual position of object to intersection point
		    _offset.copy(intersects[0].point);
		    _vector.copy(_selected.position);

		    // adjust for any transformations of parent
		    if(_selected.parent) {
			_selected.parent.localToWorld(_vector);
		    }
		    _offset.sub(_vector);

		    // for orthographic camera, ignore z direction
		    _offset.z=0;

		}

		else {

		    // Record offset as difference between point where
		    // ray intersects 
		    // the drag plane and the actual position of object.
		    // Offset is used to adjust position of objects 
		    // so that have same position relative to mouse pointer.
		    // Particularly important for spatially extended objects.
		    
		    if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
			
			_offset.copy( _intersection );
			_vector.copy(_selected.position);
			// adjust for any transformations of parent
			if(_selected.parent) {
			    _selected.parent.localToWorld(_vector);
			}
			_offset.sub(_vector);
		    }
		}
		_domElement.style.cursor = 'move';

		scope.dispatchEvent( { type: 'dragstart', object: _selected } );
	    }

	    // if highlight on click, then mark as an object 
	    // to potentially highlight if still intersect object
	    // on mouse up
	    else if (intersects[0].object.highlightOnClick) {
		_potentialHighlight = intersects[0].object;
	    }
	    
	}
    }

    function onContainerMouseUp( event ) {

	event.preventDefault();

	if ( _selected ) {

	    scope.dispatchEvent( { type: 'dragend', object: _selected } );
	    _selected.dispatchEvent({type: 'moveFinished'});

	    _selected = null;
	    scope.parentInfo = null

	}

	if ( _hovered ) {
	    if(_hovered.draggable  || _hovered.highlightOnClick) {
		_domElement.style.cursor = 'pointer';
	    }
	    else {
		_domElement.style.cursor = 'auto';
	    }

	    if( _potentialHighlight === _hovered) {
		toggleHighlightObject(_potentialHighlight);
	    }
	    _potentialHighlight = null;
	    
	}
	else {
	    _domElement.style.cursor = 'auto';
	}
    }

    function onContainerMouseOut( event ) {

	event.preventDefault();
	
	// If have selected element and leave container
	// add listener to stop moving selected if have 
	// mouse up outsider container
	if(_selected) {
	    document.addEventListener( 'mouseup', outsideContainerMouseUp, false );
 
	    // add listener to remove extra mouse up listener
	    // upon returning to container
	    _domElement.addEventListener( 'mouseover', returnContainer, false);
	
	}
	
    }


    function outsideContainerMouseUp( event ) {
	event.preventDefault();

	// if have mouse up outside container
	// deselected selected object
	if(_selected) {
	    scope.dispatchEvent( { type: 'dragend', object: _selected } );
	    _selected.dispatchEvent({type: 'moveFinished'});
	}
	_selected = null;
	scope.parentInfo = null;
	
	_domElement.style.cursor = 'auto';
	
	// remove extra listeners
	document.removeEventListener( 'mouseup', outsideContainerMouseUp, false );
	_domElement.removeEventListener( 'mouseover', returnContainer, false);
	
    }
    
    function returnContainer( event ) {
	
	// if return to container without a mouse up
	// remove extra listeners
	document.removeEventListener( 'mouseup', outsideContainerMouseUp, false );
	_domElement.removeEventListener( 'mouseover', returnContainer, false);

    }


    
    function toggleHighlightObject(object) {
	if(object.highlighted) {
	    highlightObject(object,false);
	}
	else {
	    highlightObject(object);
	}
    }

    // highlight object, or turn off highlight if activate is false
    function highlightObject(object, activate) {
	
	if(activate || activate===undefined) {

	    // if object has a highlight function, 
	    // call that to turn on hightighting
	    if (object.highlight) {
		object.highlight();
	    }
	    // else change color of object or object it represents
	    else {
		// save color of object or object it represents
		if(object.represents) {
		    object.currentHex = object.represents.material.color.getHex();
		}
		else {
		    object.currentHex = object.material.color.getHex();
		}

		// reduce each color by 1.5 to show intersected
		var oldHex = object.currentHex;
		var newHex = Math.ceil((oldHex % 256)/1.5);
		oldHex -= oldHex % 256;
		newHex += Math.ceil((oldHex % (256*256))/(1.5*256))*256;
		oldHex -= oldHex % (256*256);
		newHex += Math.ceil((oldHex % (256*256*256))/(1.5*256*256))*256*256;
		// change color of object or object it represents
		if(object.represents) {
		    object.represents.material.color.setHex(newHex);
		}
		else {
		    object.material.color.setHex(newHex);
		}
	    }	    
	    // mark object as highlighted
	    object.highlighted=true;
	}
	// turn off highlighting is activate is false
	else {
	    // if object has a highlight function, 
	    // call that to turn off highlighting
	    if(object.highlight) {
		object.highlight(false);
	    }
	    // else if object represents another object
	    // restore color to that object
	    else if(object.represents) {
		object.represents.material.color.setHex( object.currentHex );
	    }
	    // else restore color to object
	    else {
		object.material.color.setHex( object.currentHex );
	    }

	    // mark object as not highlighted
	    object.highlighted=false;
	}
    }


    
    // Called on event when mouse moves over canvas
    //  --returns absolute world coordinates of the mouse?
    function cursorPositionInCanvas(canvas, event) {
	var x, y;
	
	var canoffset = $(canvas).offset();
	x = event.clientX + $(document).scrollLeft()
	    - Math.floor(canoffset.left);
	y = event.clientY + $(document).scrollTop()
	    - Math.floor(canoffset.top) + 1;
    
	return [x,y];
    }



    activate();

    // API

    this.enabled = true;

    this.activate = activate;
    this.deactivate = deactivate;
    this.dispose = dispose;


};

DragControls.prototype = Object.create( THREE.EventDispatcher.prototype );
DragControls.prototype.constructor = DragControls;
