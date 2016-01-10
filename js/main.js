var camera, scene, renderer;
var controls, android;
var geometry, material, mesh;
var keyAxis = [0, 0];

// Box2D world variables
wWorld           = undefined,
wPlayer          = undefined;
wEnemy           = undefined;
var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock )
{
  var element = document.body;
  var pointerlockchange = function ( event )
  {
    if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element )
    {
      controlsEnabled = true;
      controls.enabled = true;
      blocker.style.display = 'none';
    }
    else
    {
      controls.enabled = false;
      blocker.style.display = '-webkit-box';
      blocker.style.display = '-moz-box';
      blocker.style.display = 'box';
      instructions.style.display = '';
    }
  };

  var pointerlockerror = function ( event )
  {
    instructions.style.display = '';
  };

  // Hook pointer lock state change events
  document.addEventListener( 'pointerlockchange', pointerlockchange, false );
  document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
  document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
  document.addEventListener( 'pointerlockerror', pointerlockerror, false );
  document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
  document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

  instructions.addEventListener( 'click', function ( event )
  {
    instructions.style.display = 'none';
    // Ask the browser to lock the pointer
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    if ( /Firefox/i.test( navigator.userAgent ) )
    {
      var fullscreenchange = function ( event )
      {
        if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element )
        {
          document.removeEventListener( 'fullscreenchange', fullscreenchange );
          document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
          element.requestPointerLock();
        }
      };

      document.addEventListener( 'fullscreenchange', fullscreenchange, false );
      document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
      element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
      element.requestFullscreen();
    }
    else
    {
      element.requestPointerLock();
    }

  }, false );

} else
{
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

var	ByteMap = [ [ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 ],
                [ 1,1,1,0,0,1,1,1,1,1,1,1,0,0,1 ],
                [ 1,1,1,0,0,1,1,0,0,0,0,0,0,0,1 ],
                [ 1,0,0,0,0,1,1,1,0,1,1,1,0,0,1 ],
                [ 1,0,1,0,0,0,0,0,0,0,1,1,0,0,1 ],
                [ 1,0,1,1,1,0,1,1,1,0,1,1,0,0,1 ],
                [ 1,0,0,0,1,0,1,1,1,0,1,1,0,0,1 ],
                [ 1,0,1,1,1,0,1,1,1,0,0,0,0,0,1 ],
                [ 1,0,0,0,0,0,1,1,1,1,1,1,1,1,1 ],
                [ 1,1,1,1,1,0,0,0,0,0,0,0,0,0,1 ],
                [ 1,1,1,1,1,0,1,1,1,1,1,0,1,1,1 ],
                [ 1,0,0,0,0,0,0,1,1,1,1,0,0,1,1 ],
                [ 1,0,1,0,1,1,0,1,1,1,1,1,0,0,1 ],
                [ 1,0,1,0,1,1,0,0,0,0,1,1,1,0,1 ],
                [ 1,1,1,1,1,1,1,1,1,1,1,1,1,1,1 ]
              ];

var EmptyMap = [ [ -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1 ],
                 [ -1,-1,-1,0,0,-1,-1,-1,-1,-1,-1,-1,0,0,-1 ],
                 [ -1,-1,-1,0,0,-1,-1,0,0,0,0,0,0,0,-1 ],
                 [ -1,0,0,0,0,-1,-1,-1,0,-1,-1,-1,0,0,-1 ],
                 [ -1,0,-1,0,0,0,0,0,0,0,-1,-1,0,0,-1 ],
                 [ -1,0,-1,-1,-1,0,-1,-1,-1,0,-1,-1,0,0,-1 ],
                 [ -1,0,0,0,-1,0,-1,-1,-1,0,-1,-1,0,0,-1 ],
                 [ -1,0,-1,-1,-1,0,-1,-1,-1,0,0,0,0,0,-1 ],
                 [ -1,0,0,0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1 ],
                 [ -1,-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,-1 ],
                 [ -1,-1,-1,-1,-1,0,-1,-1,-1,-1,-1,0,-1,-1,-1 ],
                 [ -1,0,0,0,0,0,0,-1,-1,-1,-1,0,0,-1,-1 ],
                 [ -1,0,-1,0,-1,-1,0,-1,-1,-1,-1,-1,0,0,-1 ],
                 [ -1,0,-1,0,-1,-1,0,0,0,0,-1,-1,-1,0,-1 ],
                 [ -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1 ]
               ];

var clearMap = new Array(15);
for (var i = 0; i < 15; ++i)
{
    clearMap[i] = new Array(15);
}

var prevStep = {
  x : 13,
  y : 13 };
var newStep = {};

var currentPoint = {
  z : 260,
  x : 260 };
var nextPoint = {};
var playerPos = {
    z: 60,
    x: 60 };

var currentDirection = "UP";
var nextDirection = "";
var enemySubStep = 0.0;
var framesPerStep = 30.0;
var ArrayX = [];
var ArrayZ = [];
var coordsCounter = 1;
var xCur, zCur;
var WayX = [], WayZ = [];

init();
animate();

var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var shift = false;
var firstPerson = true;
var enemy;
var prevTime = performance.now();
var velocity = new THREE.Vector3();


function AddWalk(x, y, index)
{
  var array = [];
  if (ByteMap[x][y] == 0)
  {
    array.push(index);
  }
  return array;
}

function ConcatenateArrays(origin, newArray)
{
  var curArray = [];
  curArray = origin;
  for (var i = 0; i < newArray.length; ++i)
  {
    curArray.push(newArray[i]);
  }
  return curArray;
}

function SelectNextPoint()
{
  var coords_array = [];
  var canWalk_array = [];
  if (currentDirection == "UP")
  {
    coords_array.push([prevStep.x - 1, prevStep.y]);
    coords_array.push([prevStep.x, prevStep.y + 1]);
    coords_array.push([prevStep.x + 1, prevStep.y]);
    coords_array.push([prevStep.x, prevStep.y - 1]);

    var temp = [];
    temp = AddWalk(prevStep.x - 1, prevStep.y, 0);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x, prevStep.y + 1, 1);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x + 1, prevStep.y, 2);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x, prevStep.y - 1, 3);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);
  }
  if (currentDirection == "RIGHT")
  {
    coords_array.push([prevStep.x, prevStep.y + 1]);
    coords_array.push([prevStep.x + 1, prevStep.y]);
    coords_array.push([prevStep.x, prevStep.y - 1]);
    coords_array.push([prevStep.x - 1, prevStep.y]);

    var temp = [];
    temp = AddWalk(prevStep.x, prevStep.y + 1, 0);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x + 1, prevStep.y, 1);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x, prevStep.y - 1, 2);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x - 1, prevStep.y, 3);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);
  }
  if (currentDirection == "DOWN")
  {
    coords_array.push([prevStep.x + 1, prevStep.y]);
    coords_array.push([prevStep.x, prevStep.y - 1]);
    coords_array.push([prevStep.x - 1, prevStep.y]);
    coords_array.push([prevStep.x, prevStep.y + 1]);

    var temp = [];
    temp = AddWalk(prevStep.x + 1, prevStep.y, 0);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x, prevStep.y - 1, 1);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x - 1, prevStep.y, 2);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x, prevStep.y + 1, 3);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);
  }
  if (currentDirection == "LEFT")
  {
    coords_array.push([prevStep.x, prevStep.y - 1]);
    coords_array.push([prevStep.x - 1, prevStep.y]);
    coords_array.push([prevStep.x, prevStep.y + 1]);
    coords_array.push([prevStep.x + 1, prevStep.y]);

    var temp = [];
    temp = AddWalk(prevStep.x, prevStep.y - 1, 0);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x - 1, prevStep.y, 1);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x, prevStep.y + 1, 2);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);

    temp = AddWalk(prevStep.x + 1, prevStep.y, 3);
    canWalk_array = ConcatenateArrays(canWalk_array, temp);
  }

    var index = Math.floor(Math.random() * canWalk_array.length);
    newStep.x = coords_array[canWalk_array[index]][0];
    newStep.y = coords_array[canWalk_array[index]][1];

    ChooseNewDirection();
    SetNextPoint();

}

