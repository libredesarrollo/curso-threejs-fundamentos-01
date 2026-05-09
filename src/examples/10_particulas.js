import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// ─────────────────────────────────────────────────────────────────────────────
// ESCENA BASE
// ─────────────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000005);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 8, 22);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ─────────────────────────────────────────────────────────────────────────────
// TEXTURA PROCEDURAL DE CÍRCULO SUAVE (sin PNG externo)
// ─────────────────────────────────────────────────────────────────────────────
function crearTexturaCirculo(tam = 64) {
    const canvas = document.createElement('canvas');
    canvas.width  = tam;
    canvas.height = tam;
    const ctx  = canvas.getContext('2d');
    const half = tam / 2;
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0,   'rgba(255,255,255,1.0)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1,   'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, tam, tam);
    return new THREE.CanvasTexture(canvas);
}
const texturaCirculo = crearTexturaCirculo();

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA 1: GALAXIA ESPIRAL
// ─────────────────────────────────────────────────────────────────────────────
const params = {
    conteoGalaxia: 15000,
    brazos:        3,
    radio:         10,
    giro:          1.2,
    dispersion:    0.6,
    colorInterior: '#ff8833',
    colorExterior: '#2255ff',
    tamParticula:  0.12
};

let geoGalaxia, puntosGalaxia;

function generarGalaxia() {
    if (puntosGalaxia) {
        geoGalaxia.dispose();
        puntosGalaxia.material.dispose();
        scene.remove(puntosGalaxia);
    }

    const N = params.conteoGalaxia;
    const posArr = new Float32Array(N * 3);
    const colArr = new Float32Array(N * 3);
    const cInt   = new THREE.Color(params.colorInterior);
    const cExt   = new THREE.Color(params.colorExterior);
    const cAux   = new THREE.Color();

    for (let i = 0; i < N; i++) {
        const b     = i * 3;
        const brazo = i % params.brazos;
        const r     = Math.random() * params.radio;
        const spin  = r * params.giro;
        const angle = (brazo / params.brazos) * Math.PI * 2;

        // Dispersión gaussiana aproximada
        const dx = (Math.random() + Math.random() - 1) * params.dispersion * (r / params.radio);
        const dy = (Math.random() + Math.random() - 1) * params.dispersion * 0.25;
        const dz = (Math.random() + Math.random() - 1) * params.dispersion * (r / params.radio);

        posArr[b]     = Math.cos(angle + spin) * r + dx;
        posArr[b + 1] = dy;
        posArr[b + 2] = Math.sin(angle + spin) * r + dz;

        // Color: interior cálido → exterior frío
        cAux.lerpColors(cInt, cExt, r / params.radio);
        colArr[b]     = cAux.r;
        colArr[b + 1] = cAux.g;
        colArr[b + 2] = cAux.b;
    }

    geoGalaxia = new THREE.BufferGeometry();
    geoGalaxia.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geoGalaxia.setAttribute('color',    new THREE.BufferAttribute(colArr, 3));

    const mat = new THREE.PointsMaterial({
        size:            params.tamParticula,
        sizeAttenuation: true,
        vertexColors:    true,
        transparent:     true,
        alphaMap:        texturaCirculo,
        depthWrite:      false,
        blending:        THREE.AdditiveBlending
    });

    puntosGalaxia = new THREE.Points(geoGalaxia, mat);
    scene.add(puntosGalaxia);
}

generarGalaxia();

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA 2: ESTRELLAS DE FONDO (estático)
// ─────────────────────────────────────────────────────────────────────────────
(function crearFondo() {
    const N   = 5000;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 300;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.15, color: 0xffffff,
        transparent: true, alphaMap: texturaCirculo,
        depthWrite: false
    });

    scene.add(new THREE.Points(geo, mat));
})();

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA 3: LLUVIA (animación individual de vértices)
// ─────────────────────────────────────────────────────────────────────────────
const LLUVIA_N  = 3000;
const lluviaPOS = new Float32Array(LLUVIA_N * 3);
const lluviaVEL = new Float32Array(LLUVIA_N);  // Velocidad de caída

for (let i = 0; i < LLUVIA_N; i++) {
    const b = i * 3;
    lluviaPOS[b]     = (Math.random() - 0.5) * 30;
    lluviaPOS[b + 1] = (Math.random() - 0.5) * 20 + 5;
    lluviaPOS[b + 2] = (Math.random() - 0.5) * 30;
    lluviaVEL[i]     = 0.05 + Math.random() * 0.1;
}

const geoLluvia = new THREE.BufferGeometry();
geoLluvia.setAttribute('position', new THREE.BufferAttribute(lluviaPOS, 3));

const matLluvia = new THREE.PointsMaterial({
    size: 0.08, color: 0x88ddff,
    transparent: true, opacity: 0.7,
    depthWrite: false
});

const puntosLluvia = new THREE.Points(geoLluvia, matLluvia);
puntosLluvia.visible = false; // Activar desde GUI
scene.add(puntosLluvia);

// ─────────────────────────────────────────────────────────────────────────────
// GUI
// ─────────────────────────────────────────────────────────────────────────────
const gui = new GUI({ title: '✨ Partículas' });

const galFolder = gui.addFolder('🌌 Galaxia espiral');
galFolder.add(params, 'brazos',    1, 6, 1)          .name('Brazos').onFinishChange(generarGalaxia);
galFolder.add(params, 'radio',     2, 20, 0.5)        .name('Radio').onFinishChange(generarGalaxia);
galFolder.add(params, 'giro',      0, 3, 0.05)        .name('Giro').onFinishChange(generarGalaxia);
galFolder.add(params, 'dispersion',0, 3, 0.05)        .name('Dispersión').onFinishChange(generarGalaxia);
galFolder.add(params, 'tamParticula', 0.02, 0.5, 0.01).name('Tamaño').onFinishChange(generarGalaxia);
galFolder.addColor(params, 'colorInterior').name('Color interior').onFinishChange(generarGalaxia);
galFolder.addColor(params, 'colorExterior').name('Color exterior').onFinishChange(generarGalaxia);

const lluFolder = gui.addFolder('🌧️ Lluvia');
lluFolder.add(puntosLluvia, 'visible').name('Activar lluvia');
lluFolder.add(matLluvia, 'opacity', 0, 1, 0.01).name('Opacidad');
lluFolder.add({ velocidad: 1.0 }, 'velocidad', 0.1, 5, 0.1).name('Velocidad × ').onChange(v => {
    for (let i = 0; i < LLUVIA_N; i++) lluviaVEL[i] = (0.05 + Math.random() * 0.1) * v;
});

// ─────────────────────────────────────────────────────────────────────────────
// RESIZE
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────────────────────────────────────
// LOOP
// ─────────────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const t = clock.getElapsedTime();

    // Rotar la galaxia suavemente
    if (puntosGalaxia) {
        puntosGalaxia.rotation.y = t * 0.05;
    }

    // Animar lluvia (mutación de buffer)
    if (puntosLluvia.visible) {
        const pos = geoLluvia.attributes.position.array;
        for (let i = 0; i < LLUVIA_N; i++) {
            const b = i * 3;
            pos[b + 1] -= lluviaVEL[i];
            if (pos[b + 1] < -5) {
                pos[b + 1] = 15;
            }
        }
        geoLluvia.attributes.position.needsUpdate = true;
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();
