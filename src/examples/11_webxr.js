import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

// --- CONFIGURACIÓN BÁSICA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x505050); // Entorno gris para VR

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
// En WebXR, la posición de la cámara suele ser sobreescrita por las gafas, 
// pero en PC simulada la colocamos en una altura promedio.
camera.position.set(0, 1.6, 3); 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// 1. Activar soporte para XR en el motor de render
renderer.xr.enabled = true; 
document.body.appendChild(renderer.domElement);

// 2. Insertar botón para entrar a VR (Esto lo exige la W3C)
document.body.appendChild(VRButton.createButton(renderer));

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// Geometría visual: Una mesa interactiva
const mesa = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.1, 1),
    new THREE.MeshStandardMaterial({ color: 0x8B4513 })
);
mesa.position.set(0, 0.8, -1); // Delante de nosotros a la altura de la cintura
scene.add(mesa);

const cubo = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
cubo.position.set(0, 0.95, -1);
scene.add(cubo);

// --- CONTROLADORES VR ---
// controller 0 es normalmente la mano dominante, controller 1 la otra
const controladorIzq = renderer.xr.getController(0);
const controladorDer = renderer.xr.getController(1);

scene.add(controladorIzq);
scene.add(controladorDer);

// Visualización básica de mandos (ya que son invisibles por defecto)
const geometriaMando = new THREE.CylinderGeometry(0.02, 0.02, 0.15);
geometriaMando.rotateX(Math.PI / 2); // Orientar el cilindro como si lo tuviéramos agarrado
const materialMando = new THREE.MeshStandardMaterial({ color: 0xeeeeee });

const meshMandoIzq = new THREE.Mesh(geometriaMando, materialMando);
controladorIzq.add(meshMandoIzq);

const meshMandoDer = new THREE.Mesh(geometriaMando, materialMando);
controladorDer.add(meshMandoDer);

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 3. Ciclo de animación XR
// JAMÁS usar requestAnimationFrame en VR, siempre usar setAnimationLoop del renderer
renderer.setAnimationLoop(() => {
    // Animación simple del cubo mientras está en la mesa
    cubo.rotation.x += 0.01;
    cubo.rotation.y += 0.01;

    renderer.render(scene, camera);
});
