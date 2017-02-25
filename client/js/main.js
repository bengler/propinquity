// Canvas enabled THREE
var THREE = require("three-canvas-renderer");
var TWEEN = require("tween.js")

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

var autoZoomed = false;

var hiResTexture;

var isTouch = true;
var touchMove = false;

THREE.ImageUtils.crossOrigin = '';

var z_scaler = 20;

var fisheyeFactor = 1;

var collectionWidth, collectionHeight;

function init() {

  container = document.getElementById( 'container' );

  // 

  for (var i = 0;i < mosaics.length;i++) {
    numberWorks += mosaics[i]["tiles"];
  }

  var minX = minY = Infinity;
  var maxX = maxY = -Infinity;
  for (var i = 0;i < numberWorks;i++) {
    if (collection[i]['embedding_x'] > maxX) maxX = collection[i]['embedding_x'];
    if (collection[i]['embedding_x'] < minX) minX = collection[i]['embedding_x'];
    if (collection[i]['embedding_y'] > maxY) maxY = collection[i]['embedding_y'];
    if (collection[i]['embedding_y'] < minY) minY = collection[i]['embedding_y'];
  }
  collectionWidth = 3*(maxX-minX);
  collectionHeight = 3*(maxY-minY);

  // calculate needed fov to fit all works in view
  var fov = calcNeededFov(collectionWidth, collectionHeight);

  //

  camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 3500 );
  camera.position.z = 2000;

  scene = new THREE.Scene();

  //

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
    planeMesh.position.z = z_scaler;
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
    singleGeometry = new THREE.BufferGeometry().fromGeometry(singleGeometry);

    mesh = new THREE.Mesh(singleGeometry, multimaterial);
    scene.add(mesh);

    animate();
  }

  var texturesLoaded = 0;
  numTextures = mosaics.length;
  var textures = [];
  textureLoader = new THREE.TextureLoader()
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
  controls.minDistance = 225;
  controls.maxDistance = 2200;
  controls.noRotate = true;
  controls.noMouseZoom = true;
  controls.panSpeed = 0.5;
  controls.staticMoving = true;
  controls.enabled = false;
  controls.maxPanX = collectionWidth/2;
  controls.maxPanY = collectionHeight/2;

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
  autoZoomed = false;

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

  camera.fov = calcNeededFov(collectionWidth, collectionHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

  controls.handleResize();

}

function onMouseOut( event ) {
  autoPanVec = -1;
}