function SetNextPoint()
{
    if (nextDirection == "UP")
    {
        nextPoint.z = currentPoint.z - 20;
        nextPoint.x = currentPoint.x;
    }
    else
    {
      if (nextDirection == "RIGHT")
      {
        nextPoint.z = currentPoint.z;
        nextPoint.x = currentPoint.x + 20;
      }
      else
      {
        if (nextDirection == "DOWN")
        {
            nextPoint.z = currentPoint.z + 20;
            nextPoint.x = currentPoint.x;
        }
        else
        {
            nextPoint.z = currentPoint.z;
            nextPoint.x = currentPoint.x - 20;
        }
      }
    }
    ByteMap[newStep.x][newStep.y] = 2;
    ByteMap[prevStep.x][prevStep.y] = 0;
}

function ChooseNewDirection()
{
    if (newStep.x != prevStep.x)
    {
        if (prevStep.x > newStep.x)
        {
          nextDirection = "UP";
        }
        if (prevStep.x < newStep.x)
        {
          nextDirection = "DOWN";
        }
    }
    if (newStep.y != prevStep.y)
    {
        if (prevStep.y > newStep.y)
        {
          nextDirection = "LEFT";
        }
        if (prevStep.y < newStep.y)
        {
          nextDirection = "RIGHT";
        }
    }
}

