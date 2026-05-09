import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import GUI from 'lil-gui';

// ─────────────────────────────────────────────────────────────────────────────
// ESCENA BASE
// ─────────────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: false }); // Desactivamos nativo para usar FXAA
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ─────────────────────────────────────────────────────────────────────────────
// OBJETOS DE PRUEBA (Geometría con colores vivos para el Bloom)
// ─────────────────────────────────────────────────────────────────────────────
const geo = new THREE.IcosahedronGeometry(1, 15);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00ff88, emissiveIntensity: 2 });
const mesh = new THREE.Mesh(geo, material);
scene.add(mesh);

const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
scene.add(grid);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ff88, 10, 20);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE POST-PROCESAMIENTO
// ─────────────────────────────────────────────────────────────────────────────
const composer = new EffectComposer(renderer);

// 1. Render Pass (El dibujo base)
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// 2. Bloom Pass (Brillo)
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
composer.addPass(bloomPass);

// 3. Glitch Pass (Interferencias)
const glitchPass = new GlitchPass();
glitchPass.enabled = false; // Desactivado por defecto
composer.addPass(glitchPass);

// 4. Film Pass (Grano de película y líneas de scan)
const filmPass = new FilmPass(0.35, 0.025, 648, false);
filmPass.enabled = false;
composer.addPass(filmPass);

// 5. FXAA Pass (Anti-aliasing para suavizar bordes post-pro)
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaaPass);

// ─────────────────────────────────────────────────────────────────────────────
// GUI
// ─────────────────────────────────────────────────────────────────────────────
const gui = new GUI({ title: 'Post-procesamiento' });

const bloomFolder = gui.addFolder('🌟 Bloom (Brillo)');
bloomFolder.add(bloomPass, 'enabled').name('Activar');
bloomFolder.add(bloomPass, 'strength', 0, 5, 0.01).name('Fuerza');
bloomFolder.add(bloomPass, 'radius', 0, 2, 0.01).name('Radio');
bloomFolder.add(bloomPass, 'threshold', 0, 1, 0.01).name('Umbral');

const glitchFolder = gui.addFolder('👾 Glitch (Error)');
glitchFolder.add(glitchPass, 'enabled').name('Activar');
glitchFolder.add(glitchPass, 'goWild').name('Modo Loco');

const filmFolder = gui.addFolder('🎬 Film (Cine)');
filmFolder.add(filmPass, 'enabled').name('Activar');

gui.add(fxaaPass, 'enabled').name('Anti-Aliasing (FXAA)');

// ─────────────────────────────────────────────────────────────────────────────
// RESIZE
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
});

// ─────────────────────────────────────────────────────────────────────────────
// LOOP
// ─────────────────────────────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;

    // IMPORTANTE: Renderizar con el composer, no con el renderer
    composer.render();
}

animate();
