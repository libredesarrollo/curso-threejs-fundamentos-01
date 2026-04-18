import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import gsap from 'gsap';
import GUI from 'lil-gui';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 7, 9);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Objects
// Cube
const geometry = new THREE.BoxGeometry(4, 4, 4);
const material = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
const cube = new THREE.Mesh(geometry, material);
cube.position.set(-7, 2, 0);
cube.castShadow = true;
scene.add(cube);

// Sphere
const geometrySphera = new THREE.SphereGeometry(2, 32, 32);
const materialSphera = new THREE.MeshLambertMaterial({ color: 0x00FFFF, wireframe: true });
const sphera = new THREE.Mesh(geometrySphera, materialSphera);
sphera.castShadow = true;
scene.add(sphera);

// Plane
const geometryPlane = new THREE.PlaneGeometry(30, 30);
const materialPlane = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
const plane = new THREE.Mesh(geometryPlane, materialPlane);
plane.rotation.x = Math.PI * -0.5;
plane.position.y = -2;
plane.receiveShadow = true;
scene.add(plane);

// Lights
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xFFFFFF);
spotLight.position.set(10, 50, 10);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// Controls & GUI
const controlsParams = {
    rotationSpeed: 0.03,
    distanceSpeed: 2,
    bouncingSpeed: 0.03,
};

const gui = new GUI();
gui.add(controlsParams, 'rotationSpeed', 0, 0.5);
gui.add(controlsParams, 'distanceSpeed', 0, 8);
gui.add(controlsParams, 'bouncingSpeed', 0, 2);

const trackballControls = new TrackballControls(camera, renderer.domElement);
trackballControls.zoomSpeed = 1.2;

// Animation Variables
let step = 0;
let scale = 1;

// GSAP Color Animation
function animateColorCube() {
    gsap.to(cube.material.color, {
        duration: 1,
        r: Math.random(),
        g: Math.random(),
        b: Math.random(),
        onComplete: animateColorCube
    });
}
animateColorCube();

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Main Loop
const animate = () => {
    requestAnimationFrame(animate);

    trackballControls.update();

    step += controlsParams.bouncingSpeed;
    scale += 0.01;
    if (scale >= 2) scale = 1;

    sphera.position.x = controlsParams.distanceSpeed * Math.sin(step);
    sphera.position.y = controlsParams.distanceSpeed * Math.abs(Math.sin(step));

    cube.rotation.x += controlsParams.rotationSpeed;
    cube.rotation.y += controlsParams.rotationSpeed;
    cube.rotation.z += controlsParams.rotationSpeed;
    cube.scale.set(scale, scale, scale);

    renderer.render(scene, camera);
};

animate();