function lerp(v0, v1, t)
{
    return v0 + t * (v1 - v0);
}

function CheckCoords(x, y)
{
  return ByteMap[x][y] == 0;
}

function CloneArray()
{
    for (var i = 0; i < 15; ++i)
    {
        for (var j = 0; j < 15; ++j)
        {
            clearMap[i][j] = EmptyMap[i][j];
        }
    }
}

function EnemyWalk()
{
    if (nextDirection == "UP" || nextDirection == "DOWN")
    {
        enemy.position.z = lerp(currentPoint.z, nextPoint.z, enemySubStep / framesPerStep);
        if (nextDirection == "UP")
        {
            enemy.rotation.y = Math.PI;
        }
        else
        {
            enemy.rotation.y = 0;
        }
    }
    else
    {
        enemy.position.x = lerp(currentPoint.x, nextPoint.x, enemySubStep / framesPerStep);
        if (nextDirection == "LEFT")
        {
            enemy.rotation.y = -Math.PI/2;
        }
        else
        {
            enemy.rotation.y = Math.PI/2;
        }
    }
    enemySubStep++;

    if (enemySubStep == framesPerStep)
    {
        enemySubStep = 0.0;
        currentPoint.z = nextPoint.z;
        currentPoint.x = nextPoint.x;
        prevStep.x = newStep.x;
        prevStep.y = newStep.y;
        currentDirection = nextDirection;

        PreWave();
    }
}

function ChangeItemSence(x1, z1, x2, z2)
{
    var itemSence = clearMap[x1][z1];
    ++coordsCounter;
    ArrayX.push(x2);
    ArrayZ.push(z2);
    ++itemSence;
    clearMap[x2][z2] = itemSence;
}

function Wave(x, z, point)
{
    if (clearMap[x+1][z] != -1 && clearMap[x+1][z] == 0)
    {
        ChangeItemSence(x, z, x+1, z);
        if (point.x == x + 1 && point.z == z)
        {
            return true;
        }
    }
    if (clearMap[x][z+1] != -1 && clearMap[x][z+1] == 0)
    {
        ChangeItemSence(x, z, x, z+1);
        if (point.x == x && point.z == z + 1)
        {
            return true;
        }
    }
    if (clearMap[x-1][z] != -1 && clearMap[x-1][z] == 0)
    {
        ChangeItemSence(x, z, x-1, z);
        if (point.x == x - 1 && point.z == z)
        {
            return true;
        }
    }
    if (clearMap[x][z-1] != -1 && clearMap[x][z-1] == 0)
    {
        ChangeItemSence(x, z, x, z-1);
        if (point.x == x && point.z == z - 1)
        {
            return true;
        }
    }

    return false;
}

function PreWave()
{
    //console.log("x1 :", prevStep.x);
    //console.log("z1 :", prevStep.y);
    coordsCounter = 1;
    ArrayX = [];
    ArrayZ = [];
    CloneArray();

    ArrayX.push(prevStep.x);
    ArrayZ.push(prevStep.y);
    clearMap[prevStep.x][prevStep.y] = 1;

    var playerPosition = {};
    playerPosition.x = Math.round(Math.round(android.position.x) / 20);
    playerPosition.z = Math.round(Math.round(android.position.z) / 20);

    console.log(playerPosition.x, playerPosition.z);

    var kCounter = 0;
    var x1 = ArrayX[kCounter];
    var z1 = ArrayZ[kCounter];
    var x2, z2;
    for (var i = 0; i < coordsCounter; ++i)
    {
        if (clearMap[playerPosition.z][playerPosition.x] != 0)
        {
            break;
        }
        x2 = ArrayX[kCounter];
        z2 = ArrayZ[kCounter];

        if (!Wave(x2, z2, playerPosition))
        {
            ++kCounter;
        }
        else
        {
            //alert("Game Over!");
            break;
        }
    }

    BuildWay(playerPosition.x, playerPosition.z);

    newStep.x = WayX[WayX.length - 2];
    newStep.y = WayZ[WayZ.length - 2];

    /*if (WayX.length > 2)
    {

    }
    else
    {
        newStep.x = WayX[WayX.length - 1];
        newStep.y = WayZ[WayZ.length - 1];
    }*/


    ChooseNewDirection();
    SetNextPoint();
}

