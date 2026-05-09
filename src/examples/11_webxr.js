import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// ─────────────────────────────────────────────────────────────────────────────
// ESCENA BASE
// ─────────────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x606060);
scene.fog = new THREE.Fog(0x606060, 5, 20);

// En WebXR la cámara es controlada por las gafas.
// Aquí la posicionamos para la vista de escritorio (simulación sin gafas).
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 4); // 1.6m = altura de ojos promedio

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

// ── PASO 1: Habilitar WebXR ───────────────────────────────────────────────────
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');

document.body.appendChild(renderer.domElement);

// ── PASO 2: Botón de entrada VR (exigido por W3C) ────────────────────────────
document.body.appendChild(VRButton.createButton(renderer));

// Listeners de sesión XR
renderer.xr.addEventListener('sessionstart', () => {
    console.log('Sesión VR iniciada');
});
renderer.xr.addEventListener('sessionend', () => {
    console.log('Sesión VR terminada');
});

// ─────────────────────────────────────────────────────────────────────────────
// ILUMINACIÓN
// ─────────────────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

const hemiLight = new THREE.HemisphereLight(0x88aacc, 0x445566, 0.8);
scene.add(hemiLight);

// ─────────────────────────────────────────────────────────────────────────────
// ENTORNO — Suelo y paredes
// ─────────────────────────────────────────────────────────────────────────────
// Suelo
const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.9 })
);
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
scene.add(suelo);

// Rejilla de referencia visual
const grid = new THREE.GridHelper(20, 20, 0x444466, 0x333355);
grid.position.y = 0.001;
scene.add(grid);

// ─────────────────────────────────────────────────────────────────────────────
// OBJETOS INTERACTIVOS
// ─────────────────────────────────────────────────────────────────────────────
// Mesa
const mesa = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.05, 1),
    new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 })
);
mesa.position.set(0, 0.75, -1.5);
mesa.castShadow = true;
mesa.receiveShadow = true;
scene.add(mesa);

// Patas de la mesa
[[-0.9, -1.4], [0.9, -1.4], [-0.9, -0.6], [0.9, -0.6]].forEach(([x, z]) => {
    const pata = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.7, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x5c3010 })
    );
    pata.position.set(x, 0.375, z);
    scene.add(pata);
});

// Objetos agarrables sobre la mesa
const objetos = [];
const colores = [0xff4400, 0x00aaff, 0x00ff88, 0xffcc00, 0xcc00ff];

colores.forEach((color, i) => {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 16, 16),
        new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.5 })
    );
    mesh.position.set(-0.8 + i * 0.4, 0.86, -1.5);
    mesh.castShadow = true;
    scene.add(mesh);
    objetos.push(mesh);
});

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLADORES VR
// Dos espacios por mano: Target Ray (puntero) + Grip (modelo visual)
// ─────────────────────────────────────────────────────────────────────────────
const controllerModelFactory = new XRControllerModelFactory();
const raycasterVR = new THREE.Raycaster();
const tempMatrix  = new THREE.Matrix4();

let objetoAgarrado = null;

function crearControlador(indice) {
    // Target Ray Space — para raycasting (punta del puntero)
    const controller = renderer.xr.getController(indice);

    // Rayo visual
    const rayoGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]);
    const rayo = new THREE.Line(
        rayoGeo,
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
    );
    rayo.scale.z = 3;
    controller.add(rayo);

    // Eventos
    controller.addEventListener('selectstart', () => {
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        raycasterVR.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycasterVR.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

        const hits = raycasterVR.intersectObjects(objetos, false);
        if (hits.length > 0) {
            objetoAgarrado = hits[0].object;
            controller.attach(objetoAgarrado); // Adjuntar al mando = agarrar
        }
    });

    controller.addEventListener('selectend', () => {
        if (objetoAgarrado) {
            scene.attach(objetoAgarrado); // Devolver a la escena = soltar
            objetoAgarrado = null;
        }
    });

    controller.addEventListener('connected', (e) => {
        console.log(`Controlador ${e.data.handedness} conectado`);
    });

    scene.add(controller);

    // Grip Space — para el modelo visual del mando
    const grip = renderer.xr.getControllerGrip(indice);
    grip.add(controllerModelFactory.createControllerModel(grip));
    scene.add(grip);

    return { controller, grip };
}

const { controller: ctrl0 } = crearControlador(0); // Mano izquierda
const { controller: ctrl1 } = crearControlador(1); // Mano derecha

// ─────────────────────────────────────────────────────────────────────────────
// MARCADOR DE TELEPORTACIÓN
// ─────────────────────────────────────────────────────────────────────────────
const markerTeleport = new THREE.Mesh(
    new THREE.CircleGeometry(0.25, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.6, depthTest: false })
);
markerTeleport.visible = false;
scene.add(markerTeleport);

const raycasterTeleport = new THREE.Raycaster();

// ─────────────────────────────────────────────────────────────────────────────
// RESIZE
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────────────────────────────────────
// LOOP DE ANIMACIÓN XR
// OBLIGATORIO: usar setAnimationLoop, NUNCA requestAnimationFrame para VR
// ─────────────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let tiempo = 0;

renderer.setAnimationLoop((timestamp, frame) => {
    const delta = clock.getDelta();
    tiempo += delta;

    // Animar los objetos sobre la mesa (excepto si están agarrados)
    objetos.forEach((obj, i) => {
        if (obj.parent === scene) {
            obj.position.y = 0.86 + Math.sin(tiempo * 2 + i) * 0.03;
            obj.rotation.y += 0.01;
        }
    });

    // Hit test de teleportación: proyectar rayo desde ctrl1 al suelo
    if (ctrl1) {
        const mat = new THREE.Matrix4();
        mat.identity().extractRotation(ctrl1.matrixWorld);
        raycasterTeleport.ray.origin.setFromMatrixPosition(ctrl1.matrixWorld);
        raycasterTeleport.ray.direction.set(0, -0.5, -1).normalize().applyMatrix4(mat);

        const hits = raycasterTeleport.intersectObject(suelo);
        if (hits.length > 0) {
            markerTeleport.visible = true;
            markerTeleport.position.copy(hits[0].point);
            markerTeleport.position.y += 0.002;
        } else {
            markerTeleport.visible = false;
        }
    }

    renderer.render(scene, camera);
});
