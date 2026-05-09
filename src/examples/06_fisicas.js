import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';
import GUI from 'lil-gui';

// ─────────────────────────────────────────────────────────────────────────────
// MUNDO VISUAL (Three.js)
// ─────────────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 25, 60);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camera.position.set(0, 8, 18);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 2, 0);

// ─── Iluminación ──────────────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far  = 60;
dirLight.shadow.camera.left   = -20;
dirLight.shadow.camera.right  =  20;
dirLight.shadow.camera.top    =  20;
dirLight.shadow.camera.bottom = -20;
scene.add(dirLight);

// ─── Suelo visual ──────────────────────────────────────────────────────────────
const meshSuelo = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
        color:     0x4a7c59,
        roughness: 0.9,
        metalness: 0.1
    })
);
meshSuelo.rotation.x = -Math.PI / 2;
meshSuelo.receiveShadow = true;
scene.add(meshSuelo);

// ─── Paredes visuales de referencia ───────────────────────────────────────────
const matPared = new THREE.MeshStandardMaterial({ color: 0xaaaacc, roughness: 0.8, side: THREE.DoubleSide });
[
    { pos: [0, 3, -15], rot: [0, 0, 0],         size: [30, 6] },
    { pos: [-15, 3, 0], rot: [0, Math.PI / 2, 0], size: [30, 6] },
    { pos: [15, 3, 0],  rot: [0, Math.PI / 2, 0], size: [30, 6] },
].forEach(({ pos, rot, size }) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(...size), matPared);
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.receiveShadow = true;
    scene.add(m);
});

// ─────────────────────────────────────────────────────────────────────────────
// MUNDO FÍSICO (Cannon.js)
// ─────────────────────────────────────────────────────────────────────────────
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase  = new CANNON.SAPBroadphase(world);
world.allowSleep  = true; // Permite que cuerpos estables "duerman" y no se calculen

// ─── Materiales físicos ────────────────────────────────────────────────────────
const matFisicoPlastico = new CANNON.Material('plastico');
const matFisicoHormigon = new CANNON.Material('hormigon');
const matFisicoGoma     = new CANNON.Material('goma');

// ContactMaterials: cómo se comportan al chocar
world.addContactMaterial(new CANNON.ContactMaterial(
    matFisicoPlastico, matFisicoHormigon,
    { friction: 0.3, restitution: 0.5 }
));
world.addContactMaterial(new CANNON.ContactMaterial(
    matFisicoGoma, matFisicoHormigon,
    { friction: 0.5, restitution: 0.85 } // Mucho rebote
));
world.addContactMaterial(new CANNON.ContactMaterial(
    matFisicoPlastico, matFisicoPlastico,
    { friction: 0.4, restitution: 0.4 }
));

// ─── Suelo físico ─────────────────────────────────────────────────────────────
const bodySuelo = new CANNON.Body({ mass: 0, material: matFisicoHormigon });
bodySuelo.addShape(new CANNON.Plane());
bodySuelo.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(bodySuelo);

// ─── Paredes físicas ───────────────────────────────────────────────────────────
function crearParedFisica(pos, rot) {
    const body = new CANNON.Body({ mass: 0, material: matFisicoHormigon });
    body.addShape(new CANNON.Plane());
    body.position.set(...pos);
    body.quaternion.setFromEuler(...rot);
    world.addBody(body);
}
crearParedFisica([0, 0, -15],  [0, 0, 0]);
crearParedFisica([-15, 0, 0],  [0, Math.PI / 2, 0]);
crearParedFisica([15, 0, 0],   [0, -Math.PI / 2, 0]);

// ─────────────────────────────────────────────────────────────────────────────
// GESTIÓN DE PARES VISUAL/FÍSICO
// ─────────────────────────────────────────────────────────────────────────────
const pares = []; // Array de { mesh, body }
const MAX_OBJETOS = 60;

const coloresDisponibles = [
    0xff4400, 0xff00cc, 0x00aaff, 0xffcc00,
    0x00ff66, 0x9900ff, 0xff6600, 0x00ffee
];