function Around(x, z, sence)
{
    if (clearMap[x+1][z] == sence - 1)//right
    {
        xCur = x + 1;
        zCur = z;
        WayX.push(x+1);
        WayZ.push(z);
        return;
    }
    if (clearMap[x][z+1] == sence - 1)//down
    {
        xCur = x;
        zCur = z + 1;
        WayX.push(x);
        WayZ.push(z+1);
        return;
    }
    if (clearMap[x-1][z] == sence - 1)//left
    {
        xCur = x - 1;
        zCur = z;
        WayX.push(x-1);
        WayZ.push(z);
        return;
    }
    if (clearMap[x][z-1] == sence - 1)//up
    {
        xCur = x;
        zCur = z - 1;
        WayX.push(x);
        WayZ.push(z-1);
        return;
    }
}

function BuildWay(x, z)
{
    WayX = [];
    WayZ = [];

    WayX.push(x);
    WayZ.push(z);
    xCur = x;
    zCur = z;
    while ((xCur != prevStep.x) || (zCur != prevStep.y))
    {
        //console.log(xCur, prevStep.x, zCur, prevStep.y);
        Around(xCur, zCur, clearMap[xCur][zCur]);
    }
}

function init()
{
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 200 );
    var direction = new THREE.Vector3(0, 0, 1);
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 0, 150 );
    controls = new THREE.PointerLockControls(camera);

    controls.getObject().position.x = playerPos.x;
    controls.getObject().position.z = playerPos.z;
    camera.lookAt(direction);
    scene.add(controls.getObject());

    /*var light = new THREE.HemisphereLight( 0x0000ff, 0x00ff00, 0.6);
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );
    var light = new THREE.AmbientLight( 0xff0000);
    scene.add( light );*/

    var onKeyDown = function ( event )
    {
    switch ( event.keyCode )
    {
      case 38: // up
      case 83: // w
        moveForward = true;
        break;
      case 37: // left
      case 68: // a
        moveLeft = true;
        break;
      case 40: // down
      case 87: // s
        moveBackward = true;
        break;
      case 39: // right
      case 65: // d
        moveRight = true;
        break;
      case 16:
        shift = true;
        break;
      case 67: //switching 1-st to 3-rd and back
        //SwitchingCamera();
        break;
    }
    };

    var onKeyUp = function ( event )
    {
    switch( event.keyCode )
    {
      case 38: // up
      case 83: // w
        moveForward = false;
        break;
      case 37: // left
      case 68: // a
        moveLeft = false;
        break;
      case 40: // down
      case 87: // s
        moveBackward = false;
        break;
      case 39: // right
      case 65: // d
        moveRight = false;
        break;
      case 16:
        shift = false;
        break;
    }
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0 ), 0, 10);

    CreateLabirint();
    CreateEnemy();

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio );
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
    CreatePhysicsWorld();
}

function CreateFloorRoof(rotation, imageSrc, y)
{
    var floorGeometry = new THREE.PlaneGeometry(280, 280, 1, 1);
    floorGeometry.rotateX(rotation);
    var floorTexture = new THREE.ImageUtils.loadTexture(imageSrc);
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(40, 40);
    var floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture});
    var floor = new THREE.Mesh(floorGeometry, floorMaterial );
    floor.position.x = 140;
    floor.position.y = y;
    floor.position.z = 140;
    return floor;
}

function CreateLabirint()
{
    var floor = CreateFloorRoof(-Math.PI / 2, 'res/img/concrete.png', 0);
    scene.add(floor);
    var roof = CreateFloorRoof(Math.PI / 2, 'res/img/brick.png', 30);
    scene.add(roof);

    var geometry = new THREE.BoxGeometry(20, 30, 20);
    var	texture = new THREE.ImageUtils.loadTexture('res/img/brick.png');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 8);
    var material = new THREE.MeshBasicMaterial( { map: texture} );
    for ( var i = 0; i < map.coords.length; i ++ )
    {
    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.x = map.coords[i].x;
    mesh.position.y = 15;
    mesh.position.z = map.coords[i].z;
    scene.add(mesh);
    }
    var jsonLoader = new THREE.JSONLoader();
    jsonLoader.load( "js/android-animations.js", addModelToScene );
}

function addModelToScene(geometry, materials)
{
    for (var i = 0; i < materials.length; i++)
    {
    materials[i].morphTargets = true;
    }
    var material = new THREE.MeshNormalMaterial( materials );
    android = new THREE.Mesh( geometry, material );
    android.position.x = 60;
    android.position.z = 60;
    scene.add( android );

    PreWave();
}

