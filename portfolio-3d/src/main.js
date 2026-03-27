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
  {//start
  pos: new THREE.Vector3(-2,-1,2.3),
  rot: new THREE.Euler(0,-1.55,0)
  },
  {//about me key card
  pos: new THREE.Vector3(-0.65,-1,2.3),
  rot: new THREE.Euler(0,-1.55,0)
  },
  {//poster 1
  pos: new THREE.Vector3(0.8,-1,2.3),
  rot: new THREE.Euler(0,-1.55,0)
  },
  {//stairs
  pos: new THREE.Vector3(2.5,-1,2.3),
  rot: new THREE.Euler(0,-1.55,0)
  },
  {//after stairs
  pos: new THREE.Vector3(4.15,0.5,2.3),
  rot: new THREE.Euler(0,0,0)
  },
  {//
  pos: new THREE.Vector3(4.15,0.5,0.1),
  rot: new THREE.Euler(0,1.55,0)
  },
  {//
  pos: new THREE.Vector3(2,0.5,0.1),
  rot: new THREE.Euler(0,1.55,0)
  },
  {//dome
  pos: new THREE.Vector3(-2,0.5,0.1),
  rot: new THREE.Euler(0,-1.55,0)
  },
  {//end
  pos: new THREE.Vector3(-2,0.5,0.1),
  rot: new THREE.Euler(1.55,-0.6,1.55)
  },
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

camera.position.set(-2,-1,2.3);// left right, up down, forwoard back
camera.rotation.set(0,-1.55,0);

//renderer
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.width = "100vw";
renderer.domElement.style.height = "100vh";
renderer.domElement.style.zIndex = "1";
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

//light
const light1=new THREE.AmbientLight(0xffffff, 1.5);

const light2=new THREE.PointLight(0xffffff, 5.5);
  light2.position.set(-5,5,0.1);
  light2.castShadow = true;

  light2.shadow.mapSize.width = 1024;
  light2.shadow.mapSize.height = 1024;

  light2.shadow.camera.near = 0.5;
  light2.shadow.camera.far = 50;

scene.add(light1, light2);

//shadow
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap;

//load model
const loader=new GLTFLoader();
loader.load('/ruins.glb',(gltf)=>{
  const model=gltf.scene;
  model.scale.set(0.1, 0.1, 0.1)

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);

  console.log("Model loaded", model);
},
undefined,
(error)=>{
  console.error("Error loading model:", error);
});

//raycast
const center=new THREE.Vector2(0,0);
const raycaster=new THREE.Raycaster();

//walking controls
const controls = new PointerLockControls(camera, document.body);

document.addEventListener('click', () => {
  controls.lock();
});

//project details
const projects = {
  poster1: {
    title: "Project 2",
    desc: "A Poster wowie"
  },
  key_card001: {
    title: "thats me",
    desc: "No it dosen't open anythink :("
  }
};

// Grab DOM elements
const titleEl = document.getElementById("projectTitle");
const descEl = document.getElementById("projectDesc");
const panel = document.getElementById("projectPanel");
const closeBtn = document.getElementById("closeBtn");

// Raycaster setup
//const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Click event
window.addEventListener("click", (event) => {
  // Only check clicks when pointer is locked
  if (!controls.isLocked) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const obj = intersects[0].object;

    // Check if object has a project linked
    if (projects[obj.name]) {
      openProject(obj.name);
    }
  }
});

// Open project panel
function openProject(name) {
  const data = projects[name];
  if (!data) return;

  titleEl.textContent = data.title;
  descEl.textContent = data.desc;

  panel.style.display = "block";

  // Unlock pointer so user can click buttons
  controls.unlock();
}

// Close button
closeBtn.addEventListener("click", () => {
  panel.style.display = "none";

  // Lock pointer again for movement
  controls.lock();
});

function moveTo(index){
  console.log("moving to:", index);

  const target=points[index];

  gsap.to(camera.position, {
    duration:1,
    x: target.pos.x,
    y: target.pos.y,
    z: target.pos.z,
  });
  gsap.to(camera.rotation, {
    duration:1,
    x: target.rot.x,
    y: target.rot.y,
    z: target.rot.z,
  });

  currentPoint=index;
}

//object interaction
window.addEventListener('click',()=>{
  if(!controls.isLocked)return;
  
  raycaster.setFromCamera(center, camera);

  const intersect=raycaster.intersectObjects(scene.children, true);

  if(intersect.length>0){
    const obj=intersect[0].object;
    //console.log("Hit:", obj.name);
    openProject(obj.name);
  }
});

//tutorial logic
startBtn.addEventListener('click', () => {
  tutorial.style.display = 'none';
  controls.lock();
});

//resize
window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//animater
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  //console.log(camera.rotation);
}

animate();