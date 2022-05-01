//import * as THREE from "./three.js/three.module.min.js.gz"
import * as THREE from "./three.js/three.module.min.js"
import {NaturalCamera} from "./three.js/NaturalCamera.js"
import { lnQuat } from "./three.js/lnQuatSq.js"
//import * as CANNON from "./cannon-es/cannon-es.js.gz"
import * as CANNON from "./cannon-es/cannon-es.js"

let loader = new THREE.TextureLoader();

const compassCircle = document.querySelector(".compass-circle");
const startBtn = document.querySelector(".start-btn");
const myPoint = document.querySelector(".my-point");
let compass;
const isIOS = false /* !(
  navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
  navigator.userAgent.match(/AppleWebKit/ && !navigator.userAgent.match(/Chrome/))
)
*/
	;
const lnQWorld = new lnQuat();
const lnQWorldInv = new lnQuat();
const lnQWorld2 = new lnQuat();
const lnQTangPlane = new lnQuat();
const lnQTangPlaneInv = new lnQuat();
const lnQWorldTmp = new lnQuat();
const lnQWorldTmp2 = new lnQuat();

let logged = false;

const state = {
	useMouse :false, // motion sensors not available.
	dragging: false,
	lnQCamOldDel: new lnQuat(),  // current difference (diff here and locked)
	lnQCamBias: new lnQuat(), // starting orientation (locked)
	lnQCamDel: new lnQuat(),  // current difference (diff here and locked)
	lnQCamReal: new lnQuat(), // world and camDel
	cameraPin: false,
	cameraSpin: false,
	cameraPinAt : new THREE.Vector3(0,0,0),
	cameraAt : new THREE.Vector3(0,0,0),
	x: 0,
	y: 0,
};
let lat = 0;
let lng = 0;

const q2 = navigator.permissions.query({ name: 'geolocation' })
	.then(result => {
		if (result.state === "denied") {
			console.log("Cannot get location; absolute orientation unavailable.")
		} else {

			navigator.geolocation.getCurrentPosition(position => {
				lat = position.coords.latitude;
				lng = position.coords.longitude;
				// Show a map centered at latitude / longitude.
				//console.log( "LOCATION", latitude, longitude);
				//latitude = latitude*-2;
				//if( lat> 0 ) lat += 90;
				//else lat = 180+lat
				lnQTangPlane.set({ lat: Math.PI * ((lat)) / 180, lng: Math.PI * (lng) / 180 }).update();
			});

		}
	})



if (document.fullscreenEnabled && document.fullScreenElement) {

	screen.orientation.lock("portrait")
}
else console.log("User must manually lock screen; or pick fullscreen element.");


let sensor = null;

//const sensor2 = new RelativeOrientationSensor({frequency:1});
//const mat4 = new Float32Array(16);
let was = Date.now();
function initSensor() {
	state.useMouse = true;
	if( "undefined" !== typeof AbsoluteOrientationSensor ) {
		sensor = new AbsoluteOrientationSensor({ frequency: 60 });
	}else {
		console.log( "What does this browser have?" );
	}
	if( sensor ) {
		sensor.onerror = event => {
			console.log(event.error.name, event.error.message);
			state.useMouse = true;
		}
		//sensor2.onerror = event => console.log(event.error.name, event.error.message);
		sensor.onreading = () => {
			//sensor.populateMatrix(mat4);
			const q = sensor.quaternion;
			//const lnQ = new lnQuat();
			lnQuat.quatToLogQuat({ x: q[0], y: q[1], z: q[2], w: q[3] }, lnQWorld);
			lnQWorldInv.x = -lnQWorld.x;
			lnQWorldInv.y = -lnQWorld.y;
			lnQWorldInv.z = -lnQWorld.z;
			lnQWorldInv.dirty = true;
	        
			//lnQWorld2.set( lnQTangPlane ).freeSpin( lnQWorld );
			lnQWorld2.set(lnQTangPlane).freeSpin(lnQWorldInv, true);
			//lnQWorld.freeSpin( lnQTangPlane , true);
	        
			//console.log( "A Sensor?", q, lnQWorld );
			//sensor.stop();
		};
		/*
		sensor2.onreading = () => {
				 //sensor.populateMatrix(mat4);
				 const q =  sensor2.quaternion;
				 //const lnQ = new lnQuat();
				 lnQuat.quatToLogQuat( {x:q[0], y:q[1], z:q[2], w:q[3] }, lnQWorld2 );
				 console.log( "B Sensor?", Date.now() - was, q, lnQWorld2 );
				 //was = Date.now();
			  //  sensor.stop();
			  };
  */

		sensor.start();
	}
	//sensor2.start();

}


