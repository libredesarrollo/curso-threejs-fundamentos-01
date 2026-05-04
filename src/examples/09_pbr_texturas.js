import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new TrackballControls(camera, renderer.domElement);

// Luces para apreciar el PBR
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight1.position.set(5, 5, 5);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0x00aaff, 1.0);
dirLight2.position.set(-5, 0, 0);
scene.add(dirLight2);

// Objetos PBR
// Esfera 1: Metálica y rugosa
const geometry = new THREE.SphereGeometry(1, 64, 64);
const materialMetal = new THREE.MeshStandardMaterial({
    color: 0xffcc00,      // Dorado
    metalness: 1.0,       // Es completamente metálico
    roughness: 0.3        // Ligeramente pulido
});
const sphere1 = new THREE.Mesh(geometry, materialMetal);
sphere1.position.x = -1.5;
scene.add(sphere1);

// Esfera 2: MeshPhysicalMaterial (Cristal / Plástico transparente)
const materialCristal = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.9,    // Transparencia cristalina
    ior: 1.5,             // Índice de refracción (Vidrio)
    thickness: 1.0,       // Grosor para refracción
    clearcoat: 1.0,       // Barniz extra brillante
    clearcoatRoughness: 0.1
});
const sphere2 = new THREE.Mesh(geometry, materialCristal);
sphere2.position.x = 1.5;
scene.add(sphere2);

// En un proyecto real aquí se cargaría un HDRI usando RGBELoader
// scene.environment = entornoHDR;

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    sphere1.rotation.y += 0.01;
    sphere2.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();
