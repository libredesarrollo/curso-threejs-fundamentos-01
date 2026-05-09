import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GUI from 'lil-gui';

// ─────────────────────────────────────────────────────────────────────────────
// ESCENA BASE
// ─────────────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(5, 5, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ─────────────────────────────────────────────────────────────────────────────
// ILUMINACIÓN
// ─────────────────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// Suelo de referencia
const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// ─────────────────────────────────────────────────────────────────────────────
// CARGA DE MODELOS 3D
// ─────────────────────────────────────────────────────────────────────────────
const loadingManager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(loadingManager);

// Simulación de carga (en un proyecto real usarías una URL a un .glb)
// Como no tenemos un asset físico garantizado en este entorno, 
// crearemos un placeholder visual y explicaremos el código de carga real.

const gui = new GUI({ title: 'Carga de Modelos' });
const status = { progress: 'Esperando...' };
gui.add(status, 'progress').name('Estado Carga').listen();

loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
    status.progress = `Iniciando: ${itemsLoaded}/${itemsTotal}`;
};

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    status.progress = `Cargando: ${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
};

loadingManager.onLoad = () => {
    status.progress = '¡Completado!';
    console.log('Todos los recursos cargados correctamente.');
};

loadingManager.onError = (url) => {
    status.progress = 'Error en carga';
    console.error('Error cargando:', url);
};

/* 
// EJEMPLO DE CÓDIGO REAL (Comentado para evitar errores de archivo no encontrado)
gltfLoader.load(
    '/assets/modelos/mi_personaje.glb',
    (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(model);
    }
);
*/

// Placeholder para demostrar la posición donde iría el modelo
const placeholder = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0xff0000, wireframe: true })
);
placeholder.position.y = 1;
scene.add(placeholder);

// ─────────────────────────────────────────────────────────────────────────────
// LOOP
// ─────────────────────────────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