if (navigator.permissions) {
	Promise.all(
		[navigator.permissions.query({ name: "accelerometer" }),
		navigator.permissions.query({ name: "magnetometer" }),
		navigator.permissions.query({ name: "gyroscope" })])
		.then(results => {
			if (results.every(
				result => result.state === "granted")) {
				initSensor();
			} else {
				console.log("Permission to use sensor was denied.");
			}
		}).catch(err => {
			console.log("Integration with Permissions API is not enabled, still try to start app.");
			initSensor();
		});
} else {
	console.log("No Permissions API, still try to start app.");
	initSensor();
}


function handler(e) {
	const rot = { a: e.alpha, b: e.beta, c: e.gamma, f: e.absolute };
	if (logged < 3) {

		console.log("First Rotation:", logged, rot);
		if (!logged) window.addEventListener("unload", () => {
			console.log("Last rotation:", view.physics.worldOrientation);
		})
		logged++;
	}
	if (logged)
		view.physics.worldOrientation = rot;
	// alpha is degrees around face up
	// c is tilt left/right face up
	// beta is tilt forward backward with face up
	//   0 is flat face up  (left/right and foward backward)
	//   
	/*        
	The DeviceOrientationEvent.alpha value represents the motion of the device around the z axis,
	 represented in degrees with values ranging from 0 (inclusive) to 360 (exclusive).
	The DeviceOrientationEvent.beta value represents the motion of the device around the x axis, 
	represented in degrees with values ranging from -180 (inclusive) to 180 (exclusive). 
	This represents a front to back motion of the device.
	The DeviceOrientationEvent.gamma value represents the motion of the device around the y axis, 
	represented in degrees with values ranging from -90 (inclusive) to 90 (exclusive). 
	This represents a left to right motion of the device
	*/
	//        console.log( "device orientation eent:", rot );
	//	console.log( "device orientation eent:", e );
}

function handler2(e) {
	//rotationRate: DeviceMotionEventRotationRate {alpha: 0.30000000000000004, beta: -0.1, gamma: -0.1}
	const accel = e.acceleration;
	const accelg = e.accelerationIncludingGravity;
	const rotate = e.rotationRate;

	if( !view ) 
	view.physics.world.gravity.set(-accelg.x, -accelg.y, -accelg.z);

	// z + is gravity down. face up
	// y + is gravity down top up
	// x + is gravity side left up
	//	console.log( "motion:", accel, accelg, rotate );
	//  compass = e.webkitCompassHeading || Math.abs(e.alpha - 360);
	//  compassCircle.style.transform = `translate(-50%, -50%) rotate(${-compass}deg)`;
}



class Physics {
	world = new CANNON.World();

	floorShape = new CANNON.Plane()
	floorBody = new CANNON.Body({ mass: 0 });

	floorShape2 = new CANNON.Plane()
	floorBody2 = new CANNON.Body({ mass: 0 });
	floorShape3 = new CANNON.Plane()
	floorBody3 = new CANNON.Body({ mass: 0 });
	floorShape4 = new CANNON.Plane()
	floorBody4 = new CANNON.Body({ mass: 0 });
	floorShape5 = new CANNON.Plane()
	floorBody5 = new CANNON.Body({ mass: 0 });
	floorShape6 = new CANNON.Plane()
	floorBody6 = new CANNON.Body({ mass: 0 });

