import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// ─────────────────────────────────────────────────────────────────────────────
// ESCENA BASE
// ─────────────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

// Tone mapping y espacio de color correctos para PBR
renderer.toneMapping          = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure  = 1.2;
renderer.outputColorSpace     = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0.5, 0);

// ─────────────────────────────────────────────────────────────────────────────
// ILUMINACIÓN — Combinación de luces para apreciar el PBR
// ─────────────────────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Luz principal (cálida)
const dirLightA = new THREE.DirectionalLight(0xfff5e0, 3.0);
dirLightA.position.set(5, 8, 5);
dirLightA.castShadow = true;
dirLightA.shadow.mapSize.set(2048, 2048);
scene.add(dirLightA);

// Luz de relleno (fría, desde el lado opuesto)
const dirLightB = new THREE.DirectionalLight(0x88ccff, 1.5);
dirLightB.position.set(-5, 3, -5);
scene.add(dirLightB);

// ─────────────────────────────────────────────────────────────────────────────
// SUELO
// ─────────────────────────────────────────────────────────────────────────────
const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.9, metalness: 0.1 })
);
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
scene.add(suelo);

// ─────────────────────────────────────────────────────────────────────────────
// DEMOSTRACIÓN DE MATERIALES PBR
// Fila de esferas variando roughness y metalness
// ─────────────────────────────────────────────────────────────────────────────
const geoEsfera = new THREE.SphereGeometry(0.6, 64, 64);

// Fila 1: Variando ROUGHNESS (metalness fijo = 1.0 — metálico)
for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshStandardMaterial({
        color:     0xffcc00,
        metalness: 1.0,
        roughness: i / 4  // 0.0 a 1.0
    });
    const mesh = new THREE.Mesh(geoEsfera, mat);
    mesh.position.set(-3 + i * 1.5, 1.8, -2);
    mesh.castShadow = true;
    scene.add(mesh);
}

// Fila 2: Variando METALNESS (roughness fijo = 0.3 — semipulido)
for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshStandardMaterial({
        color:     0xffffff,
        roughness: 0.3,
        metalness: i / 4  // 0.0 a 1.0
    });
    const mesh = new THREE.Mesh(geoEsfera, mat);
    mesh.position.set(-3 + i * 1.5, 0.6, -2);
    mesh.castShadow = true;
    scene.add(mesh);
}

// ─────────────────────────────────────────────────────────────────────────────
// ESFERA METÁLICA PRINCIPAL — Material detallado
// ─────────────────────────────────────────────────────────────────────────────
const materialMetal = new THREE.MeshStandardMaterial({
    color:     0xffcc00,   // Dorado
    metalness: 1.0,
    roughness: 0.15,
    envMapIntensity: 1.5   // Intensidad de las reflexiones del entorno
});

const esferaMetal = new THREE.Mesh(geoEsfera, materialMetal);
esferaMetal.scale.setScalar(1.4);
esferaMetal.position.set(-2.2, 0.9, 1);
esferaMetal.castShadow = true;
scene.add(esferaMetal);

// ─────────────────────────────────────────────────────────────────────────────
// ESFERA DE VIDRIO — MeshPhysicalMaterial
// ─────────────────────────────────────────────────────────────────────────────
const materialVidrio = new THREE.MeshPhysicalMaterial({
    color:      0xffffff,
    metalness:  0,
    roughness:  0,
    // Transmission: transparencia física con refracción real
    transmission:      1.0,
    ior:               1.5,  // Índice de refracción del vidrio
    thickness:         1.2,  // Grosor del volumen
    // Clearcoat: capa de barniz extra
    clearcoat:          1.0,
    clearcoatRoughness: 0.05,
    // Dispersión de color (efecto prisma)
    dispersion: 3.0
});

const esferaVidrio = new THREE.Mesh(geoEsfera, materialVidrio);
esferaVidrio.scale.setScalar(1.4);
esferaVidrio.position.set(0, 0.9, 1);
esferaVidrio.castShadow = true;
scene.add(esferaVidrio);

