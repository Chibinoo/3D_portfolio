import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from "gsap";

// ================= SCENE =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);
const textureLoader = new THREE.TextureLoader();

// ================= CAMERA =================
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-2, -1, 2.3);
camera.rotation.set(0, -1.55, 0);
console.log(camera.position);

// ================= RENDERER =================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.5;
document.body.appendChild(renderer.domElement);

// ================= BLOOM =================
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2,
  0.6,
  0.85
);
composer.addPass(bloomPass);

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
    glow: 4,
    outlineSize: 1.02,
  },
  key_card001: {
    title: "thats me",
    desc: "No it doesn't open anything :(",
    images: [
      "/textures/keycard_textures1.jpg"
    ],
    glow: 2,
    outlineSize: 1,
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

// ================= AUTO CYCLE STORAGE =================
const autoCycles = {};

// ================= LOAD MODEL =================
const loader = new GLTFLoader();

loader.load('/ruins.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(0.1, 0.1, 0.1);

  model.traverse((child) => {
    if (!child.isMesh) return;

    const project = projects[child.name];
    if (!project) return;

    if (!project.images || project.images.length === 0) return;

    child.userData.project = child.name;

    // Load textures
    const textures = project.images.map(img => {
      const tex = textureLoader.load(img);
      tex.flipY = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });

    child.userData.textures = textures;

    // Apply first texture
    child.material = new THREE.MeshStandardMaterial({
      map: textures[0]
    });

    addOutline(child, project.glow || 3, project.outlineSize || 1.03);

    // ✅ Start auto-cycle immediately
    if (textures.length > 1) {
      startAutoCycle(child);
    }
  });

  scene.add(model);
});

// ================= AUTO-CYCLE =================
function startAutoCycle(obj, delay = 3000) {
  if (!obj || !obj.userData.textures) return;

  let index = 0;

  autoCycles[obj.name] = setInterval(() => {
    index = (index + 1) % obj.userData.textures.length;

    obj.material.map = obj.userData.textures[index];
    obj.material.needsUpdate = true;
  }, delay);
}

function stopAutoCycle(name) {
  if (autoCycles[name]) {
    clearInterval(autoCycles[name]);
    delete autoCycles[name];
  }
}

// ================= CONTROLS =================
const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', (e) => {
  // ❌ don't lock if panel is open
  if (panel.classList.contains("active")) return;

  // ❌ don't lock if clicking UI elements
  if (e.target.closest("#projectPanel")) return;
  if (e.target.closest("#overlay")) return;

  controls.lock();
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

// ================= UI =================
const titleEl = document.getElementById("projectTitle");
const descEl = document.getElementById("projectDesc");
const projectImageEl = document.getElementById("projectImage");
const panel = document.getElementById("projectPanel");
const closeBtn = document.getElementById("closeBtn");
const prevBtn = document.getElementById("prevImage");
const nextBtn = document.getElementById("nextImage");

let currentImageIndex = 0;
let activeProjectName = null;

// Show image
function showImage(index) {
  const data = projects[activeProjectName];
  if (!data) return;

  currentImageIndex = (index + data.images.length) % data.images.length;
  projectImageEl.style.opacity = 0;

  setTimeout(() => {
    projectImageEl.src = data.images[currentImageIndex];
    projectImageEl.style.opacity = 1;
  }, 150);

  const obj = scene.getObjectByProperty("name", activeProjectName);
  if (obj) {
    obj.material.map = obj.userData.textures[currentImageIndex];
    obj.material.needsUpdate = true;
  }
}

// Open project
function openProject(name) {
  const data = projects[name];
  const overlay = document.getElementById("overlay");
  if (!data) return;

  stopAutoCycle(name);

  activeProjectName = name;
  currentImageIndex = 0;

  titleEl.textContent = data.title;
  descEl.textContent = data.desc;
  projectImageEl.src = data.images[0];

  panel.classList.add("active");
  overlay.classList.add("active");
  if (controls.isLocked) controls.unlock();
}

// Close panel
closeBtn.addEventListener("click", () => {
  panel.classList.remove("active");
  overlay.classList.remove("active");

  if (activeProjectName) {
    const obj = scene.getObjectByProperty("name", activeProjectName);
    if (obj) startAutoCycle(obj);
  }
});

overlay.addEventListener("click", () => {
  panel.classList.remove("active");
  overlay.classList.remove("active");

  if (activeProjectName) {
    const obj = scene.getObjectByProperty("name", activeProjectName);
    if (obj) startAutoCycle(obj);
  }
});

// Buttons
prevBtn.addEventListener("click", () => showImage(currentImageIndex - 1));
nextBtn.addEventListener("click", () => showImage(currentImageIndex + 1));

// ================= MOVEMENT =================
const points = [
  { pos: new THREE.Vector3(-2, -1, 2.3), rot: new THREE.Euler(0, -1.55, 0) },
  { pos: new THREE.Vector3(-0.65, -1, 2.3), rot: new THREE.Euler(0, -1.55, 0) },
  { pos: new THREE.Vector3(0.8, -1, 2.3), rot: new THREE.Euler(0, -1.55, 0) },
  { pos: new THREE.Vector3(2.5, -1, 2.3), rot: new THREE.Euler(0, -1.55, 0) },
  { pos: new THREE.Vector3(4.15, 0.5, 2.3), rot: new THREE.Euler(0, 0, 0) }
];

let currentPoint = 0;

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") moveTo((currentPoint + 1) % points.length);
  if (e.key === "ArrowLeft") moveTo((currentPoint - 1 + points.length) % points.length);
});

function moveTo(i) {
  const t = points[i];
  gsap.to(camera.position, { duration: 1, ...t.pos });
  gsap.to(camera.rotation, { duration: 1, ...t.rot });
  currentPoint = i;
}

// ================= TUTORIAL =================
const startBtn = document.getElementById("startBtn");
const tutorial = document.getElementById("tutorial");

if (startBtn && tutorial) {
  startBtn.addEventListener('click', () => {
    tutorial.style.display = 'none';
    controls.lock();
  });
}

// ================= RESIZE =================
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  composer.setSize(w, h);
});

// ================= LOOP =================
function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
animate();