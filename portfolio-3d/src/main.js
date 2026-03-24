import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import gsap from "gsap";

console.log("JS is running");

//scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

//movement
const points = [
  new THREE.Vector3(0,1.6,5),
  new THREE.Vector3(5,1.6,0),
  new THREE.Vector3(-5,1.6,0),
  new THREE.Vector3(0,1.6,-5)
];

let currentPoint=0;

//keyboard 
document.addEventListener("keydown", (e)=>{
  console.log("Key pressed:", e.key);

  if(e.key==="ArrowRight"){
    moveTo((currentPoint+1)%points.length);
  }

  if(e.key==="ArrowLeft"){
    moveTo((currentPoint-1+points.length)%points.length);
  }
})

//camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0,1.6,8);

//renderer
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

//light
const light=new THREE.AmbientLight(0xffffff, 1.5);
scene.add(light);

//load model
const loader=new GLTFLoader();
loader.load('/ruins.glb',(gltf)=>{
  const model=gltf.scene;
  model.scale.set(0.1, 0.1, 0.1)

  scene.add(model);

  console.log("Model loaded", model);
},
undefined,
(error)=>{
  console.error("Error loading model:", error);
}
);

//controls
const controls = new PointerLockControls(camera, document.body);

document.addEventListener('click', () => {
  controls.lock();
});

function moveTo(index){
  console.log("moving to:", index);

  const target=points[index];

  gsap.to(camera.position, {
    duration:1,
    x: target.x,
    y: target.y,
    z: target.z,
  });
  currentPoint=index;
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();