// ─────────────────────────────────────────────────────────────────────────────
// ESFERA DE TELA — MeshPhysicalMaterial con Sheen
// ─────────────────────────────────────────────────────────────────────────────
const materialTela = new THREE.MeshPhysicalMaterial({
    color:         0x8833aa,
    roughness:     0.9,
    metalness:     0,
    sheen:         1.0,
    sheenRoughness: 0.3,
    sheenColor:    new THREE.Color(0xffffff)
});

const esferaTela = new THREE.Mesh(geoEsfera, materialTela);
esferaTela.scale.setScalar(1.4);
esferaTela.position.set(2.2, 0.9, 1);
esferaTela.castShadow = true;
scene.add(esferaTela);

// ─────────────────────────────────────────────────────────────────────────────
// TOROIDE — Material de clearcoat (barniz automotriz)
// ─────────────────────────────────────────────────────────────────────────────
const materialCoche = new THREE.MeshPhysicalMaterial({
    color:              0xff2200,
    metalness:          0.7,
    roughness:          0.25,
    clearcoat:          1.0,
    clearcoatRoughness: 0.0
});

const toro = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.3, 32, 100),
    materialCoche
);
toro.position.set(0, 0.7, 3);
toro.castShadow = true;
scene.add(toro);

// ─────────────────────────────────────────────────────────────────────────────
// GUI — Control de materiales en tiempo real
// ─────────────────────────────────────────────────────────────────────────────
const gui = new GUI({ title: 'PBR & Texturas' });

const metalFolder = gui.addFolder('🟡 Metal (Dorado)');
metalFolder.addColor({ color: '#ffcc00' }, 'color').name('Color').onChange(v => materialMetal.color.set(v));
metalFolder.add(materialMetal, 'metalness',      0, 1, 0.01).name('Metalness');
metalFolder.add(materialMetal, 'roughness',      0, 1, 0.01).name('Roughness');
metalFolder.add(materialMetal, 'envMapIntensity',0, 3, 0.05).name('Env Intensity');

const vidrioFolder = gui.addFolder('🔵 Vidrio (Physical)');
vidrioFolder.add(materialVidrio, 'transmission',       0, 1, 0.01).name('Transmission');
vidrioFolder.add(materialVidrio, 'ior',                1, 2.5, 0.01).name('IOR');
vidrioFolder.add(materialVidrio, 'thickness',          0, 3, 0.05).name('Thickness');
vidrioFolder.add(materialVidrio, 'clearcoat',          0, 1, 0.01).name('Clearcoat');
vidrioFolder.add(materialVidrio, 'clearcoatRoughness', 0, 1, 0.01).name('Clearcoat Rough');
vidrioFolder.add(materialVidrio, 'dispersion',         0, 10, 0.1).name('Dispersión');

const telaFolder = gui.addFolder('🟣 Tela (Sheen)');
telaFolder.addColor({ color: '#8833aa' }, 'color').name('Color').onChange(v => materialTela.color.set(v));
telaFolder.add(materialTela, 'sheen',          0, 1, 0.01).name('Sheen');
telaFolder.add(materialTela, 'sheenRoughness', 0, 1, 0.01).name('Sheen Roughness');

const lucesFolder = gui.addFolder('💡 Iluminación');
lucesFolder.add(renderer, 'toneMappingExposure', 0, 3, 0.05).name('Exposición');
lucesFolder.add(ambientLight, 'intensity', 0, 2, 0.05).name('Ambient');
lucesFolder.add(dirLightA, 'intensity', 0, 5, 0.1).name('Luz principal');
lucesFolder.add(dirLightB, 'intensity', 0, 5, 0.1).name('Luz relleno');

// ─────────────────────────────────────────────────────────────────────────────
// RESIZE
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});

// ─────────────────────────────────────────────────────────────────────────────
// LOOP
// ─────────────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    esferaMetal.rotation.y = t * 0.5;
    esferaVidrio.rotation.y = t * 0.3;
    esferaTela.rotation.y = t * 0.4;
    toro.rotation.y = t * 0.6;
    toro.rotation.x = Math.sin(t * 0.5) * 0.3;

    controls.update();
    renderer.render(scene, camera);
}

animate();
