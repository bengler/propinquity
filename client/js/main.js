// Canvas enabled THREE
var THREE = require("three-canvas-renderer");

var TrackballControls = require('./three-trackballcontrols');

var Fisheye = require('./Fisheye')
var detector = require('./Detector')

var container, stats;

var camera, scene, renderer;

var raycaster, mouse;

var controls;

var mesh, singleGeometry;

var pos;

var currentIntersectFace = -1;

var fisheye = Fisheye.circular().radius(200).distortion(5);

var tileSize = 20; // initial size of works

var mouse_down_init_position;

var numberWorks = 0;

var numTextures, textureLoader;

var autoPanVec = -1;

var firstRender = true;

var unit_coords = [
  new THREE.Vector2(0,1.),
  new THREE.Vector2(0,0),
  new THREE.Vector2(1.,0),
  new THREE.Vector2(1.,1.),
];

var hiResTexture;

var isTouch = true;
var touchMove = false;

THREE.ImageUtils.crossOrigin = '';

function init() {

  container = document.getElementById( 'container' );

  //

  camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 1, 3500 );
  camera.position.z = 2000;

  scene = new THREE.Scene();

  //

  for (var i = 0;i < mosaics.length;i++) {
    numberWorks += mosaics[i]["tiles"];
  }

  // create geometry and merge into one geometry
  singleGeometry = new THREE.Geometry();
  for (var i = 0;i < numberWorks;i++) {
    var area = collection[i]['image_width']*collection[i]['image_height'];
    var scaling = tileSize / Math.sqrt(area);
    collection[i]['draw_width'] = Math.round(collection[i]['image_width']*scaling);
    collection[i]['draw_height'] = Math.round(collection[i]['image_height']*scaling);

    var plane = new THREE.PlaneGeometry( collection[i]['draw_width'], collection[i]['draw_height'] );
    var planeMesh = new THREE.Mesh(plane);
    planeMesh.position.x = 3*collection[i]['embedding_x'];
    planeMesh.position.y = 3*collection[i]['embedding_y'];
    planeMesh.updateMatrix();
    singleGeometry.merge(planeMesh.geometry, planeMesh.matrix);
  }

  var loadGeometry = function() {
    var materials = [];
    var totalVertices = 0;
    for (var i = 0;i < numTextures;i++) {
      // set up mapping from textures to geometry
      var mw = mosaics[i].mosaicWidth;
      var mh = mosaics[i].mosaicHeight;
      for (var j = 0;j < mosaics[i].tiles;j++) {
        var left = (j % mw)/mw;
        var upper = Math.floor(j / mw)/mh;
        var right = left + 1/mw;
        var lower = upper + 1/mh;
        var coords = [
          new THREE.Vector2(left,1-upper),
          new THREE.Vector2(left,1-lower),
          new THREE.Vector2(right,1-lower),
          new THREE.Vector2(right,1-upper),
        ];
        singleGeometry.faceVertexUvs[0][totalVertices*2] = [ coords[0], coords[1], coords[3] ];
        singleGeometry.faceVertexUvs[0][(totalVertices*2) + 1] = [ coords[1], coords[2], coords[3] ];
        singleGeometry.faces[totalVertices * 2].materialIndex = i;
        singleGeometry.faces[(totalVertices*2) + 1].materialIndex = i;
        totalVertices += 1;
      }

      materials[i] = new THREE.MeshBasicMaterial({ map : textures[i], overdraw : true });
    }
    materials[numTextures] = new THREE.MeshBasicMaterial({ overdraw : true });
    var multimaterial = new THREE.MultiMaterial(materials);

    mesh = new THREE.Mesh(singleGeometry, multimaterial);
    scene.add(mesh);

    animate();
  }

  var texturesLoaded = 0;
  numTextures = mosaics.length;
  var textures = [];
  textureLoader = new THREE.TextureLoader()
  singleGeometry.faceVertexUvs[0] = [];
  for (var i = 0;i < numTextures;i++) {
    var texture = textureLoader.load(
      "data/"+mosaics[i].image,
      function(texture) {
        texture.flipY = true;
        texturesLoaded += 1;
        if (texturesLoaded == numTextures) loadGeometry();
      }
    )
    textures[i] = texture;
  }

  //

  raycaster = new THREE.Raycaster();

  mouse = new THREE.Vector2();

  //
  if ( Detector.webgl ) {
    renderer = new THREE.WebGLRenderer( { antialias: false, alpha : true, logarithmicDepthBuffer: true  } );
  } else {
    renderer = new THREE.CanvasRenderer( { antialias: false, alpha : true } );
  }
  renderer.setClearColor( 0x333333 );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  controls = new TrackballControls( camera, renderer.domElement );
  controls.minDistance = 100;
  controls.maxDistance = 3000;
  controls.noRotate = true;
  controls.noMouseZoom = true;
  controls.panSpeed = 0.5;
  controls.staticMoving = true;
  controls.enabled = false;

  //

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );

  //

  window.addEventListener( 'resize', onWindowResize, false );
}