	dies = [];
	worldOrigin = new CANNON.Vec3();
	worldOrientation = { a: 0, b: 0, c: 0 };
	constructor() {
		this.world.gravity.set(0, 0, 0);

		this.floorBody.addShape(this.floorShape)
		this.floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
		this.world.addBody(this.floorBody)

		this.floorBody2.addShape(this.floorShape)
		this.floorBody2.quaternion.setFromEuler(Math.PI / 2, 0, 0);
		this.floorBody2.position.set(0, 0.16, 0);
		this.world.addBody(this.floorBody2)


		this.floorBody3.addShape(this.floorShape)
		this.floorBody3.position.set(0.05, 0, 0);
		this.floorBody3.quaternion.setFromEuler(0, -Math.PI / 2, 0);
		this.world.addBody(this.floorBody3)

		this.floorBody4.addShape(this.floorShape)
		this.floorBody4.position.set(-0.05, 0, 0);
		this.floorBody4.quaternion.setFromEuler(0, Math.PI / 2, 0);
		this.world.addBody(this.floorBody4)

		this.floorBody5.addShape(this.floorShape)
		this.floorBody5.position.set(0, 0, -0.125);
		this.floorBody5.quaternion.setFromEuler(0, 0, 0);
		this.world.addBody(this.floorBody5)

		this.floorBody6.addShape(this.floorShape)
		this.floorBody6.position.set(0, 0, 0);
		this.floorBody6.quaternion.setFromEuler(0, Math.PI, 0);
		this.world.addBody(this.floorBody6)


		for (var i = 0; i < 2; i++) {
			const cubeShape = new CANNON.Box(new CANNON.Vec3(0.005, 0.005, 0.005))
			const cubeBody = new CANNON.Body({ mass: 0.01 })
			cubeBody.addShape(cubeShape)
			cubeBody.position.set(0, 0.01 * (5 + i * 2), -0.0625)

			this.dies.push(cubeBody);
			this.world.addBody(cubeBody)

		}



	}

	animate(delta) {
		this.world.step(delta);

	}

}


class Viewer {

	physics = new Physics();
	scene = new THREE.Scene();

	dies = [];

	was = 0;
	self = null;
	notself_shape = null;
	notself = new THREE.Object3D();

	direction_shape = null;
	direction = new THREE.Object3D();


	rotation_shape = null;
	rotation = new THREE.Object3D();

	right_shape = null;
	right = new THREE.Object3D();
	up_shape = null;
	up = new THREE.Object3D();
	forward_shape = null;
	forward = new THREE.Object3D();


	normTextures = [];diffuseTextures=[];specTextures=[];
	lnQ0 = null;
	lnQ = new lnQuat();

	tick = 0;

	constructor() {

window.addEventListener("deviceorientation", handler, true);
window.addEventListener("devicemotion", handler2, true);


		this.initThree();

		this.normTextures.push(loader.load("images/normal.die.5.png"));  // east side (looks west)
		this.normTextures.push(loader.load("images/normal.die.2.png"));  // west side (looks east)
		this.normTextures.push(loader.load("images/normal.die.3.png"));  // NORTH   (looks south)
		this.normTextures.push(loader.load("images/normal.die.4.png"));   // SOUTH   (looks north)
		this.normTextures.push(loader.load("images/normal.die.1.png"));   // local UP   (looking down)
		this.normTextures.push(loader.load("images/normal.die.6.png"));   // local DOWN
		this.diffuseTextures.push(loader.load("images/diffuse.die.5.png"));  // east side (looks west)
		this.diffuseTextures.push(loader.load("images/diffuse.die.2.png"));  // west side (looks east)
		this.diffuseTextures.push(loader.load("images/diffuse.die.3.png"));  // NORTH   (looks south)
		this.diffuseTextures.push(loader.load("images/diffuse.die.4.png"));   // SOUTH   (looks north)
		this.diffuseTextures.push(loader.load("images/diffuse.die.1.png"));   // local UP   (looking down)
		this.diffuseTextures.push(loader.load("images/diffuse.die.6.png"));   // local DOWN

		this.specTextures.push(loader.load("images/spec.die.5.png"));  // east side (looks west)
		this.specTextures.push(loader.load("images/spec.die.2.png"));  // west side (looks east)
		this.specTextures.push(loader.load("images/spec.die.3.png"));  // NORTH   (looks south)
		this.specTextures.push(loader.load("images/spec.die.4.png"));   // SOUTH   (looks north)
		this.specTextures.push(loader.load("images/spec.die.1.png"));   // local UP   (looking down)
		this.specTextures.push(loader.load("images/spec.die.6.png"));   // local DOWN




		for (var i = 0; i < 100; i++) {

			const G = 4;
const iscal = 0.1;
			// Cube
			const y = i*iscal-Math.sqrt(G)*Math.atan((i*iscal+1)/Math.sqrt(G))+Math.sqrt(G)*Math.atan(1/Math.sqrt(G));

			const z2 = G/((i*iscal+1)*(i*iscal+1)) +0.2;
			const z = G/((i*iscal+1)) +0.2;

			const cubeGeometry = new THREE.TorusGeometry(0.1*z, 0.004, 12, 24)

			//const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 })

			const cubeMaterials = new THREE.MeshPhongMaterial({ color: 0x999999 });
			const ringMesh = new THREE.Mesh(cubeGeometry, cubeMaterials)
ringMesh.quaternion.set(  Math.sin(Math.PI/4), 0,0,Math.cos( Math.PI/4) );
//	ringMesh.position.x = -0.01*i;
	ringMesh.position.x = 0.1;
	ringMesh.position.y = y*0.01/iscal;
	ringMesh.position.z = -1.5;
	ringMesh.position.z = -1.5 - y*0.01;
			//cubeMaterial.normalMap = this.normTextures[5];

			//cubeMesh.castShadow = true

			this.scene.add(ringMesh)
		}



		for (var i = 0; i < 2; i++) {

			// Cube
			const cubeGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01, 1, 1)
			//const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 })

			const cubeMaterials = this.normTextures.map((tex,i) => new THREE.MeshPhongMaterial({ color: 0x999999, normalMap: tex, map:this.diffuseTextures[i], specularMap:this.specTextures[i] }));
			const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials)

