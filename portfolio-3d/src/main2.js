import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from "gsap";

import { initLogin } from "./login.js";
import { mix } from 'three/src/nodes/TSL.js';

// ================= DOM REFERENCES =================
const panel = document.getElementById("projectPanel");
const overlay = document.getElementById("overlay");
const hoverLabel = document.getElementById("hoverLabel");
let lastHovered=null;

// ================= CAMERA =================
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(-2, -1, 2.3);

// ================= SCENE =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
const textureLoader = new THREE.TextureLoader();
const controls = new PointerLockControls(camera, document.body);
let loginFinished = false;
let sdCard = null;
let sdCardTarget = null;


// ================= RENDERER =================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ================= CONTROLS =================
document.addEventListener('click', (e) => {
  if (!loginFinished) return;

  if (panel.classList.contains("active")) return //prevent conflicts

  // ignore UI
  if (e.target.closest("#tutorial")) return;
  if (e.target.closest("#projectPanel")) return;
  if (e.target.closest("#overlay")) return;

  // ONLY lock if not already locked
  if (!controls.isLocked) {
    controls.lock();
  }
});

// ================= POST =================
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

composer.addPass(
  new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.2,
    0.6,
    0.85
  )
);

// ================= LIGHT =================
scene.add(new THREE.AmbientLight(0xffffff, 1));

const light = new THREE.PointLight(0xffffff, 5);
light.position.set(-5, 5, 0);
scene.add(light);

// ================= PROJECT DATA =================
const projects = {
  poster1: {
    title: "Project 2",
    desc: "A Poster wowie",
    images: [
      "/textures/poster1_textures.jpg",
      "/textures/poster2_textures.jpg"
    ],
    glow: 2,
    outlineSize: 1.02,
  },
  key_card001: {
    title: "thats me",
    desc: "No it doesn't open anything :(",
    images: [
      "/textures/keycard_textures1.jpg"
    ],
    glow: 1.5,
    outlineSize: 1,
  },
  Hooodie:{
    title:"thats a hoodie",
    desc:"it keeps you warm",
    images:[
      "/textures/hoodie_textures.jpg"
    ],
    glow:1,
    outlineSize:1.05,
  },
  screen:{
    title: "thats an app",
    desc: "helps with mental health",
    images:[
      "/textures/phone_texture.jpg"
    ],
    /*glow:1,
    outlineSize:1.05,*/
  },
  phone:{
    title: "thats an app",
    desc: "helps with mental health",
    images:[
      ""
    ],
    glow:2,
    outlineSize:1.05,
  },
  book:{
    title:"thats me too",
    desc:" thats a lot to read",
    images:[
      "/textures/about me 2.png",
      "/textures/about me.png"
    ],
    glow:2,
    outlineSize:1.05,
  },
  deck:{
    title: "thats a skateboard",
    desc: "its fun",
    images:[
    "/textures/skateboard_back.png",
    "/textures/skateboard_front.png"
    ],
    glow:1.5,
    outlineSize:0.75,
  }
};

// ================= OUTLINE =================
function addOutline(mesh, glow = 3, size = 1.03) {
  const geo = mesh.geometry.clone();
  geo.computeBoundingBox();

  const center = new THREE.Vector3();
  geo.boundingBox.getCenter(center);
  geo.translate(-center.x, -center.y, -center.z);

  const outlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    side: THREE.BackSide
  });

  outlineMat.color.multiplyScalar(glow);

  const outline = new THREE.Mesh(geo, outlineMat);
  outline.scale.set(size, size, size);
  outline.position.copy(center);

  mesh.add(outline);
}

// ================= AUTO CYCLE =================
const autoCycles = {};

function startAutoCycle(obj, delay = 3000) {
  if (!obj?.userData?.textures) return;

  let i = 0;

  autoCycles[obj.name] = setInterval(() => {
    i = (i + 1) % obj.userData.textures.length;
    obj.material.map = obj.userData.textures[i];
    obj.material.needsUpdate = true;
  }, delay);
}
function stopAutoCycle(name) {
  if (autoCycles[name]) {
    clearInterval(autoCycles[name]);
    delete autoCycles[name];
  }
}

// ================= MODEL =================
const loader = new GLTFLoader();

let mixer = null;
let insertAction = null;
let modelReady = false;