function onWebGLMouseDown( event ) {
  var x = ( event.clientX / window.innerWidth ) * 2 - 1;
  var y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  mouse_down_init_position = [mouse.x, mouse.y];
}

function onWebGLMouseUp( event ) {
  var x = ( event.clientX / window.innerWidth ) * 2 - 1;
  var y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  var old_x = mouse_down_init_position[0];
  var old_y = mouse_down_init_position[1];
  var distance = Math.sqrt((x-old_x)*(x-old_x) + (y-old_y)*(y-old_y));
  if (currentIntersectFace >= 0 && distance < 0.01) {
    var work_url = "http://samling.nasjonalmuseet.no/no/object/"+collection[currentIntersectFace].identifier
    window.open(work_url, '_blank');
  }
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function onMouseOut( event ) {
  autoPanVec = -1;
}

function onDocumentMouseMove( event ) {
  event.preventDefault();
  isTouch = false;

  // Don't update when panning
  if (controls.ismousedown) return;


  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  autoPan(mouse)

  // Autopan forces fisheye update every frame anyway
  if (autoPanVec != -1) return;

  recalculateFishEye(mouse)
}

function recalculateFishEye(mouse) {

  var vector = new THREE.Vector3();
  vector.set(mouse.x, mouse.y, 1)
  vector.unproject( camera );

  var dir = vector.sub( camera.position ).normalize();

  var distance = - camera.position.z / dir.z;

  pos = camera.position.clone().add( dir.multiplyScalar( distance ) );

  fisheye.focus([pos.x,pos.y]);

  for (var i = 0;i < singleGeometry.vertices.length;i+=4) {
    var cur_coords = [collection[i/4]['embedding_x'],collection[i/4]['embedding_y']];
    var fisheye_trans = fisheye({x: 3*cur_coords[0], y: 3*cur_coords[1]});

    var x_size = collection[i/4]['draw_width']/2
    var y_size = collection[i/4]['draw_height']/2

    let z_scaler = 20;

    singleGeometry.vertices[i].x = fisheye_trans.x-x_size-((fisheye_trans.z-1)*0.7*x_size);
    singleGeometry.vertices[i].y = fisheye_trans.y+y_size+((fisheye_trans.z-1)*0.7*y_size);
    singleGeometry.vertices[i].z = fisheye_trans.z*z_scaler;
    singleGeometry.vertices[i+1].x = fisheye_trans.x+x_size+((fisheye_trans.z-1)*0.7*x_size);
    singleGeometry.vertices[i+1].y = fisheye_trans.y+y_size+((fisheye_trans.z-1)*0.7*y_size);
    singleGeometry.vertices[i+1].z = fisheye_trans.z*z_scaler;
    singleGeometry.vertices[i+2].x = fisheye_trans.x-x_size-((fisheye_trans.z-1)*0.7*x_size);
    singleGeometry.vertices[i+2].y = fisheye_trans.y-y_size-((fisheye_trans.z-1)*0.7*y_size);
    singleGeometry.vertices[i+2].z = fisheye_trans.z*z_scaler;
    singleGeometry.vertices[i+3].x = fisheye_trans.x+x_size+((fisheye_trans.z-1)*0.7*x_size);
    singleGeometry.vertices[i+3].y = fisheye_trans.y-y_size-((fisheye_trans.z-1)*0.7*y_size);
    singleGeometry.vertices[i+3].z = fisheye_trans.z*z_scaler;
  }
  singleGeometry.verticesNeedUpdate = true;
}


function autoPan(mouse) {

  var mouseVec = new THREE.Vector3(mouse.x, mouse.y, 0)
  if (mouseVec.length() > 0.5 && mouseVec.length() < 1.2) {
    autoPanVec = mouseVec
  } else {
    autoPanVec = -1
  }
}

function onTouchStart( event ) {
  isTouch = true;
}

function onTouchMove( event ) {
  touchMove = true;
}

function onTouchEnd( event ) {
  event.preventDefault();

  mouse.x = ( event.changedTouches[ 0 ].pageX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.changedTouches[ 0 ].pageY / window.innerHeight ) * 2 + 1;

  var previousFace = currentIntersectFace;
  if (!touchMove) {
    updateTileInfo();
    if (currentIntersectFace >= 0) {
      var work_url = "http://samling.nasjonalmuseet.no/no/object/"+collection[currentIntersectFace].identifier
      if (currentIntersectFace == previousFace) {
        window.open(work_url, '_blank');
      }
      var metadata = collection[currentIntersectFace];
      $("#imageinfo").html("<p><strong>"+metadata.artist+", <a href='"+work_url+
        "' target='_blank'><em>"+metadata.title+"</em></a></strong>. "+metadata.yearstring+".</p>")
    }
  }
  touchMove = false;
}

function onLinkTouchEnd( event ) {
  event.preventDefault();
  event.stopPropagation();
  if (currentIntersectFace >= 0) {
    var work_url = "http://samling.nasjonalmuseet.no/no/object/"+collection[currentIntersectFace].identifier
    window.open(work_url, '_blank');
  }
}


function animate() {

  if (autoPanVec != -1) {
    camera.position.addVectors(camera.position, autoPanVec)
    controls.target.addVectors(controls.target, autoPanVec)
    var mouse = {
      x: autoPanVec.x,
      y: autoPanVec.y
    }
    recalculateFishEye(mouse)
  }

  requestAnimationFrame( animate );
  controls.update();

  render();

  stats.update();

}

function updateTileInfo() {

  // check if pointer interacts with tile

  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObject( mesh );

  // updates on entering/leaving tiles

  if ( intersects.length > 0 ) {
    if ( intersects.length > 1 && ( Math.floor(intersects[0].face.a/4) != currentIntersectFace ) ) {
      // always select the one with highest index
      var face_index = 0;
      for (var i = 0;i < intersects.length;i++) {
        var intersect_face_index = Math.floor(intersects[i].face.a/4);
        if (intersect_face_index > face_index) {
          face_index = intersect_face_index;
        }
      }
    } else {
      var face_index = Math.floor(intersects[0].face.a/4);
    }
    if (currentIntersectFace == -1) {
      // entering tile
      // for (var i = 0;i < 4;i++) singleGeometry.vertices[(face_index*4)+i].z = 1.0;
      var metadata = collection[face_index];
      $("#imageinfo").html("<p><strong>"+metadata.artist+", <em>"+metadata.title+"</em></strong>. "+metadata.yearstring+".</p>")
      $("#imageinfo").show();
      $("#container").addClass("clickable");
      currentIntersectFace = face_index;
      // set timeout to avoid queuing lots of images on panning
      setTimeout(function() {if (currentIntersectFace == face_index) getHighResImage(face_index);}, 100);
      singleGeometry.verticesNeedUpdate = true;
    } else if (face_index != currentIntersectFace) {
      // entering tile, leaving previous tile
      // for (var i = 0;i < 4;i++) singleGeometry.vertices[(currentIntersectFace*4)+i].z = 0.0;
      // for (var i = 0;i < 4;i++) singleGeometry.vertices[(face_index*4)+i].z = 1.0;
      var metadata = collection[face_index];
      $("#imageinfo").html("<p><strong>"+metadata.artist+", <em>"+metadata.title+"</em></strong>. "+metadata.yearstring+".</p>")
      removeHighResImage(currentIntersectFace);
      currentIntersectFace = face_index;
      // set timeout to avoid queuing lots of images on panning
      setTimeout(function() {if (currentIntersectFace == face_index) getHighResImage(face_index);}, 100);
      singleGeometry.verticesNeedUpdate = true;
    }
  } else if (currentIntersectFace != -1) {
    // leaving tile
    for (var i = 0;i < 4;i++) singleGeometry.vertices[(currentIntersectFace*4)+i].z = 0.0;
    removeHighResImage(currentIntersectFace);
    currentIntersectFace = -1;
    $("#imageinfo").hide();
    $("#container").removeClass("clickable");
    singleGeometry.verticesNeedUpdate = true;
  }
}

function render() {

  if (!isTouch) {
    updateTileInfo();
  }

  renderer.render( scene, camera );

  if (firstRender) {
    $("#message").hide();
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousewheel', onMouseWheel, false);
    document.addEventListener( 'DOMMouseScroll', onMouseWheel, false); // for firefox
    document.addEventListener( 'touchstart', onTouchStart, false);
    document.addEventListener( 'touchmove', onTouchMove, false);
    document.addEventListener( 'touchcancel', onTouchEnd, false);
    document.addEventListener( 'touchend', onTouchEnd, false);
    document.addEventListener( 'mouseout', onMouseOut, false);
    renderer.domElement.addEventListener( 'mousedown', onWebGLMouseDown, false);
    renderer.domElement.addEventListener( 'mouseup', onWebGLMouseUp, false);
    $('#imageinfo')[0].addEventListener( 'touchend', onLinkTouchEnd, false);
    $('#ui_zoom_in').click(onUIZoomIn)
    $('#ui_zoom_out').click(onUIZoomOut)
    $('#ui_zoom_in').bind('touchend', onUIZoomIn);
    $('#ui_zoom_out').bind('touchend', onUIZoomOut);
    controls.enabled = true;

    firstRender = false;
  }

}


function getHighResImage(index) {
  var index_str = "" + collection[index]['sequence_id'];
  var image_filename = "0000".substring(0, 4 - index_str.length) + index_str;
  hiResTexture = textureLoader.load(
    'https://mm.dimu.org/image/'+collection[index]['image_id']+'?dimension=400x400',
    //'/data/painting/images/'+image_filename+".jpg",
    function (texture) {
      if (currentIntersectFace == index) {
        // update texture
        mesh.material.materials[numTextures].map = texture;
        mesh.material.materials[numTextures].needsUpdate = true;
        mesh.material.needsUpdate = true;

        // map each painting to geometry and position
        mesh.geometry.faceVertexUvs[0][index*2][0].x = 0;
        mesh.geometry.faceVertexUvs[0][index*2][0].y = 1.;
        mesh.geometry.faceVertexUvs[0][index*2][1].x = 0;
        mesh.geometry.faceVertexUvs[0][index*2][1].y = 0;
        mesh.geometry.faceVertexUvs[0][(index*2)+1][1].x = 1.;
        mesh.geometry.faceVertexUvs[0][(index*2)+1][1].y = 0;
        mesh.geometry.faceVertexUvs[0][(index*2)+1][2].x = 1.;
        mesh.geometry.faceVertexUvs[0][(index*2)+1][2].y = 1.;
        mesh.geometry.uvsNeedUpdate = true;

        mesh.geometry.faces[index * 2].materialIndex = numTextures;
        mesh.geometry.faces[(index*2) + 1].materialIndex = numTextures;
        mesh.geometry.groupsNeedUpdate = true;
      }
    }
  );
}

function removeHighResImage(index) {
  highResImageIndex = -1;
  var mosaicIndex = Math.floor(index / mosaics[0].tiles);
  var i = index % mosaics[0].tiles;
  var mw = mosaics[mosaicIndex].mosaicWidth;
  var mh = mosaics[mosaicIndex].mosaicHeight;

  var left = (i % mw)/mw;
  var upper = Math.floor(i / mw)/mh;
  var right = left + 1/mw;
  var lower = upper + 1/mh;

  mesh.geometry.faces[index * 2].materialIndex = mosaicIndex;
  mesh.geometry.faces[(index*2) + 1].materialIndex = mosaicIndex;
  mesh.geometry.groupsNeedUpdate = true;

  mesh.geometry.faceVertexUvs[0][index*2][0].x = left;
  mesh.geometry.faceVertexUvs[0][index*2][0].y = 1-upper;
  mesh.geometry.faceVertexUvs[0][index*2][1].x = left;
  mesh.geometry.faceVertexUvs[0][index*2][1].y = 1-lower;
  mesh.geometry.faceVertexUvs[0][(index*2)+1][1].x = right;
  mesh.geometry.faceVertexUvs[0][(index*2)+1][1].y = 1-lower;
  mesh.geometry.faceVertexUvs[0][(index*2)+1][2].x = right;
  mesh.geometry.faceVertexUvs[0][(index*2)+1][2].y = 1-upper;
  mesh.geometry.uvsNeedUpdate = true;


  if (hiResTexture) {
    hiResTexture.dispose();
  }
}

function onMouseWheel(event) {
  var factor = 0.1;

  var mX = ( event.clientX / window.innerWidth ) * 2 - 1;
  var mY = - ( event.clientY / window.innerHeight ) * 2 + 1;
  var vector = new THREE.Vector3(mX, mY, 1 );

  vector.unproject(camera); // gives us the true coordinates of the point
  vector.sub(camera.position);
  var move = vector.setLength(camera.position.length()*factor);
  if (event.deltaY < 0 || event.detail < 0) {
    if ((move.z + camera.position.z) >= controls.minDistance) {
      camera.position.addVectors(camera.position, move);
      move.z = 0;
      controls.target.addVectors(controls.target, move);
    }
  } else {
    if ((camera.position.z - move.z) <= controls.maxDistance) {
      camera.position.subVectors(camera.position, move);
      move.z = 0;
      controls.target.subVectors(controls.target, move);
    }
  }

}

function onUIZoomIn(event) {
  event.preventDefault();
  event.stopPropagation();
  controls.zoomIn();
}

function onUIZoomOut(event) {
  event.preventDefault();
  event.stopPropagation();
  controls.zoomOut();
}

init();