			//cubeMaterial.normalMap = this.normTextures[5];

			cubeMesh.castShadow = true
			this.dies.push(cubeMesh)
			this.scene.add(cubeMesh)
		}

/*
		for (var i = 0; i < 40; i++) {

			const G = 4;
const iscal = 0.1;
			// Cube
			const y = i*iscal-Math.sqrt(G)*Math.atan((i*iscal+1)/Math.sqrt(G))+Math.sqrt(G)*Math.atan(1/Math.sqrt(G));

			const z = G/((i*iscal+1)*(i*iscal+1)) +1;

			const cubeGeometry = new THREE.TorusGeometry(0.1*z, 0.004, 12, 24)

			//const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 })

			const cubeMaterials = new THREE.MeshPhongMaterial({ color: 0x999999 });
			const ringMesh = new THREE.Mesh(cubeGeometry, cubeMaterials)
ringMesh.quaternion.set(  Math.sin(Math.PI/4), 0,0,Math.cos( Math.PI/4) );
//	ringMesh.position.x = -0.01*i;
	ringMesh.position.x = 0.1;
	ringMesh.position.y = y*0.03/iscal;
	ringMesh.position.z = -1.5;
	ringMesh.position.z = -1.5 - y*0.01;
			//cubeMaterial.normalMap = this.normTextures[5];

			//cubeMesh.castShadow = true

			this.scene.add(ringMesh)
		}

*/
		{

			// Cube
			const cubeGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01, 1, 1)
			//const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 })

