import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new TrackballControls(camera, renderer.domElement);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Crear un objeto para animar
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// --- ANIMATION MIXER ---
// Creamos una animación de rotación usando KeyframeTracks simulando 
// lo que traería un archivo .glb exportado por Blender.

// 1. Array de tiempos en segundos (0 a 2 segs)
const times = [0, 1, 2];

// 2. Valores para cada tiempo (Cuaterniones para rotación)
const q_inicio = new THREE.Quaternion().identity();
const q_medio = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const q_fin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2);

const values = [
    q_inicio.x, q_inicio.y, q_inicio.z, q_inicio.w,
    q_medio.x, q_medio.y, q_medio.z, q_medio.w,
    q_fin.x, q_fin.y, q_fin.z, q_fin.w
];

// 3. Crear el Track
const trackRotacion = new THREE.QuaternionKeyframeTrack('.quaternion', times, values);

// 4. Crear el Clip de animación agrupando tracks
const clipGirar = new THREE.AnimationClip('GiroCompleto', 2, [trackRotacion]);

// 5. Instanciar el Mixer y la Action
let mixer = new THREE.AnimationMixer(mesh);
let action = mixer.clipAction(clipGirar);
action.play(); // Iniciar reproducción

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Ciclo
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const delta = clock.getDelta();
    
    // Actualizar el AnimationMixer obligatoriamente
    if(mixer) {
        mixer.update(delta);
    }

    renderer.render(scene, camera);
}

animate();
