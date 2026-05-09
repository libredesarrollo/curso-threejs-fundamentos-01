import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// ─── Escena base ──────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 4, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// Luces
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// Suelo
const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x222244 })
);
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
scene.add(suelo);

// ─── Objeto a animar ──────────────────────────────────────────────────────────
const grupo = new THREE.Group();
scene.add(grupo);

const cuerpo = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 2, 1),
    new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.4 })
);
cuerpo.castShadow = true;
cuerpo.position.y = 1;
grupo.add(cuerpo);

// Cabeza
const cabeza = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x88aaff })
);
cabeza.castShadow = true;
cabeza.position.y = 2.5;
grupo.add(cabeza);

// ─── ANIMATION MIXER ──────────────────────────────────────────────────────────
const mixer = new THREE.AnimationMixer(grupo);

// Helper para aplanar cuaternión en array
function qToArr(q) { return [q.x, q.y, q.z, q.w]; }

// ── Clip 1: Giro en Y (LoopRepeat) ───────────────────────────────────────────
const qA = new THREE.Quaternion().identity();
const qB = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
const qC = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 2);

const clipGiro = new THREE.AnimationClip('Giro', 2, [
    new THREE.QuaternionKeyframeTrack('.quaternion', [0, 1, 2], [
        ...qToArr(qA), ...qToArr(qB), ...qToArr(qC)
    ])
]);

// ── Clip 2: Salto en Y (LoopOnce) ────────────────────────────────────────────
const clipSalto = new THREE.AnimationClip('Salto', 1, [
    new THREE.VectorKeyframeTrack('.position', [0, 0.3, 0.7, 1], [
        0, 0, 0,
        0, 4, 0,
        0, 4, 0,
        0, 0, 0
    ])
]);

// ── Clip 3: Pulso de escala (LoopOnce) ───────────────────────────────────────
const clipPulso = new THREE.AnimationClip('Pulso', 0.5, [
    new THREE.VectorKeyframeTrack('.scale', [0, 0.25, 0.5], [
        1,   1,   1,
        1.5, 1.5, 1.5,
        1,   1,   1
    ])
]);

// ── Clip 4: Sacudida (oscilación en X) ───────────────────────────────────────
const qSac0 = new THREE.Quaternion().identity();
const qSacL = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1),  0.3);
const qSacR = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.3);

const clipSacudida = new THREE.AnimationClip('Sacudida', 0.6, [
    new THREE.QuaternionKeyframeTrack('.quaternion', [0, 0.15, 0.3, 0.45, 0.6], [
        ...qToArr(qSac0), ...qToArr(qSacL), ...qToArr(qSacR),
        ...qToArr(qSacL), ...qToArr(qSac0)
    ])
]);

// ── Crear actions ─────────────────────────────────────────────────────────────
const accionGiro     = mixer.clipAction(clipGiro).setLoop(THREE.LoopRepeat, Infinity);
const accionSalto    = mixer.clipAction(clipSalto).setLoop(THREE.LoopOnce, 1);
const accionPulso    = mixer.clipAction(clipPulso).setLoop(THREE.LoopOnce, 1);
const accionSacudida = mixer.clipAction(clipSacudida).setLoop(THREE.LoopOnce, 1);

accionSalto.clampWhenFinished    = false;
accionPulso.clampWhenFinished    = false;
accionSacudida.clampWhenFinished = false;

// Estado inicial
accionGiro.play();

// ─── Controles de teclado ─────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'Space':
            accionSalto.reset().play();
            break;
        case 'KeyP':
            accionPulso.reset().play();
            break;
        case 'KeyS':
            accionSacudida.reset().play();
            break;
        case 'KeyG':
            accionGiro.paused = !accionGiro.paused;
            break;
    }
});

// Evento finished: log al terminar animación LoopOnce
mixer.addEventListener('finished', (ev) => {
    const nombre = ev.action.getClip().name;
    console.log(`Animacion terminada: ${nombre}`);
});

// ─── GUI ──────────────────────────────────────────────────────────────────────
const gui = new GUI({ title: 'AnimationMixer' });

const params = {
    timeScale: 1.0,
    saltar()    { accionSalto.reset().play(); },
    pulso()     { accionPulso.reset().play(); },
    sacudida()  { accionSacudida.reset().play(); },
    giro:       true
};

gui.add(params, 'timeScale', 0.1, 3, 0.1).name('Velocidad global').onChange(v => {
    mixer.timeScale = v;
});
gui.add(params, 'giro').name('Giro activo').onChange(v => {
    v ? accionGiro.play() : accionGiro.pause();
});
gui.add(params, 'saltar').name('▶ Saltar (Space)');
gui.add(params, 'pulso').name('▶ Pulso (P)');
gui.add(params, 'sacudida').name('▶ Sacudida (S)');

// ─── Resize ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Loop ─────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixer.update(delta);
    controls.update();
    renderer.render(scene, camera);
}

animate();