loader.load('/ruins.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(0.1, 0.1, 0.1);

  scene.add(model); // REQUIRED

  mixer = new THREE.AnimationMixer(model);

  const clip = THREE.AnimationClip.findByName(
    gltf.animations,
    "InsertSd"
  );

  if (clip) {
    insertAction = mixer.clipAction(clip);
    insertAction.setLoop(THREE.LoopOnce);
    insertAction.clampWhenFinished = true;
  }

  model.traverse((child) => {
    if (!child.isMesh) return;

    if (child.name === "sd_card") sdCard = child;
    if (child.name === "sd_card_target") sdCardTarget = child;

    const project = projects[child.name];
    if (!project) return;

    const textures = project.images.map(img => {
      const tex = textureLoader.load(img);
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });

    child.userData.project = child.name;
    child.userData.textures = textures;

    child.material = new THREE.MeshStandardMaterial({
      map: textures[0]
    });

    addOutline(child, project.glow, project.outlineSize);

    if (textures.length > 1) startAutoCycle(child);
  });

  modelReady = true;
});

// ================= TUTORIAL =================
const tutorial = document.getElementById("tutorial");
const startBtn = document.getElementById("startBtn");

if (startBtn) {
  startBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation(); // IMPORTANT

    tutorial.classList.add("hidden");

    // unlock pointer lock safely
    if (controls && controls.isLocked) {
      controls.unlock();
    }

    // re-lock after UI update
    requestAnimationFrame(() => {
      controls.lock();
    });
  });
}

// ================= LOGIN =================
tutorial.classList.add("hidden");
initLogin({
  sdCard,
  sdCardTarget,
  controls,

  startMainExperience: () => {
    loginFinished = true;

    const wait = setInterval(() => {
      if (!modelReady || !insertAction) return;

      clearInterval(wait);

      insertAction.reset();
      insertAction.play();

      const duration = insertAction.getClip().duration || 1.5;

      setTimeout(() => {
        tutorial.classList.remove("hidden");
        moveTo(0);
      }, duration * 1000);

    }, 50);
  }
});

// ================= RAYCAST =================
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

function findProjectObject(obj) {
  while (obj) {
    if (obj.userData?.project) return obj;
    obj = obj.parent;
  }
  return null;
}

window.addEventListener('click', () => {
  if (!controls.isLocked) return;

  raycaster.setFromCamera(center, camera);
  const hits = raycaster.intersectObjects(scene.children, true);

  if (hits.length > 0) {
    const obj = findProjectObject(hits[0].object);
    if (obj) openProject(obj.userData.project);
  }
});

// ================= MOVEMENT (YOUR SYSTEM) =================
const points = [
  {pos: new THREE.Vector3(-2.00, -1.00, 2.30),look: new THREE.Vector3(3.00, -1.09, 2.37)},//start
  {pos: new THREE.Vector3(-0.95, -1.00, 2.30),look: new THREE.Vector3(4.35, -1.14, 2.29)},//key card
  {pos: new THREE.Vector3(0.60, -1.00, 2.30),look: new THREE.Vector3(5.80, -0.86, 2.32)},//poster
  {pos: new THREE.Vector3(2.50, -1.00, 2.30),look: new THREE.Vector3(6.93, 1.31, 2.46)},//stairs
  {pos: new THREE.Vector3(4.15, 0.50, 2.30),look: new THREE.Vector3(4.15, 0.50, -2.70)},//coridor
  {pos: new THREE.Vector3(4.15, 0.50, 2),look: new THREE.Vector3(4.15, 0.50, -2.70)},//hoodie
  {pos: new THREE.Vector3(4.15, 0.50, 0.50),look: new THREE.Vector3(4.15, 0.50, -2.70)},//phone
  {pos: new THREE.Vector3(4.15, 0.50, 0.10),look: new THREE.Vector3(-0.84, 0.20, 0.23)},//coridor end
  {pos: new THREE.Vector3(2.00, 0.50, 0.10),look: new THREE.Vector3(-3.00, 0.50, 0.00)},//halle halfe
  {pos: new THREE.Vector3(0, 0.5, 0.1),look: new THREE.Vector3(-3.00, 0.50, -0.00)},//hall end 
  {pos: new THREE.Vector3(-2.00, 0.50, 0.10),look: new THREE.Vector3(3.00, 0.38, 0.06)},//dome
  {pos: new THREE.Vector3(-2.00, 0.50, 0.10),look: new THREE.Vector3(0.95, 4.53, 0.25)},//dome up
  {pos: new THREE.Vector3(-5.00, 0.25, 1.50),look: new THREE.Vector3(-0.19, -0.19, 0.19)}//overview
];

let currentPoint = 0;

