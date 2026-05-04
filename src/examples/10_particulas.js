import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Fondo negro para resaltar adición lumínica

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new TrackballControls(camera, renderer.domElement);

// --- SISTEMA DE PARTÍCULAS ---
const geometriaParticulas = new THREE.BufferGeometry();
const conteo = 10000;

// Arreglos de datos puros (Float32Array es super rápido)
const arrayPosiciones = new Float32Array(conteo * 3);
const arrayColores = new Float32Array(conteo * 3);

const colorBase = new THREE.Color();

for (let i = 0; i < conteo; i++) {
    const base = i * 3;
    
    // Distribuimos las partículas en una caja de 50x50x50
    arrayPosiciones[base]     = (Math.random() - 0.5) * 50; // X
    arrayPosiciones[base + 1] = (Math.random() - 0.5) * 50; // Y
    arrayPosiciones[base + 2] = (Math.random() - 0.5) * 50; // Z
    
    // Tonos cósmicos (Cyan, Azul, Púrpura)
    colorBase.setHSL(Math.random() * 0.2 + 0.5, 0.8, 0.5);
    arrayColores[base]     = colorBase.r;
    arrayColores[base + 1] = colorBase.g;
    arrayColores[base + 2] = colorBase.b;
}

// Inyectamos a la GPU
geometriaParticulas.setAttribute('position', new THREE.BufferAttribute(arrayPosiciones, 3));
geometriaParticulas.setAttribute('color', new THREE.BufferAttribute(arrayColores, 3));

// Material para partículas (No usamos textura aquí, usamos el punto básico cuadrado o circular)
const materialParticulas = new THREE.PointsMaterial({
    size: 0.2,             // Tamaño en pantalla
    sizeAttenuation: true, // Perspectiva
    vertexColors: true,    // Usar el buffer de color que preparamos
    transparent: true,     
    depthWrite: false,     // Evita z-fighting con muchas partículas cerca
    blending: THREE.AdditiveBlending // Si se solapan, se suman (brillan hacia blanco)
});

// Ensamblar
const sistemaGalaxia = new THREE.Points(geometriaParticulas, materialParticulas);
scene.add(sistemaGalaxia);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Rotar todo el sistema suavemente
    sistemaGalaxia.rotation.y += 0.001;
    sistemaGalaxia.rotation.x += 0.0005;

    // Mutación de vértices individual
    const posiciones = sistemaGalaxia.geometry.attributes.position.array;
    for(let i = 0; i < conteo; i++) {
        // Obtenemos solo la Y (base + 1)
        const indexY = (i * 3) + 1;
        posiciones[indexY] -= 0.05; // Caen como lluvia espacial
        
        if(posiciones[indexY] < -25) {
            posiciones[indexY] = 25; // Reinician arriba
        }
    }
    
    // MUY IMPORTANTE: avisar a Three.js que recalculamos todo en JavaScript
    sistemaGalaxia.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
}

animate();
