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
  1.2,   // strength
  0.6,   // radius
  0.85   // threshold
);

composer.addPass(bloomPass);

// ================= LIGHT =================
const ambient = new THREE.AmbientLight(0xffffff, 1);

const light = new THREE.PointLight(0xffffff, 5);
light.position.set(-5, 5, 0);

scene.add(ambient);
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
    images:[
        "/textures/keycard_textures1.jpg"
    ],
    glow: 2,
    outlineSize: 1,
    }
};

// ================= OUTLINE FUNCTION =================
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

  // ✅ per-object glow strength
  outlineMat.color.multiplyScalar(glow);

  const outline = new THREE.Mesh(geo, outlineMat);
  outline.scale.set(size, size, size);

  outline.position.copy(center);

  mesh.add(outline);
}

// ================= LOAD MODEL =================
const loader = new GLTFLoader();

    loader.load('/ruins.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(0.1, 0.1, 0.1);

  model.traverse((child) => {
    if (!child.isMesh) return;

    const project = projects[child.name];
    if (!project) return;

    child.userData.project = child.name;

    // Load first image only
    const texture = textureLoader.load(project.images[0]);
    texture.flipY = true;
    
    texture.colorSpace = THREE.SRGBColorSpace;

    child.material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.FrontSide,
    });

    // Save textures array for this mesh
    child.userData.textures = project.images.map(img => textureLoader.load(img));

    // ===== OUTLINE GLOW =====
    // ✅ use per-project values
  addOutline(
    child,
    project.glow || 3,
    project.outlineSize || 1.03
  );
  });

  scene.add(model);
});

// ================= CONTROLS =================
const controls = new PointerLockControls(camera, document.body);

document.addEventListener('click', () => controls.lock());

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
const panel = document.getElementById("projectPanel");
const closeBtn = document.getElementById("closeBtn");
const prevBtn = document.getElementById("prevImage");
const nextBtn = document.getElementById("nextImage");

let currentImageIndex = 0;
let activeProjectName = null;
let autoCycleInterval = null;

// Show image in panel and update 3D texture
function showImage(index) {
  const data = projects[activeProjectName];
  if (!data) return;

  currentImageIndex = (index + data.images.length) % data.images.length;
  projectImageEl.src = data.images[currentImageIndex];

  // Update 3D model texture
  const obj = scene.getObjectByProperty("name", activeProjectName);
  if (obj && obj.isMesh) {
    obj.material.map = obj.userData.textures[currentImageIndex];
    obj.material.needsUpdate = true;
  }
}

const projectImageEl = document.getElementById("projectImage");
// Open project panel
function openProject(name) {
  const data = projects[name];
  if (!data) return;

  stopAutoCycle(); // stop auto cycling while panel is open

  activeProjectName = name;
  currentImageIndex = 0;

  titleEl.textContent = data.title;
  descEl.textContent = data.desc;
  projectImageEl.src = data.images[currentImageIndex];

  panel.style.display = "block";
  controls.unlock();
}

// Close panel
closeBtn.addEventListener("click", () => {
  panel.style.display = "none";
  controls.lock();

  // restart auto cycling
  if (activeProjectName) startAutoCycle(activeProjectName);
});

// Prev/Next buttons
prevBtn.addEventListener("click", () => showImage(currentImageIndex - 1));
nextBtn.addEventListener("click", () => showImage(currentImageIndex + 1));

// ================= AUTO-CYCLE =================
function startAutoCycle(name, delay = 3000) {
  const project = projects[name];
  if (!project || project.images.length < 2) return;

  let index = 0;
  const obj = scene.getObjectByProperty("name", name);

  autoCycleInterval = setInterval(() => {
    index = (index + 1) % project.images.length;

    // Update 3D texture
    if (obj && obj.isMesh) {
      obj.material.map = obj.userData.textures[index];
      obj.material.needsUpdate = true;
    }
  }, delay);
}

function stopAutoCycle() {
  if (autoCycleInterval) {
    clearInterval(autoCycleInterval);
    autoCycleInterval = null;
  }
}

// ================= MOVEMENT =================
const points = [
  { pos: new THREE.Vector3(-2,-1,2.3), rot: new THREE.Euler(0,-1.55,0) },
  { pos: new THREE.Vector3(-0.65,-1,2.3), rot: new THREE.Euler(0,-1.55,0) },
  { pos: new THREE.Vector3(0.8,-1,2.3), rot: new THREE.Euler(0,-1.55,0) },
  { pos: new THREE.Vector3(2.5,-1,2.3), rot: new THREE.Euler(0,-1.55,0) },
  { pos: new THREE.Vector3(4.15,0.5,2.3), rot: new THREE.Euler(0,0,0) }
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
startBtn.addEventListener('click', () => {
  tutorial.style.display = 'none';
  controls.lock();
});

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