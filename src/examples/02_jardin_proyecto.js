import * as THREE from 'three';

// escena - universo
const scene = new THREE.Scene();

// camara u ojo
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 20);
camera.lookAt(scene.position);

// renderizado
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

function createHouse(scene) {
    // Casa
    const houseBaseGeometry = new THREE.CylinderGeometry(2, 2, 3);
    const houseBaseMaterial = new THREE.MeshBasicMaterial({ color: 0xFFEECC });
    const houseBase = new THREE.Mesh(houseBaseGeometry, houseBaseMaterial);

    houseBase.position.y = 1.5;
    houseBase.position.x = 5;
    scene.add(houseBase);

    const houseRoofGeometry = new THREE.ConeGeometry(2.5, 3, 15);
    const houseRoofMaterial = new THREE.MeshBasicMaterial({ color: 0x776600 });
    const houseRoof = new THREE.Mesh(houseRoofGeometry, houseRoofMaterial);

    houseRoof.position.y = 4.5;
    houseRoof.position.x = 5;
    scene.add(houseRoof);
}

function createBar(scene) {
    const barMaterial = new THREE.MeshBasicMaterial({ color: 0x994422 });
    const geometryBarRightLeft = new THREE.BoxGeometry(1, 1, 11);

    const barRight = new THREE.Mesh(geometryBarRightLeft, barMaterial);
    barRight.position.x = 10;
    scene.add(barRight);

    const barLeft = new THREE.Mesh(geometryBarRightLeft, barMaterial);
    barLeft.position.x = -10;
    scene.add(barLeft);

    const geometryBarUpBottom = new THREE.BoxGeometry(21, 1, 1);

    const barUp = new THREE.Mesh(geometryBarUpBottom, barMaterial);
    barUp.position.z = 5;
    scene.add(barUp);

    const barBottom = new THREE.Mesh(geometryBarUpBottom, barMaterial);
    barBottom.position.z = -5;
    scene.add(barBottom);
}

function createFloor(scene) {
    const planeGeometry = new THREE.PlaneGeometry(20, 10);
    const planeMaterial = new THREE.MeshBasicMaterial({
        color: 0x779922,
        wireframe: false
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.y = 0;
    scene.add(plane);
}

function createTree(scene) {
    const trunkGeometry = new THREE.BoxGeometry(1, 8, 1);
    const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x110000 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

    trunk.position.y = 4;
    trunk.position.x = -3;
    scene.add(trunk);

    const fodderGeometry = new THREE.SphereGeometry(4, 32, 32);
    const fodderMaterial = new THREE.MeshBasicMaterial({ color: 0x00AA00 });
    const fodder = new THREE.Mesh(fodderGeometry, fodderMaterial);
    fodder.position.y = 10;
    fodder.position.x = -3;

    scene.add(fodder);
}

// Build Scene
createHouse(scene);
createBar(scene);
createTree(scene);
createFloor(scene);

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animation Loop
const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate();
