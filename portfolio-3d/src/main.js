import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

console.log("JS is running");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0,1.6,8);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light=new THREE.AmbientLight(0xffffff, 1.5);
scene.add(light);

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


function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();