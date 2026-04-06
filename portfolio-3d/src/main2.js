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

renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";

document.body.appendChild(renderer.domElement);

// ================= BLOOM =================
const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.1,  // strength
    0.1,  // radius
    0.85  // threshold
);

composer.addPass(bloomPass);

// ================= LIGHT =================
const ambient = new THREE.AmbientLight(0xffffff, 1);
const light = new THREE.PointLight(0xffffff, 5);
light.position.set(-5, 5, 0);

scene.add(ambient, light);

// ================= PROJECT DATA =================
const projects = {
    poster1: {
        title: "Project 2",
        desc: "A Poster wowie",
        image: "/textures/poster1_textures.jpg"
    },
    key_card001: {
        title: "thats me",
        desc: "No it doesn't open anything :("
    }
};

// ================= LOAD MODEL =================
const loader = new GLTFLoader();

loader.load('/ruins.glb', (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.1, 0.1, 0.1);

    model.traverse((child) => {
        if (!child.isMesh) return;

        const project = projects[child.name];

        if (project) {
            child.userData.project = child.name;

            const texture = textureLoader.load(project.image);
            texture.flipY = false;
            texture.colorSpace = THREE.SRGBColorSpace;  // ensures colors look correct

            // Support BOTH versions of Three.js
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.encoding = THREE.sRGBEncoding;

            child.material = new THREE.MeshStandardMaterial({
                map: texture
            });
            child.material.needsUpdate = true;
            //child.material.emissive = new THREE.Color(0xffffff);
            child.material.emissiveIntensity = 0.5;
        }
    });

    scene.add(model);
});

// ================= CONTROLS =================
const controls = new PointerLockControls(camera, document.body);

document.addEventListener('click', () => {
    controls.lock();
});

// ================= RAYCAST =================
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

function findProjectObject(obj) {
    while (obj) {
        if (obj.userData && obj.userData.project) return obj;
        obj = obj.parent;
    }
    return null;
}

// ================= CLICK =================
window.addEventListener('click', () => {
    if (!controls.isLocked) return;

    raycaster.setFromCamera(center, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        const projectObj = findProjectObject(obj);

        if (projectObj) {
            openProject(projectObj.userData.project);
        }
    }
});

// ================= UI =================
const titleEl = document.getElementById("projectTitle");
const descEl = document.getElementById("projectDesc");
const panel = document.getElementById("projectPanel");
const closeBtn = document.getElementById("closeBtn");

function openProject(name) {
    const data = projects[name];
    if (!data) return;

    titleEl.textContent = data.title;
    descEl.textContent = data.desc;
    panel.style.display = "block";

    controls.unlock();
}

closeBtn.addEventListener("click", () => {
    panel.style.display = "none";
    controls.lock();
});

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

function moveTo(index) {
    const target = points[index];

    gsap.to(camera.position, {
        duration: 1,
        x: target.pos.x,
        y: target.pos.y,
        z: target.pos.z,
    });

    gsap.to(camera.rotation, {
        duration: 1,
        x: target.rot.x,
        y: target.rot.y,
        z: target.rot.z,
    });

    currentPoint = index;
}
// ================= Tutorial =================
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