// KEYBOARD NAVIGATION
document.addEventListener("keydown", (e) => {
  if (!loginFinished) return;

  if (e.key === "ArrowRight") {
    moveTo((currentPoint + 1) % points.length);
  }

  if (e.key === "ArrowLeft") {
    moveTo((currentPoint - 1 + points.length) % points.length);
  }
});

// MOVE FUNCTION
const currentLookTarget = new THREE.Vector3();

function moveTo(i) {
  const t = points[i];

  gsap.to(camera.position, {
    x: t.pos.x,
    y: t.pos.y,
    z: t.pos.z,
    duration: 1.4,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.lookAt(currentLookTarget);
    }
  });

  gsap.to(currentLookTarget, {
    x: t.look.x,
    y: t.look.y,
    z: t.look.z,
    duration: 1.2,
    ease: "power2.inOut"
  });

  currentPoint = i;
}

// relock AFTER movement (must be user-triggered → so delay is fine here)
setTimeout(() => {
  // ❗ do NOT force lock → just allow next click to lock
}, 1200);

// ================= PROJECT PANEL =================
const titleEl = document.getElementById("projectTitle");
const descEl = document.getElementById("projectDesc");
const projectImageEl = document.getElementById("projectImage");

const closeBtn = document.getElementById("closeBtn");
const prevBtn = document.getElementById("prevImage");
const nextBtn = document.getElementById("nextImage");

let currentImageIndex = 0;
let activeProjectName = null;

//  SHOW IMAGE 
function showImage(index) {
  const data = projects[activeProjectName];
  if (!data) return;

  currentImageIndex = (index + data.images.length) % data.images.length;

  projectImageEl.style.opacity = 0;

  setTimeout(() => {
    const img = data.images[currentImageIndex];
    projectImageEl.src = typeof img === "string" ? img : img.url;
    projectImageEl.style.opacity = 1;
  }, 150);

  const obj = scene.getObjectByProperty("name", activeProjectName);
  if (obj) {
    obj.material.map = obj.userData.textures[currentImageIndex];
    obj.material.needsUpdate = true;
  }
}

//  OPEN
function openProject(name) {
  const data = projects[name];
  if (!data) return;

  stopAutoCycle(name);

  activeProjectName = name;
  currentImageIndex = 0;

  titleEl.textContent = data.title;
  descEl.textContent = data.desc;

  const firstImg = data.images[0];
  projectImageEl.src = typeof firstImg === "string" ? firstImg : firstImg.url;

  panel.classList.add("active");
  overlay.classList.add("active");

  if (controls.isLocked) controls.unlock();
}

//  CLOSE 
function closeProjectPanel(e) {
  if (e) e.stopPropagation(); // 🔥 prevent global click conflicts

  panel.classList.remove("active");
  overlay.classList.remove("active");

  if (activeProjectName) {
    const obj = scene.getObjectByProperty("name", activeProjectName);
    if (obj) startAutoCycle(obj);
  }

  // 🔥 relock immediately (no extra click needed)
  setTimeout(() => {
    controls.lock();
  }, 50);
}

//  EVENTS
closeBtn.addEventListener("click", closeProjectPanel);
overlay.addEventListener("click", closeProjectPanel);

prevBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  showImage(currentImageIndex - 1);
});

nextBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  showImage(currentImageIndex + 1);
});

// ================= PRINT CAM POSITION =================
document.addEventListener("keydown", (e) => {
  if (e.key === "p") {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);

    const look = camera.position.clone().add(dir.multiplyScalar(5));

    console.log(`
{
  pos: new THREE.Vector3(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}),
  look: new THREE.Vector3(${look.x.toFixed(2)}, ${look.y.toFixed(2)}, ${look.z.toFixed(2)})
},`);
  }
});

// ================= LOOP =================
const clock = new THREE.Clock();

function updateHoverLabel() {
  if (!controls.isLocked) {
    hoverLabel.style.opacity = 0;
    lastHovered = null;
    return;
  }

  raycaster.setFromCamera(center, camera);
  const hits = raycaster.intersectObjects(scene.children, true);

  if (hits.length > 0) {
    const obj = findProjectObject(hits[0].object);

    if (obj && obj.userData?.project) {
      if (lastHovered === obj) return;

      lastHovered = obj;

      const data = projects[obj.userData.project];

      hoverLabel.textContent = data?.title || obj.name;
      hoverLabel.style.opacity = 1;
      return;
    }
  }

  // nothing hit → hide cleanly
  lastHovered = null;
  hoverLabel.style.opacity = 0;
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  updateHoverLabel();

  composer.render();
}
animate();

// ================= RESIZE =================
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  composer.setSize(w, h);
});