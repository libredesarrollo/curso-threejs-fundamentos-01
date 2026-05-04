import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

// Setup basic scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 8);

const renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialias false because we use SMAAPass
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new TrackballControls(camera, renderer.domElement);

// Objects
const group = new THREE.Group();
scene.add(group);

const geometry = new THREE.TorusKnotGeometry(1.5, 0.4, 100, 16);
const material = new THREE.MeshStandardMaterial({ 
    color: 0x00ffaa, 
    emissive: 0x00ffaa, 
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.8
});
const mesh = new THREE.Mesh(geometry, material);
group.add(mesh);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// 1. Instanciar el compositor pasándole nuestro WebGLRenderer original
const composer = new EffectComposer(renderer);

// 2. Crear el RenderPass base y añadirlo al compositor
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// 3. Efecto Bloom (Resplandor)
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,  // strength
    0.4,  // radius
    0.85  // threshold
);
composer.addPass(bloomPass);

// 4. Glitch Pass (comentado por defecto para no ser molesto, puedes descomentarlo)
// const glitchPass = new GlitchPass();
// composer.addPass(glitchPass);

// 5. Anti-Aliasing (SMAA)
const smaaPass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
composer.addPass(smaaPass);

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

// Main Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    group.rotation.x += 0.005;
    group.rotation.y += 0.01;

    // AHORA hacemos composer.render() en lugar de renderer.render()
    composer.render();
}

animate();
