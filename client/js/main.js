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

var tileSize;

var fisheye;

var mouse_down_init_position;

var numberWorks = 0;

var numTextures, textureLoader, jpgTextureLoader;

var autoPanVec = -1;

var firstRender = true;

var autoZoomed = false;

var hiResTexture;

var isTouch = true;
var touchMove = false;

THREE.ImageUtils.crossOrigin = '';

var z_scaler = 20;

var collectionWidth, collectionHeight;

var dataPath;

var minX = minY = Infinity;
var maxX = maxY = -Infinity;

var minTouchDist, minFisheyeDist;

var maxFisheyeZ;

var textureFormat;

var isCanvas = false;

var workMarker, workMarkerPosition;
var markedWork = -1;

var textureLoaders = {
  's3tc' : THREE.DDSLoader,
  'pvrtc' : THREE.PVRLoader,
  //'etc1' : THREE.DDSLoader,
  'jpg' : THREE.TextureLoader
}

function init() {

  container = document.getElementById( 'container' );

  if ( Detector.webgl ) {
    renderer = new THREE.WebGLRenderer( { antialias: false, alpha : true, logarithmicDepthBuffer: true  } );
    var availableExtensions = renderer.context.getSupportedExtensions();
    if (availableExtensions.indexOf("WEBGL_compressed_texture_s3tc") > -1) textureFormat = "s3tc";
    else if (availableExtensions.indexOf("WEBGL_compressed_texture_pvrtc") > -1 || availableExtensions.indexOf("WEBKIT_WEBGL_compressed_texture_pvrtc") > -1) textureFormat = "pvrtc";
    //else if (availableExtensions.indexOf("WEBGL_compressed_texture_etc1") > -1) textureFormat = "etc1";
    else textureFormat = "jpg";
  } else {
    renderer = new THREE.CanvasRenderer( { antialias: false, alpha : true } );
    textureFormat = "jpg";
    isCanvas = true;
    mosaics = canvas_mosaics;
  }
  renderer.setClearColor( 0x333333 );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  container.appendChild( renderer.domElement );

  // 

  for (var i = 0;i < mosaics.length;i++) {
    numberWorks += mosaics[i]["tiles"];
  }

  var xCoords = collection.map(function(e){return e.embedding_x});
  var yCoords = collection.map(function(e){return e.embedding_y});
  xCoords.sort(function (a,b) {return a-b;});
  yCoords.sort(function (a,b) {return a-b;});
  var lowPercentile = Math.floor(numberWorks*0.01);
  var hiPercentile = Math.floor(numberWorks*0.99);
  collectionWidth = (xCoords[hiPercentile]-xCoords[lowPercentile])*1.1;
  collectionHeight = (yCoords[hiPercentile]-yCoords[lowPercentile])*1.1;
  maxX = xCoords[numberWorks-1];
  minX = xCoords[0];
  maxY = yCoords[numberWorks-1];
  minY = yCoords[0];

  // set tilesize so that images approximately cover entire map
  tileSize = Math.sqrt( Math.PI*Math.pow((collectionWidth+collectionHeight)/4,2) / numberWorks );

  var feD = 5;
  var feR = tileSize*10;
  fisheye = Fisheye.circular().radius(feR).distortion(feD);
  
  // calculate the maximum z-height of works distorted by fisheye
  var k0 = Math.exp(feD) / (Math.exp(feD) - 1) * feR;
  maxFisheyeZ = (k0 * (1 - Math.exp(-0.001 * feD/feR)) / 0.001 * .75 + .25) * z_scaler;

  // calculate needed fov to fit all works in view
  var fov = calcNeededFov(collectionWidth, collectionHeight);

  // calculate maximum zoom
  var aspect = window.innerWidth / window.innerHeight;
  var perspectiveScale = tileSize / Math.tan( 0.5*fov*Math.PI/180 );
  perspectiveScale = aspect > 1 ? perspectiveScale : (perspectiveScale/aspect);
  minTouchDist = z_scaler + 0.564 * perspectiveScale;
  minFisheyeDist = maxFisheyeZ + 2.336 * perspectiveScale;

  //

  camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 10, 3500 );
  camera.position.z = 2000;

  scene = new THREE.Scene();

  //

  // mark work if specified in url
  if (lookupWork(queryStrings['id']) !== undefined) {
    markedWork = lookupWork(queryStrings['id']);
    workMarkerPosition = new THREE.Vector3(collection[markedWork]['embedding_x'],collection[markedWork]['embedding_y'],z_scaler + 2.);
  }

  // create geometry and merge into one geometry
  singleGeometry = new THREE.Geometry();
  for (var i = 0;i < numberWorks;i++) {
    var area = collection[i]['image_width']*collection[i]['image_height'];
    var scaling = tileSize / Math.sqrt(area);
    collection[i]['draw_width'] = collection[i]['image_width']*scaling;
    collection[i]['draw_height'] = collection[i]['image_height']*scaling;

    var plane = new THREE.PlaneGeometry( collection[i]['draw_width'], collection[i]['draw_height'] );
    var planeMesh = new THREE.Mesh(plane);
    planeMesh.position.x = collection[i]['embedding_x'];
    planeMesh.position.y = collection[i]['embedding_y'];
    if (markedWork == i) {
      planeMesh.position.z = z_scaler + 2.1;
    } else {
      planeMesh.position.z = z_scaler + i*0.0001;
    }
    planeMesh.updateMatrix();
    singleGeometry.merge(planeMesh.geometry, planeMesh.matrix);
  }

  var loadGeometry = function() {
    var materials = [];
    var totalVertices = 0;
    for (var i = 0;i < numTextures;i++) {
      // set up mapping from textures to geometry
      var mw = mosaics[i].mosaicWidth;
      var tSize = mosaics[i].tileSize;
      var pDim = mosaics[i].pixelWidth;
      for (var j = 0;j < mosaics[i].tiles;j++) {
        var left = ((j % mw)*tSize)/pDim;
        var upper = (Math.floor(j / mw)*tSize)/pDim;
        var right = left + tSize/pDim;
        var lower = upper + tSize/pDim;
        if (isCanvas) {
          upper = 1-upper;
          lower = 1-lower;
        }
        var coords = [
          new THREE.Vector2(left,upper),
          new THREE.Vector2(left,lower),
          new THREE.Vector2(right,lower),
          new THREE.Vector2(right,upper),
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

    // marker of image
    if (lookupWork(queryStrings['id']) !== undefined) {
      var workMarkerMaterial = new THREE.MeshBasicMaterial({ color : 0xffffee, transparent : true, opacity: 0.5 ,overdraw : true });
      var workMarkerGeom = new THREE.CircleGeometry( 1*Math.sqrt(2*tileSize*tileSize), 32 );
      workMarker = new THREE.Mesh( workMarkerGeom, workMarkerMaterial );
      workMarker.position.set(workMarkerPosition.x, workMarkerPosition.y, workMarkerPosition.z);
      scene.add(workMarker);
    }

    mesh = new THREE.Mesh(singleGeometry, multimaterial);
    scene.add(mesh);

    animate();
  }

  var texturesLoaded = 0;
  numTextures = mosaics.length;
  var textures = [];
  jpgTextureLoader = new textureLoaders['jpg']();
  textureLoader = new textureLoaders[textureFormat]();
  for (var i = 0;i < numTextures;i++) {
    var texture = textureLoader.load(
      dataPath + mosaics[i].image[textureFormat],
      function(texture) {
        texture.flipY = false;
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

  controls = new TrackballControls( camera, renderer.domElement );
  controls.minDistance = minTouchDist;
  controls.maxDistance = 2200;
  controls.noRotate = true;
  controls.noMouseZoom = true;
  controls.panSpeed = 0.5;
  controls.staticMoving = true;
  controls.enabled = false;
  controls.maxPanX = maxX;
  controls.minPanX = minX;
  controls.maxPanY = maxY;
  controls.minPanY = minY;
  controls.unprojectZ = z_scaler;

  //

  /*stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  container.appendChild( stats.domElement );*/

  //

  window.addEventListener( 'resize', onWindowResize, false );
}

function onWebGLMouseDown( event ) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
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
    var work_id = collection[currentIntersectFace].identifier;
    var work_url = "http://samling.nasjonalmuseet.no/no/object/"+work_id.replace("&","_");
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

  if (isTouch) {
    isTouch = false;
    controls.unprojectZ = maxFisheyeZ;
    controls.minDistance =  minFisheyeDist;
  }

  // Don't update when panning
  if (controls.ismousedown) {
    autoPanVec = -1;
    return;
  }

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

    var distance = (maxFisheyeZ - camera.position.z) / dir.z;

    coords = camera.position.clone().add( dir.multiplyScalar( distance ) );
  }

  fisheye.focus([coords.x,coords.y]);
  
  for (var i = 0;i < collection.length;i++) {
    var x_coords = collection[i]['embedding_x'];
    var y_coords = collection[i]['embedding_y'];
    var fisheye_trans = fisheye({x: x_coords, y: y_coords});
    
    var x_size = collection[i]['draw_width']/2
    var y_size = collection[i]['draw_height']/2
    var x_offset = x_size+((fisheye_trans.z-1)*0.7*x_size);
    var y_offset = y_size+((fisheye_trans.z-1)*0.7*y_size);
    var x_pos = fisheye_trans.x;
    var y_pos = fisheye_trans.y;
    if (markedWork == i) {
      var z_pos = fisheye_trans.z*z_scaler + 2.1;
    } else {
      var z_pos = fisheye_trans.z*z_scaler + i*0.0001;
    }
    singleGeometry.attributes.position.setXYZ((i*6)  , x_pos-x_offset, y_pos+y_offset, z_pos);
    singleGeometry.attributes.position.setXYZ((i*6)+1, x_pos-x_offset, y_pos-y_offset, z_pos);
    singleGeometry.attributes.position.setXYZ((i*6)+2, x_pos+x_offset, y_pos+y_offset, z_pos);
    singleGeometry.attributes.position.setXYZ((i*6)+3, x_pos-x_offset, y_pos-y_offset, z_pos);
    singleGeometry.attributes.position.setXYZ((i*6)+4, x_pos+x_offset, y_pos-y_offset, z_pos);
    singleGeometry.attributes.position.setXYZ((i*6)+5, x_pos+x_offset, y_pos+y_offset, z_pos);
  }
  singleGeometry.attributes.position.needsUpdate = true;

  if (markedWork >= 0) {
    // recalculate position and size of marker
    var fisheye_trans = fisheye({x : workMarkerPosition.x, y : workMarkerPosition.y});
    var x_size = tileSize/2;
    var x_offset = x_size+((fisheye_trans.z-1)*0.7*x_size);
    workMarker.scale.x = x_offset/x_size;
    workMarker.scale.y = x_offset/x_size;
    workMarker.position.x = fisheye_trans.x;
    workMarker.position.y = fisheye_trans.y;
    workMarker.position.z = fisheye_trans.z*z_scaler + 2.;
  }
}


function autoPan(mouse) {

  var mouseVec = new THREE.Vector3(mouse.x, mouse.y, 0)
  if (mouseVec.length() > 0.75 && mouseVec.length() < 2) {
    autoPanVec = mouseVec
  } else {
    autoPanVec = -1
  }
}

function onTouchStart( event ) {
  if (!isTouch) {
    isTouch = true;
    controls.minDistance = minTouchDist;
    controls.unprojectZ = z_scaler;
  }
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
      var work_id = collection[currentIntersectFace].identifier;
      var work_url = "http://samling.nasjonalmuseet.no/no/object/"+work_id.replace("&","_");
      if (currentIntersectFace == previousFace && !autoZoomed) {
        window.open(work_url, '_blank');
      }
      var metadata = collection[currentIntersectFace];
      document.getElementById("imageinfo").innerHTML = "<p><strong>"+metadata.artist+", <a href='"+work_url+
        "' target='_blank'><em>"+metadata.title+"</em></a></strong>. "+metadata.yearstring+".</p>";
    }
  }
  if (autoZoomed) autoZoomed = false;
  touchMove = false;
}

function onLinkTouchEnd( event ) {
  event.preventDefault();
  event.stopPropagation();
  if (currentIntersectFace >= 0) {
    var work_id = collection[currentIntersectFace].identifier;
    var work_url = "http://samling.nasjonalmuseet.no/no/object/"+work_id.replace("&","_");
    window.open(work_url, '_blank');
  }
}


function animate() {

  if (autoPanVec != -1 && !controls.ismousedown) {
    var temp = autoPanVec.clone();
    temp.x /= 3;
    temp.y /= 3;
    var new_x = controls.target.x + autoPanVec.x;
    var new_y = controls.target.y + autoPanVec.y;
    if (autoPanVec.x < 0 && new_x < minX) temp.x = 0;
    if (autoPanVec.x > 0 && new_x > maxX) temp.x = 0;
    if (autoPanVec.y < 0 && new_y < minY) temp.y = 0;
    if (autoPanVec.y > 0 && new_y > maxY) temp.y = 0;
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

  //stats.update();
  TWEEN.update();

}

function updateTileInfo() {

  // check if pointer interacts with tile
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObject( mesh );

  // updates on entering/leaving tiles

  if ( intersects.length > 0 ) {
    var face_index = Math.floor(intersects[0].face.a/6);

    if (currentIntersectFace == -1) {
      // entering tile
      var metadata = collection[face_index];
      document.getElementById("imageinfo").innerHTML = "<p><strong>"+metadata.artist+", <em>"+metadata.title+"</em></strong>. "+metadata.yearstring+".</p>";
      document.getElementById("imageinfo").style.display = "block";
      document.getElementById("container").setAttribute("class","clickable");
      currentIntersectFace = face_index;
      if ( isTouch ) {
        // raise selected tile
        for (var i = 0;i < 6;i++) {
          singleGeometry.attributes.position.setZ((currentIntersectFace*6)+i, singleGeometry.attributes.position.getZ((currentIntersectFace*6)+i) + 2.0);
        }
        singleGeometry.attributes.position.needsUpdate = true;
      }
      // set timeout to avoid queuing lots of images on panning
      setTimeout(function() {if (currentIntersectFace == face_index) getHighResImage(face_index);}, 100);
    } else if (face_index != currentIntersectFace) {
      // entering tile, leaving previous tile
      var metadata = collection[face_index];
      document.getElementById("imageinfo").innerHTML = "<p><strong>"+metadata.artist+", <em>"+metadata.title+"</em></strong>. "+metadata.yearstring+".</p>";
      removeHighResImage(currentIntersectFace);
      if ( isTouch ) {
        // lower previous selected tile and raise new selected tile
        for (var i = 0;i < 6;i++) {
          singleGeometry.attributes.position.setZ((currentIntersectFace*6)+i, singleGeometry.attributes.position.getZ((currentIntersectFace*6)+i) - 2.0);
          singleGeometry.attributes.position.setZ((face_index*6)+i, singleGeometry.attributes.position.getZ((face_index*6)+i) + 2.0);
        }
        singleGeometry.attributes.position.needsUpdate = true;
      }
      currentIntersectFace = face_index;
      // set timeout to avoid queuing lots of images on panning
      setTimeout(function() {if (currentIntersectFace == face_index) getHighResImage(face_index);}, 100);
    }
  } else if (currentIntersectFace != -1) {
    // leaving tile
    if ( isTouch ) {
      // lower previous selected tile
      for (var i = 0;i < 6;i++) {
        singleGeometry.attributes.position.setZ((currentIntersectFace*6)+i, singleGeometry.attributes.position.getZ((currentIntersectFace*6)+i) - 2.0);
      }
      singleGeometry.attributes.position.needsUpdate = true;
    }
    removeHighResImage(currentIntersectFace);
    currentIntersectFace = -1;
    document.getElementById("imageinfo").style.display = "none";
    document.getElementById("container").setAttribute("class","");
  }
}

function render() {

  if (!isTouch) {
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
    renderer.domElement.addEventListener( 'touchend', onTouchEnd, false);
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
      var workIndex = lookupWork(queryStrings['id']);
      var workCoords = [collection[workIndex].embedding_x, collection[workIndex].embedding_y];
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
  hiResTexture = jpgTextureLoader.load(
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
  var tSize = mosaics[mosaicIndex].tileSize;
  var pDim = mosaics[mosaicIndex].pixelWidth;

  var left = ((i % mw)*tSize)/pDim;
  var upper = (Math.floor(i / mw)*tSize)/pDim;
  var right = left + tSize/pDim;
  var lower = upper + tSize/pDim;
  if (isCanvas) {
    upper = 1-upper;
    lower = 1-lower;
  }

  mesh.geometry.clearGroups();
  var mosaicStart = 0
  for (var i = 0;i < mosaics.length;i++) {
    mesh.geometry.addGroup(mosaicStart*6, mosaics[i].tiles*6, i);
    mosaicStart += mosaics[i].tiles;
  }
  mesh.geometry.groupsNeedUpdate = true;

  mesh.geometry.attributes.uv.setXY((index*6)  , left, upper);
  mesh.geometry.attributes.uv.setXY((index*6)+1, left, lower);
  mesh.geometry.attributes.uv.setXY((index*6)+2, right, upper);
  mesh.geometry.attributes.uv.setXY((index*6)+3, left, lower);
  mesh.geometry.attributes.uv.setXY((index*6)+4, right, lower);
  mesh.geometry.attributes.uv.setXY((index*6)+5, right, upper);
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

function lookupWork(id) {
  for (var i = 0;i < collection.length;i++) {
    if (collection[i].identifier == id) {
      return i;
    }
  }
}

var autoZoom = function(coords) {
  var tweenVars = camera.position.clone();
  tweenVars.factor = 0;
  var tween = new TWEEN.Tween(tweenVars)
    .to({x : coords[0], y: coords[1], z : 300, factor : 1}, 2000)
    .onUpdate(function() {
      camera.position.x = this.x;
      camera.position.y = this.y;
      camera.position.z = this.z;
      controls.target = new THREE.Vector3(this.x, this.y, 0);
    })
    .onComplete(function() {
      // select work
      mouse.x = 0;
      mouse.y = 0;
      updateTileInfo();
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

function loadScripts(url, onSuccess) {
  var el = document.createElement('script');
  el.src = url;
  el.onload = onSuccess;
  document.body.appendChild(el);
}

// load collection and initialize
if (queryStrings['collection'] !== undefined) {
  dataPath = './data/'+queryStrings['collection']+'/';
} else {
  dataPath = './data/painting/';
}
loadScripts(dataPath+'collection.js',init);