function crearCaja(posicion, tamanio = 1) {
    const color = coloresDisponibles[Math.floor(Math.random() * coloresDisponibles.length)];
    const mat   = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
    const mesh  = new THREE.Mesh(new THREE.BoxGeometry(tamanio, tamanio, tamanio), mat);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const hw = tamanio / 2;
    const body = new CANNON.Body({
        mass:     3,
        material: matFisicoPlastico,
        shape:    new CANNON.Box(new CANNON.Vec3(hw, hw, hw)),
        position: new CANNON.Vec3(posicion.x, posicion.y, posicion.z),
        linearDamping:  0.1,
        angularDamping: 0.1
    });

    // Evento de colisión: flash de color en impactos fuertes
    body.addEventListener('collide', (ev) => {
        const vel = ev.contact.getImpactVelocityAlongNormal();
        if (vel > 4) {
            mat.emissive.setHex(0xff2200);
            setTimeout(() => mat.emissive.setHex(0x000000), 180);
        }
    });

    world.addBody(body);
    pares.push({ mesh, body });

    // Eliminar el más antiguo si se supera el límite
    if (pares.length > MAX_OBJETOS) {
        const { mesh: m, body: b } = pares.shift();
        scene.remove(m);
        m.geometry.dispose();
        m.material.dispose();
        world.removeBody(b);
    }
}

function crearEsfera(posicion, radio = 0.5) {
    const color = coloresDisponibles[Math.floor(Math.random() * coloresDisponibles.length)];
    const mat   = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 });
    const mesh  = new THREE.Mesh(new THREE.SphereGeometry(radio, 16, 16), mat);
    mesh.castShadow = true;
    scene.add(mesh);

    const body = new CANNON.Body({
        mass:     2,
        material: matFisicoGoma,
        shape:    new CANNON.Sphere(radio),
        position: new CANNON.Vec3(posicion.x, posicion.y, posicion.z)
    });

    body.addEventListener('collide', (ev) => {
        const vel = ev.contact.getImpactVelocityAlongNormal();
        if (vel > 3) {
            mat.emissive.setHex(0x0044ff);
            setTimeout(() => mat.emissive.setHex(0x000000), 150);
        }
    });

    world.addBody(body);
    pares.push({ mesh, body });

    if (pares.length > MAX_OBJETOS) {
        const { mesh: m, body: b } = pares.shift();
        scene.remove(m);
        world.removeBody(b);
    }
}

// Crear objetos iniciales
for (let i = 0; i < 8; i++) {
    crearCaja(
        new THREE.Vector3(
            (Math.random() - 0.5) * 5,
            10 + i * 1.5,
            (Math.random() - 0.5) * 5
        ),
        0.6 + Math.random() * 0.6
    );
}

// ─── Interacción: clic para lanzar objetos ────────────────────────────────────
let modoLanzamiento = 'caja'; // 'caja' | 'esfera'

renderer.domElement.addEventListener('click', () => {
    const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        12 + Math.random() * 4,
        (Math.random() - 0.5) * 8
    );
    if (modoLanzamiento === 'caja') {
        crearCaja(pos, 0.5 + Math.random() * 0.7);
    } else {
        crearEsfera(pos, 0.3 + Math.random() * 0.4);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GUI
// ─────────────────────────────────────────────────────────────────────────────
const params = {
    gravedad:      -9.82,
    modoLanzamiento: 'caja',
    limpiarTodo() {
        for (const { mesh, body } of pares) {
            scene.remove(mesh);
            world.removeBody(body);
        }
        pares.length = 0;
    },
    lanzarObjeto() {
        const pos = new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            14,
            (Math.random() - 0.5) * 8
        );
        if (params.modoLanzamiento === 'caja') crearCaja(pos);
        else crearEsfera(pos);
    }
};

const gui = new GUI({ title: 'Física Cannon.js' });

gui.add(params, 'gravedad', -20, 0, 0.1)
    .name('Gravedad (m/s²)')
    .onChange((v) => world.gravity.set(0, v, 0));

gui.add(params, 'modoLanzamiento', ['caja', 'esfera'])
    .name('Modo lanzamiento')
    .onChange((v) => { modoLanzamiento = v; });

gui.add(params, 'lanzarObjeto').name('🚀 Lanzar objeto');
gui.add(params, 'limpiarTodo').name('🗑️  Limpiar escena');

gui.add({ objetos: 0 }, 'objetos').name('Objetos activos').listen().disable();
// Actualizar contador dinámicamente
setInterval(() => {
    gui.controllers.find(c => c._name === 'Objetos activos')?._setValue(pares.length);
}, 200);

// ─────────────────────────────────────────────────────────────────────────────
// RESIZE
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────────────────────────────────────
// LOOP DE ANIMACIÓN
// ─────────────────────────────────────────────────────────────────────────────
const reloj = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = reloj.getDelta();

    // 1. Avanzar la simulación física
    world.step(1 / 60, delta, 3);

    // 2. Sincronizar mallas con cuerpos físicos
    for (const { mesh, body } of pares) {
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();