function onDocumentMouseMove( event ) {
  event.preventDefault();
  if (autoZoomed) return;

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

function recalculateFishEye(coords, unproject) {
  if (unproject === undefined) unproject = true;
  if (unproject) {
    var vector = new THREE.Vector3();
    vector.set(coords.x, coords.y, 1)
    vector.unproject( camera );

    var dir = vector.sub( camera.position ).normalize();

    var distance = - camera.position.z / dir.z;

    coords = camera.position.clone().add( dir.multiplyScalar( distance ) );
  }

  fisheye.focus([coords.x,coords.y]);
  
  for (var i = 0;i < collection.length;i++) {
    var x_coords = 3*collection[i]['embedding_x'];
    var y_coords = 3*collection[i]['embedding_y'];
    var fisheye_trans = fisheye({x: x_coords, y: y_coords}, fisheyeFactor);

    var x_size = collection[i]['draw_width']/2
    var y_size = collection[i]['draw_height']/2

    var x_offset = x_size+((fisheye_trans.z-1)*0.7*x_size);
    var y_offset = y_size+((fisheye_trans.z-1)*0.7*y_size);
    var x_pos = fisheye_trans.x;
    var y_pos = fisheye_trans.y;
    var z_pos = fisheye_trans.z*z_scaler;
    singleGeometry.attributes.position.setXYZ((i*6)  , x_pos-x_offset, y_pos+y_offset, z_pos);
    singleGeometry.attributes.position.setXYZ((i*6)+1, x_pos-x_offset, y_pos-y_offset, z_pos);
    singleGeometry.attributes.position.setXYZ((i*6)+2, x_pos+x_offset, y_pos+y_offset, z_pos);
    singleGeometry.attributes.position.setXYZ((i*6)+3, x_pos-x_offset, y_pos-y_offset, z_pos);
    singleGeometry.attributes.position.setXYZ((i*6)+4, x_pos+x_offset, y_pos-y_offset, z_pos);
    singleGeometry.attributes.position.setXYZ((i*6)+5, x_pos+x_offset, y_pos+y_offset, z_pos);
  }
  singleGeometry.attributes.position.needsUpdate = true;
}


function autoPan(mouse) {

  var mouseVec = new THREE.Vector3(mouse.x, mouse.y, 0)
  if (mouseVec.length() > 0.5 && mouseVec.length() < 2) {
    autoPanVec = mouseVec
  } else {
    autoPanVec = -1
  }
}

function onTouchStart( event ) {
  isTouch = true;
  controls.minDistance = 55;
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
      if (currentIntersectFace == previousFace && !autoZoomed) {
        window.open(work_url, '_blank');
      }
      var metadata = collection[currentIntersectFace];
      document.getElementById("imageinfo").innerHTML = "<p><strong>"+metadata.artist+", <a href='"+work_url+
        "' target='_blank'><em>"+metadata.title+"</em></a></strong>. "+metadata.yearstring+".</p>";
    }
  }
  autoZoomed = false;
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

  if (autoPanVec != -1 && !controls.ismousedown) {
    var temp = autoPanVec.clone();
    var new_x = controls.target.x + autoPanVec.x;
    var new_y = controls.target.y + autoPanVec.y;
    if (autoPanVec.x < 0 && new_x < -collectionWidth/2) temp.x = 0;
    if (autoPanVec.x > 0 && new_x > collectionWidth/2) temp.x = 0;
    if (autoPanVec.y < 0 && new_y < -collectionHeight/2) temp.y = 0;
    if (autoPanVec.y > 0 && new_y > collectionHeight/2) temp.y = 0;
    camera.position.addVectors(camera.position, temp);
    controls.target.addVectors(controls.target, temp);
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
  TWEEN.update();

}

function updateTileInfo() {

  // check if pointer interacts with tile

  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObject( mesh );

  // updates on entering/leaving tiles

  if ( intersects.length > 0 ) {
    if ( isTouch && intersects.length > 1 && ( Math.floor(intersects[0].face.a/6) != currentIntersectFace ) ) {
      // always select the one with highest index
      var face_index = 0;
      for (var i = 0;i < intersects.length;i++) {
        var intersect_face_index = Math.floor(intersects[i].face.a/6);
        if (intersect_face_index > face_index) {
          face_index = intersect_face_index;
        }
      }
    } else {
      var face_index = Math.floor(intersects[0].face.a/6);
    }
    if (currentIntersectFace == -1) {
      // entering tile
      // for (var i = 0;i < 4;i++) singleGeometry.vertices[(face_index*4)+i].z = 1.0;
      var metadata = collection[face_index];
      document.getElementById("imageinfo").innerHTML = "<p><strong>"+metadata.artist+", <em>"+metadata.title+"</em></strong>. "+metadata.yearstring+".</p>";
      document.getElementById("imageinfo").style.display = "block";
      document.getElementById("container").setAttribute("class","clickable");
      currentIntersectFace = face_index;
      // set timeout to avoid queuing lots of images on panning
      setTimeout(function() {if (currentIntersectFace == face_index) getHighResImage(face_index);}, 100);
      //singleGeometry.verticesNeedUpdate = true;
    } else if (face_index != currentIntersectFace) {
      // entering tile, leaving previous tile
      // for (var i = 0;i < 4;i++) singleGeometry.vertices[(currentIntersectFace*4)+i].z = 0.0;
      // for (var i = 0;i < 4;i++) singleGeometry.vertices[(face_index*4)+i].z = 1.0;
      var metadata = collection[face_index];
      document.getElementById("imageinfo").innerHTML = "<p><strong>"+metadata.artist+", <em>"+metadata.title+"</em></strong>. "+metadata.yearstring+".</p>";
      removeHighResImage(currentIntersectFace);
      currentIntersectFace = face_index;
      // set timeout to avoid queuing lots of images on panning
      setTimeout(function() {if (currentIntersectFace == face_index) getHighResImage(face_index);}, 100);
      //singleGeometry.verticesNeedUpdate = true;
    }
  } else if (currentIntersectFace != -1) {
    // leaving tile
    //for (var i = 0;i < 4;i++) singleGeometry.vertices[(currentIntersectFace*4)+i].z = 0.0;
    removeHighResImage(currentIntersectFace);
    currentIntersectFace = -1;
    document.getElementById("imageinfo").style.display = "none";
    document.getElementById("container").setAttribute("class","");
    //singleGeometry.verticesNeedUpdate = true;
  }
}