function CreatePhysicsWorld()
{
  wWorld = new Box2D.b2World(new Box2D.b2Vec2(0, 0), true);
  var bodyDef = new Box2D.b2BodyDef();
  bodyDef.set_type(Box2D.b2_dynamicBody);
  bodyDef.set_position(new Box2D.b2Vec2(60, 60));
  wPlayer = wWorld.CreateBody(bodyDef);
  var fixDef = new Box2D.b2FixtureDef();
  fixDef.set_density(10.0);
  fixDef.set_friction(5);
  fixDef.set_restitution(0.25);
  fixDef.set_shape(new Box2D.b2CircleShape(2));
  wPlayer.CreateFixture(fixDef);

  var enemybodyDef = new Box2D.b2BodyDef();
  bodyDef.set_type(Box2D.b2_dynamicBody);
  bodyDef.set_position(new Box2D.b2Vec2(260, 260));
  wEnemy = wWorld.CreateBody(enemybodyDef);
  var enemyfixDef = new Box2D.b2FixtureDef();
  enemyfixDef.set_density(10.0);
  enemyfixDef.set_friction(5);
  enemyfixDef.set_restitution(0.25);
  enemyfixDef.set_shape(new Box2D.b2CircleShape(1));
  wPlayer.CreateFixture(enemyfixDef);

  bodyDef.set_type(Box2D.b2_staticBody);
  var shape = new Box2D.b2PolygonShape();
  shape.SetAsBox(13, 13);
  fixDef.set_shape(shape);
  for ( var i = 0; i < map.coords.length; i ++ )
  {
    bodyDef.set_position(new Box2D.b2Vec2(map.coords[i].x, map.coords[i].z));
    wWorld.CreateBody(bodyDef).CreateFixture(fixDef);
  }
}

function onWindowResize()
{
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function SetShiftCoef()
{
  if (shift)
  {
    return 4;
  }
  return 1;
}

function CreateEnemy()
{
    var jsonLoader = new THREE.JSONLoader();
    jsonLoader.load( "js/android-animations.js", addEnemyToScene );
}

function addEnemyToScene(geometry, materials)
{
  for (var i = 0; i < materials.length; i++)
  {
    materials[i].morphTargets = true;
  }
  var material = new THREE.MeshNormalMaterial( materials );
  enemy = new THREE.Mesh( geometry, material );
  enemy.position.x = 260;
  enemy.position.z = 260;
  scene.add( enemy );
}

function updatePhysicsWorld()
{
  // Apply "friction".
  var lv = wPlayer.GetLinearVelocity();
  lv.op_mul(0.9);
  wPlayer.SetLinearVelocity(lv);

  var shiftCoef = SetShiftCoef();

  // Apply user-directed force.
  var f = new Box2D.b2Vec2(keyAxis[0]*wPlayer.GetMass() * shiftCoef, keyAxis[1]*wPlayer.GetMass() * shiftCoef);
  wPlayer.ApplyLinearImpulse(f, wPlayer.GetPosition(), true);
  keyAxis = [0,0];
  // Take a time step.
    wWorld.Step(1/30, 2, 2);
}

function RunningPLayer()
{
    if (moveForward)
    {
        keyAxis[0] += -controls.getObject().getWorldDirection().x;
        keyAxis[1] += -controls.getObject().getWorldDirection().z;
    }
    if (moveBackward)
    {
        keyAxis[0] += controls.getObject().getWorldDirection().x;
        keyAxis[1] += controls.getObject().getWorldDirection().z;
    }
    if (moveLeft)
    {
        keyAxis[1] += controls.getObject().getWorldDirection().x;
        keyAxis[0] += -controls.getObject().getWorldDirection().z;
    }
    if (moveRight)
    {
        keyAxis[1] += -controls.getObject().getWorldDirection().x;
        keyAxis[0] += controls.getObject().getWorldDirection().z;
    }
}

function animate()
{
    updatePhysicsWorld();
    requestAnimationFrame(animate);

    RunningPLayer();
    EnemyWalk();

    alpha = controls.getObject().rotation.y;
    controls.getObject().position.x = wPlayer.GetPosition().get_x() + Math.sin(alpha) * 2;
    controls.getObject().position.z = wPlayer.GetPosition().get_y() + Math.cos(alpha) * 2;

    android.position.x = wPlayer.GetPosition().get_x();
    android.position.z = wPlayer.GetPosition().get_y();

    android.rotation.y = controls.getObject().rotation.y;
    //  enemy.rotation.y = -android.rotation.y;
    renderer.render(scene,camera);
}