//			const cubeMaterials = this.normTextures.map(tex => new THREE.MeshPhongMaterial({ color: 0x990000, normalMap: tex }));
			const cubeMaterials = this.normTextures.map((tex,i) => new THREE.MeshPhongMaterial({ color: 0x990000, normalMap: tex, map:this.diffuseTextures[i], specularMap:this.specTextures[i] }));
			const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials)

			//cubeMaterial.normalMap = this.normTextures[5];

			cubeMesh.castShadow = true
			this.rotation_shape = cubeMesh;
			this.rotation.add(cubeMesh);
			this.rotation.position.x = 0.02;
			this.scene.add(this.rotation);
		}


		{

			// Cube
			const cubeGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01, 1, 1)
			//const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 })

			//const cubeMaterials = this.normTextures.map(tex => new THREE.MeshPhongMaterial({ color: 0x009900, normalMap: tex }));
			const cubeMaterials = this.normTextures.map((tex,i) => new THREE.MeshPhongMaterial({ color: 0x009900, normalMap: tex, map:this.diffuseTextures[i], specularMap:this.specTextures[i] }));
			const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials)

			//cubeMaterial.normalMap = this.normTextures[5];

			cubeMesh.castShadow = true
			this.right_shape = cubeMesh;
			this.right.add(cubeMesh);
			//this.right.position.y = 0.02;
			this.scene.add(this.right);
		}

		{

			// Cube
			const cubeGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01, 1, 1)
			//const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 })

			const cubeMaterials = this.normTextures.map((tex,i) => new THREE.MeshPhongMaterial({ color: 0x000099, normalMap: tex, map:this.diffuseTextures[i], specularMap:this.specTextures[i] }));
			const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials)

			//cubeMaterial.normalMap = this.normTextures[5];

			cubeMesh.castShadow = true
			this.up_shape = cubeMesh;
			this.up.add(cubeMesh);
			//  this.up.position.y = 0.02;
			this.scene.add(this.up);
		}

		{

			// Cube
			const cubeGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01, 1, 1)
			//const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 })

			const cubeMaterials = this.normTextures.map((tex,i) => new THREE.MeshPhongMaterial({ color: 0x990000, normalMap: tex, map:this.diffuseTextures[i], specularMap:this.specTextures[i] }));
			const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials)

			//cubeMaterial.normalMap = this.normTextures[5];

			cubeMesh.castShadow = true
			this.forward_shape = cubeMesh;
			this.forward.add(cubeMesh);
			// this.forward.position.y = 0.02;
			this.scene.add(this.forward);
		}


		{

			// Cube
			const cubeGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01 * 2.5, 1, 1)
			//const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 })

			const cubeMaterials = this.normTextures.map((tex,i) => new THREE.MeshPhongMaterial({ color: 0x009900, normalMap: tex, map:this.diffuseTextures[i], specularMap:this.specTextures[i] }));
			const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials)

			//cubeMaterial.normalMap = this.normTextures[5];

			cubeMesh.castShadow = true
			this.direction_shape = cubeMesh;
			this.direction.add(cubeMesh);
			this.direction.position.y = 0.005;
			this.scene.add(this.direction);
		}



		{

			// Cube
			const cubeGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01, 1, 1)
			//const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 })

			const cubeMaterials = this.normTextures.map((tex,i) => new THREE.MeshPhongMaterial({ color: 0x999999, normalMap: tex, map:this.diffuseTextures[i], specularMap:this.specTextures[i] }));
			const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials)

			//cubeMaterial.normalMap = this.normTextures[5];

			cubeMesh.castShadow = true
			this.notself_shape = cubeMesh;
			this.notself.add(cubeMesh);
			this.notself.position.y = 0.02;
			this.scene.add(this.notself);
		}

		{

			// Cube
			const cubeGeometry = new THREE.BoxBufferGeometry(0.01, 0.01, 0.01, 1, 1)
			//const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 })

			const cubeMaterials = this.normTextures.map(tex => new THREE.MeshPhongMaterial({ color: 0x999999, normalMap: tex }));
			const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterials)

			//cubeMaterial.normalMap = this.normTextures[5];
			//cubeMesh.position.y = 0.08;

			cubeMesh.castShadow = true
			this.self = cubeMesh;
			this.scene.add(cubeMesh)
		}

	}

	initThree() {
		// Camera
		const camTripod = new THREE.Object3D();
		const camera = this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.0005, 100)
		camera.position.set(0, 0.08, 0.3)

		//camTripod.add( camera );

		// Scene
		const scene = this.scene = new THREE.Scene()
		scene.fog = new THREE.Fog(0x000000, 500, 1000)

		const parent = document.createElement( "div" );
		parent.style.width = "100vw";
		parent.style.height="100vh";
		parent.style.position="absolute";

		
		document.body.appendChild(parent );
		// Renderer
		const renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true })
		renderer.setSize(window.innerWidth, window.innerHeight)
		renderer.setClearColor(scene.fog.color)

		renderer.outputEncoding = THREE.sRGBEncoding

		renderer.shadowMap.enabled = true
		renderer.shadowMap.type = THREE.PCFSoftShadowMap

		this.controls = new NaturalCamera( camera, parent )
		this.controls.enable();

		{
			const canvas = renderer.domElement;
			//makeControls( canvas );
			parent.appendChild( canvas );
			const c = makeControls( parent );
			canvas.style.position = "absolute";
			state.frame = canvas;
			//c. canvas.addEventListener("touchstart",touchStart );
			c.camPin.addEventListener("touchstart", touchStart, { passive: true })
			c.camSpin.addEventListener("touchstart", touchStart2, { passive: true })

			function touchStart (evt)  {
				var pRect = state.frame.getBoundingClientRect();
				//state.x = evt.clientX-pRect.left;
				//state.y = evt.clientY-pRect.top;
				state.x = evt.touches[0].clientX - pRect.left;
				state.y = evt.touches[0].clientY - pRect.top;

				// default this to reversing the current look.
				state.lnQCamBias.set(state.lnQCamReal).conjugate().update();
				state.lnQCamOldDel.set( state.lnQCamDel);

				//console.log( "Setting:", ({x:state.lnQCamBias.x,y:state.lnQCamBias.y,z:state.lnQCamBias.z,θ:state.lnQCamBias.θ} ));
				state.cameraPin = true;
			}
			function touchStart2(evt)  {
				var pRect = state.frame.getBoundingClientRect();
				//state.x = evt.clientX-pRect.left;
				//state.y = evt.clientY-pRect.top;
				state.x = evt.touches[0].clientX - pRect.left;
				state.y = evt.touches[0].clientY - pRect.top;

				// default this to reversing the current look.
				state.lnQCamBias.set(state.lnQCamReal).conjugate().update();
				state.lnQCamOldDel.set( state.lnQCamDel);
				state.cameraPinAt.copy( camera.position );
				//console.log( "Setting:", ({x:state.lnQCamBias.x,y:state.lnQCamBias.y,z:state.lnQCamBias.z,θ:state.lnQCamBias.θ} ));
				state.cameraSpin = true;
			}
			c.camPin.addEventListener("touchend", (evt) => {
				//console.log("unpin camera");
				//console.log( "Finally(last del):", ({x:state.lnQCamDel.x,y:state.lnQCamDel.y,z:state.lnQCamDel.z,θ:state.lnQCamDel.θ} ));
				state.cameraPin = false;
				//state.lnQCamDel.x = state.lnQCamDel.y = state.lnQCamDel.z = 0; state.lnQCamDel.dirty = true; state.lnQCamDel.update();
			}, { passive: true });
			c.camSpin.addEventListener("touchend", (evt) => {
				//console.log("unpin camera");
				//console.log( "Finally(last del):", ({x:state.lnQCamDel.x,y:state.lnQCamDel.y,z:state.lnQCamDel.z,θ:state.lnQCamDel.θ} ));
				state.cameraSpin = false;
				const forward = state.lnQCamReal.forward();
				state.cameraAt.x = camera.position.x - 0.25* forward.x;
				state.cameraAt.y = camera.position.y -0.25* forward.y;
				state.cameraAt.z = camera.position.z-0.25* forward.z;
				//state.lnQCamDel.x = state.lnQCamDel.y = state.lnQCamDel.z = 0; state.lnQCamDel.dirty = true; state.lnQCamDel.update();
			}, { passive: true });
			c.camPin.addEventListener("touchmove", (evt) => {

				/*
	 if( state.cameraPin ) {
				evt.preventDefault();
				const points = evt.touches;
				var pRect = state.frame.getBoundingClientRect();
				var x = points[0].clientX - pRect.left;
				var y = points[0].clientY - pRect.top;
				state.frame.style.left =parseInt(state.frame.style.left) + (x-state.x);
				state.frame.style.top= parseInt(state.frame.style.top) +(y-state.y);
				if( state.frame.id ) {
						  localStorage.setItem( state.frame.id + "/x", popup.divFrame.style.left );
						  localStorage.setItem( state.frame.id + "/y", popup.divFrame.style.top );
				}
	 }
	 */
			}, { passive: true })


		}

		function makeControls(parent ) {

			const ControlBox = document.createElement( "div" );
			ControlBox.style.position="relative";
			ControlBox.style.top = 0;
			ControlBox.style.left = "0";
			ControlBox.style.width = "100%";
			ControlBox.style.height = "100%";
			ControlBox.textContent = "";
			ControlBox.style.zIndex = 1;

			parent.appendChild( ControlBox );

			const camPin = document.createElement( "div" );
			camPin.style.position="relative";
			camPin.style.top = 0;
			camPin.style.left = "80%";
			camPin.style.width = "20%";
			camPin.style.height = "20%";
			camPin.textContent = "Pin";
			camPin.style.color = "white";

			ControlBox.appendChild( camPin );

			const camSpin = document.createElement( "div" );
			camSpin.style.position="relative";
			camSpin.style.top = "20%";
			camSpin.style.left = "80%";
			camSpin.style.width = "20%";
			camSpin.style.height = "20%";
			camSpin.textContent = "SPIN";
			camSpin.style.color = "white";

			ControlBox.appendChild( camSpin );

			return {camPin, camSpin}
		}

		document.body.appendChild(renderer.domElement)

		// Stats.js
		//stats = new Stats()
		//document.body.appendChild(stats.dom)

		// Lights
		const ambientLight = new THREE.AmbientLight(0x666666)
		scene.add(ambientLight)

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
		const distance = 20
		directionalLight.position.set(-distance, distance, distance)

		directionalLight.castShadow = true

		directionalLight.shadow.mapSize.width = 2048
		directionalLight.shadow.mapSize.height = 2048

		directionalLight.shadow.camera.left = -distance
		directionalLight.shadow.camera.right = distance
		directionalLight.shadow.camera.top = distance
		directionalLight.shadow.camera.bottom = -distance

		directionalLight.shadow.camera.far = 3 * distance
		directionalLight.shadow.camera.near = distance

		scene.add(directionalLight)

		// Raycaster for mouse interaction
		this.raycaster = new THREE.Raycaster()

		// Floor
		const floorGeometry = new THREE.PlaneBufferGeometry(100, 100, 1, 1)
		floorGeometry.rotateX(-Math.PI / 2)
		const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 })
		const floor = new THREE.Mesh(floorGeometry, floorMaterial)
		floor.receiveShadow = true
		//scene.add(floor)


		// Click marker to be shown on interaction
		const markerGeometry = new THREE.SphereBufferGeometry(0.2, 8, 8)
		const markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 })
		this.clickMarker = new THREE.Mesh(markerGeometry, markerMaterial)
		this.clickMarker.visible = false // Hide it..
		scene.add(this.clickMarker)

		// Movement plane when dragging
		const planeGeometry = new THREE.PlaneBufferGeometry(100, 100)
		const movementPlane = this.movementPlane = new THREE.Mesh(planeGeometry, floorMaterial)
		movementPlane.visible = false // Hide it..
		scene.add(movementPlane)

		//window.addEventListener('resize', onWindowResize)
	}


	animate(now) {
		if (!now) {
			return requestAnimationFrame((a) => this.animate(a));
		}
		let delta;
		if (this.was) {
			now /= 1000;
			delta = now - this.was;
			this.was = now;
		} else {
			this.was = now / 1000;
			delta = 0.001;
		}
		//console.log( "tick?", delta );
		this.physics.animate(delta);
		this.tick += delta;


		// current planet bias
		//const tod = ((360*Date.now()%(24*3600000))/(24*3600*1000));
		//const tod =360* (((Date.now()%60000)/1000)/60) ;
		const tod = 360 * ((Date.now() / 1000) % 60) / 60;
		//lng = (30*this.tick)%360;//0* position.coords.longitude;
		// Show a map centered at latitude / longitude.
		//console.log( "LOCATION", latitude, longitude);
		//latitude = latitude*-2;
		lnQTangPlane.set({ lat: Math.PI * ((lat)) / 180, lng: Math.PI * (tod + lng) / 180 }).conjugate().update();


		/*
		const alpha = this.physics.worldOrientation.a*Math.PI/180
		const beta = this.physics.worldOrientation.b*Math.PI/180
		const gamma = this.physics.worldOrientation.c*Math.PI/180
		this.lnQ.freeSpin(-this.physics.worldOrientation.a*Math.PI/180, {x:0, y:0, z:1} ).update();
		this.lnQ.freeSpin(-this.physics.worldOrientation.b*Math.PI/180, {x:1, y:0, z:0} ).update();
		this.lnQ.freeSpin(-this.physics.worldOrientation.c*Math.PI/180, {x:0, y:1, z:0} ).update();
		*/


		lnQWorld.update();
		if (state.cameraPin) {
			// compute delta, take world, reverse old world, and then inverse to remove from world 
			// and end at state
			state.lnQCamDel.set(lnQWorld).freeSpin(state.lnQCamBias, true).conjugate().update();
			//console.log( "Computing  Del:", ({x:state.lnQCamDel.x,y:state.lnQCamDel.y,z:state.lnQCamDel.z,θ:state.lnQCamDel.θ} ));
		}
		if (state.cameraSpin) {
			// compute delta, take world, reverse old world, and then inverse to remove from world 
			// and end at state
			//state.lnQCamDel.set(lnQWorld).freeSpin(state.lnQCamBias, true).conjugate().update();
			//console.log( "Computing  Del:", ({x:state.lnQCamDel.x,y:state.lnQCamDel.y,z:state.lnQCamDel.z,θ:state.lnQCamDel.θ} ));
		}

		// the realCamera is the world removed by bias.
		state.lnQCamReal.set(lnQWorld).freeSpin(state.lnQCamDel);
  		//console.log( "World:", ({x:lnQWorld.x,y:lnQWorld.y,z:lnQWorld.z,θ:lnQWorld.θ} ));
		//console.log( "currentCam:", ({x:state.lnQCamReal.x,y:state.lnQCamReal.y,z:state.lnQCamReal.z,θ:state.lnQCamReal.θ} ));


		if(state.useMouse) 
			this.controls.update(delta);
			else {
				
		// this follows along with the normal orientation...
		const camup = state.lnQCamReal.forward();
		if( state.cameraSpin ) {
			// don't change the camera position.
			;
		}else
			this.camera.position.set( state.cameraAt.x+ 0.25 * camup.x,state.cameraAt.y+ 0.25 * camup.y, state.cameraAt.z+0.25 * camup.z);
		state.lnQCamReal.exp(this.camera.quaternion);

				
			}
		
//console.log( "camera quat:", this.camera.quaternion )

		const up = { x: 0, y: 0, z: 1 };//lnQWorld.forward();
		const right = { x: 0, y: 1, z: 0 };//lnQWorld.up();
		right.x = -right.x;
		right.y = -right.y;
		right.z = -right.z;
		const forward = { x: 1, y: 0, z: 0 };//lnQWorld.right();

		//this.rotation.position.set( lnQWorld.x*0.01, 0.08+lnQWorld.y*0.01, lnQWorld.z*0.01 );
		//this.rotation.position.set( 3*up.x*0.01, 0.08+3*up.y*0.01, 3*up.z*0.01 );
		this.right.position.set(3 * right.x * 0.01, 3 * right.y * 0.01, 3 * right.z * 0.01);
		this.up.position.set(3 * up.x * 0.01, 3 * up.y * 0.01, 3 * up.z * 0.01);
		this.forward.position.set(3 * forward.x * 0.01, 3 * forward.y * 0.01, 3 * forward.z * 0.01);


		//lnQWorld.update().exp( this.self.quaternion );
		//lnQWorldTmp.set(lnQTangPlane ).freeSpin( lnQWorldInv);//.freeSpin( lnQWorld);

		//this.lnQ.freeSpin( Math.PI/2, {x:1,y:1,z:0});
		//                this.lnQ.update().exp( this.notself.quaternion );
		lnQTangPlane.exp(this.direction.quaternion);
		//lnQWorld.exp( this.direction.quaternion );

		lnQWorldTmp2.set(lnQWorld.update()).freeSpin(lnQTangPlane.update(), true);//.freeSpin( lnQWorld, true );



		lnQWorldTmp.set(0, -(lat + 90) * Math.PI / 180, 90 * Math.PI / 180, (lat) * Math.PI / 180).update();

		//lnQWorldTmp2.set( lnQTangPlane ).spin( lnQWorld.θ, lnQWorld );//.freeSpin( lnQWorld);//.freeSpin(lnQTangPlane, false);//.freeSpin( lnQWorld, true );
		//lnQWorldTmp2.set( lnQWorldInv.update() ).spin(lnQTangPlane.θ, lnQTangPlane);//.freeSpin( lnQWorld, false );

		//lnQTangPlane.exp( this.notself_shape.quaternion );
		lnQWorld.update().exp(this.notself.quaternion);

		// this is relative to tangent, and is additional world translation.... 
		// this is the phone in the local up, where up is defined by lat/long position (and north)
		lnQWorldTmp2.set(lnQWorld.update()).freeSpin(lnQTangPlane);//.freeSpin( lnQWorld, false );
		lnQWorldTmp2.update().exp(this.rotation.quaternion);


		//debugger;
		//this.lnQ.freeSpin( Math.PI/2, {x:1,y:0,z:0 } );
		//this.lnQ.update().exp( this.camera.quaternion );

		const bodies = this.physics.dies;
		const meshes = this.dies;
		// Sync the three.js meshes with the bodies
		for (let i = 0; i !== meshes.length; i++) {

			meshes[i].position.copy(bodies[i].position)
			meshes[i].position.sub(this.physics.worldOrigin);
			bodies[i].quaternion.setQuat(meshes[i].quaternion)
		}

		// Render three.js
		this.renderer.render(this.scene, this.camera)

		return requestAnimationFrame((a) => this.animate(a));
	}

}

const view = new Viewer();

export function go() {

	view.animate();
}
