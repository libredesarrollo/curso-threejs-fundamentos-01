import * as THREE from 'three';

// 1. Scene
const scene = new THREE.Scene();

// 2. Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 7, 9);

// 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// 4. Objects
// Box
const geometry = new THREE.BoxGeometry(4, 4, 4);
const material = new THREE.MeshBasicMaterial({ color: 0x00FF00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
cube.position.x = -5;
cube.rotation.x = Math.PI * 0.5;
scene.add(cube);

// Sphere
const geometrySphera = new THREE.SphereGeometry(2, 32, 32);
const materialSphera = new THREE.MeshBasicMaterial({ color: 0x00FFFF, wireframe: true });
const sphera = new THREE.Mesh(geometrySphera, materialSphera);
scene.add(sphera);

// Plane
const geometryPlane = new THREE.PlaneGeometry(14, 5);
const materialPlane = new THREE.MeshBasicMaterial({ color: 0xFFFF00, wireframe: true });
const plane = new THREE.Mesh(geometryPlane, materialPlane);
plane.rotation.x = Math.PI * -0.5;
plane.position.set(0, -2, 1);
scene.add(plane);

// Helpers
const axes = new THREE.AxesHelper(5);
axes.position.x = 3;
scene.add(axes);

camera.lookAt(cube.position);

// 5. Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 6. Animation Loop
const animate = () => {
    requestAnimationFrame(animate);
    
    // Optional: add some rotation for visual feedback
    cube.rotation.y += 0.01;
    sphera.rotation.y += 0.01;
    
    renderer.render(scene, camera);
};

animate();