function render() {

  if (!isTouch || autoZoomed) {
    updateTileInfo();
  }

  renderer.render( scene, camera );

  if (firstRender) {
    document.getElementById("message").style.display = "none";
    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousewheel', onMouseWheel, false);
    document.addEventListener( 'DOMMouseScroll', onMouseWheel, false); // for firefox
    document.addEventListener( 'touchstart', onTouchStart, false);
    renderer.domElement.addEventListener( 'touchmove', onTouchMove, false);
    document.addEventListener( 'touchcancel', onTouchEnd, false);
    document.addEventListener( 'touchend', onTouchEnd, false);
    document.addEventListener( 'mouseout', onMouseOut, false);
    renderer.domElement.addEventListener( 'mousedown', onWebGLMouseDown, false);
    renderer.domElement.addEventListener( 'mouseup', onWebGLMouseUp, false);
    document.getElementById("imageinfo").addEventListener( 'touchend', onLinkTouchEnd, false);
    document.getElementById("ui_zoom_in").addEventListener("click", onUIZoomIn, false);
    document.getElementById("ui_zoom_in").addEventListener("touchend", onUIZoomIn, false);
    document.getElementById("ui_zoom_out").addEventListener("click", onUIZoomOut, false);
    document.getElementById("ui_zoom_out").addEventListener("touchend", onUIZoomOut, false);
    document.getElementById("ui_reset").addEventListener("click", onUIReset, false);
    document.getElementById("ui_reset").addEventListener("touchend", onUIReset, false);
    controls.enabled = true;

    // zoom towards specific work if specified in url
    if (queryStrings['id'] !== undefined) {
      var workCoords = lookupCoordinates(queryStrings['id']);
      if (workCoords !== undefined) {
        autoZoom(workCoords);
        // lock focus until user clicks/touches
        autoZoomed = true;
      }
    }

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
        mesh.geometry.attributes.uv.setXY((index*6)  , 0., 1.);
        mesh.geometry.attributes.uv.setXY((index*6)+1, 0., 0.);
        mesh.geometry.attributes.uv.setXY((index*6)+2, 1., 1.);
        mesh.geometry.attributes.uv.setXY((index*6)+3, 0., 0.);
        mesh.geometry.attributes.uv.setXY((index*6)+4, 1., 0.);
        mesh.geometry.attributes.uv.setXY((index*6)+5, 1., 1.);
        mesh.geometry.attributes.uv.needsUpdate = true;

        var mosaicIndex = Math.floor(index / mosaics[0].tiles);
        mesh.geometry.clearGroups();
        var mosaicStart = 0;
        for (var i = 0;i < numTextures;i++) {
          if (i == mosaicIndex) {
            var splitLength = index-mosaicStart;
            mesh.geometry.addGroup(mosaicStart*6, splitLength*6, i);
            mesh.geometry.addGroup(index*6, 1*6, numTextures);
            mesh.geometry.addGroup((mosaicStart+splitLength+1)*6, (mosaics[i].tiles-splitLength-1)*6, i);
          } else {
            mesh.geometry.addGroup(mosaicStart*6, mosaics[i].tiles*6, i);
          }
          mosaicStart += mosaics[i].tiles;
        }
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

  mesh.geometry.clearGroups();
  var mosaicStart = 0
  for (var i = 0;i < mosaics.length;i++) {
    mesh.geometry.addGroup(mosaicStart*6, mosaics[i].tiles*6, i);
    mosaicStart += mosaics[i].tiles;
  }
  mesh.geometry.groupsNeedUpdate = true;

  mesh.geometry.attributes.uv.setXY((index*6)  , left, 1-upper);
  mesh.geometry.attributes.uv.setXY((index*6)+1, left, 1-lower);
  mesh.geometry.attributes.uv.setXY((index*6)+2, right, 1-upper);
  mesh.geometry.attributes.uv.setXY((index*6)+3, left, 1-lower);
  mesh.geometry.attributes.uv.setXY((index*6)+4, right, 1-lower);
  mesh.geometry.attributes.uv.setXY((index*6)+5, right, 1-upper);
  mesh.geometry.attributes.uv.needsUpdate = true;

  if (hiResTexture) {
    hiResTexture.dispose();
  }
}

function onMouseWheel(event) {
  var factor = 0.05;

  var mX = ( event.clientX / window.innerWidth ) * 2 - 1;
  var mY = - ( event.clientY / window.innerHeight ) * 2 + 1;
  var vector = new THREE.Vector3(mX, mY, 1 );

  vector.unproject(camera); // gives us the true coordinates of the point
  vector.sub(camera.position);
  var move = vector.setLength(camera.position.length()*factor);
  if (event.deltaY < 0 || event.detail < 0) {
    if ((move.z + camera.position.z) < controls.minDistance) {
      move.z = controls.minDistance - camera.position.z;
    }
    if (move.z < 0) {
      camera.position.addVectors(camera.position, move);
      move.z = 0;
      controls.target.addVectors(controls.target, move);
    }
  } else {
    if ((camera.position.z - move.z) > controls.maxDistance) {
      move.z = camera.position.z - controls.maxDistance;
    }
    if (move.z < 0) {
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

function onUIReset(event) {
  event.preventDefault();
  event.stopPropagation();
  controls.reset();
}

var queryStrings = (function(a) {
  if (a == "") return {};
  var b = {};
  for (var i = 0; i < a.length; ++i)
  {
    var p=a[i].split('=', 2);
    if (p.length == 1)
      b[p[0]] = "";
    else
      b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
  }
  return b;
})(window.location.search.substr(1).split('&'));

function lookupCoordinates(id) {
  for (var i = 0;i < collection.length;i++) {
    if (collection[i].identifier == id) {
      return [collection[i].embedding_x, collection[i].embedding_y];
    }
  }
}

var autoZoom = function(coords) {
  var tween = new TWEEN.Tween(camera.position.clone())
    .to({x : coords[0]*3, y: coords[1]*3, z : 300}, 2000)
    .onUpdate(function(progress) {
      camera.position.x = this.x;
      camera.position.y = this.y;
      camera.position.z = this.z;
      controls.target = new THREE.Vector3(this.x, this.y, 0);
      // TODO : mark image somehow
      // fade fisheye in
      fisheyeFactor = progress;
      // center fisheye on image
      recalculateFishEye({x : coords[0]*3, y : coords[1]*3}, false);
    })
    .onComplete(function() {
      // select work
      mouse.x = 0;
      mouse.y = 0;
    })
  tween.easing(TWEEN.Easing.Exponential.InOut);
  tween.delay(1000);
  tween.start();
}

function calcNeededFov(width, height) {
  var dist = 2000;
  var aspect = window.innerWidth / window.innerHeight;
  var widthfov = 2 * Math.atan( ( width*1.1 / aspect ) / ( 2 * dist ) ) * ( 180 / Math.PI )
  var heightfov = 2 * Math.atan( height*1.1 / ( 2 * dist ) ) * ( 180 / Math.PI );
  var fov = (widthfov > heightfov) ? widthfov : heightfov;
  return fov
}

init();
