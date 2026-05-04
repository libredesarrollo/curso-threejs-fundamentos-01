import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import * as CANNON from 'cannon-es';

// --- MUNDO VISUAL (Three.js) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Cielo azul claro

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new TrackballControls(camera, renderer.domElement);

// Luces
const ambientLight = new THREE.AmbientLight(0x404040); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// Geometría visual del suelo
const geometriaPlano = new THREE.PlaneGeometry(30, 30);
const materialPlano = new THREE.MeshStandardMaterial({ color: 0x555555 });
const meshSuelo = new THREE.Mesh(geometriaPlano, materialPlano);
meshSuelo.rotation.x = -Math.PI / 2;
meshSuelo.receiveShadow = true;
scene.add(meshSuelo);


// --- MUNDO FÍSICO (Cannon.js) ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Gravedad terrestre
world.broadphase = new CANNON.SAPBroadphase(world);

// Materiales Físicos
const materialPlastico = new CANNON.Material('plastico');
const materialHormigon = new CANNON.Material('hormigon');

const plasticoHormigonContacto = new CANNON.ContactMaterial(
    materialPlastico,
    materialHormigon,
    {
        friction: 0.1,
        restitution: 0.7 // Rebote
    }
);
world.addContactMaterial(plasticoHormigonContacto);

// Suelo físico
const shapeSuelo = new CANNON.Plane();
const bodySuelo = new CANNON.Body({
    mass: 0, // Masa 0 = Estático
    shape: shapeSuelo,
    material: materialHormigon
});
bodySuelo.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(bodySuelo);

// Array para mantener la correspondencia visual/física
const objetosParaActualizar = [];

// Función para crear cajas que caen
function crearCajaMagica(posicion) {
    // 1. Visual
    const width = 1;
    const height = 1;
    const depth = 1;
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({ 
        color: Math.random() * 0xffffff 
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.copy(posicion);
    scene.add(mesh);

    // 2. Físico (medio-extremo en Cannon.js)
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({
        mass: 5,
        position: new CANNON.Vec3(posicion.x, posicion.y, posicion.z),
        shape: shape,
        material: materialPlastico
    });
    
    // Escuchamos choques
    body.addEventListener('collide', (evento) => {
        const velocidadImpacto = evento.contact.getImpactVelocityAlongNormal();
        if(velocidadImpacto > 3) {
            // Un golpe fuerte
            mat.emissive.setHex(0xff0000);
            setTimeout(() => { mat.emissive.setHex(0x000000); }, 200);
        }
    });

    world.addBody(body);

    objetosParaActualizar.push({ mesh, body });
}

// Crear unas cuantas cajas apiladas
for(let i=0; i<10; i++){
    crearCajaMagica(new THREE.Vector3((Math.random() - 0.5) * 2, 10 + i * 1.5, (Math.random() - 0.5) * 2));
}

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Ciclo de animación
const reloj = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const deltaTime = reloj.getDelta();

    // 1. Avanzar la física
    world.step(1 / 60, deltaTime, 3);

    // 2. Sincronizar el mundo visual con el físico
    for (const objeto of objetosParaActualizar) {
        objeto.mesh.position.copy(objeto.body.position);
        objeto.mesh.quaternion.copy(objeto.body.quaternion);
    }

    renderer.render(scene, camera);
}

animate();
