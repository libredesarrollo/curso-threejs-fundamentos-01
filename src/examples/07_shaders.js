import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new TrackballControls(camera, renderer.domElement);

// Uniforms
const misUniforms = {
    u_tiempo: { value: 0.0 },
    u_resolucion: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_colorPrimario: { value: new THREE.Color(0x00ffff) }
};

// Shader Material
const materialAvanzado = new THREE.ShaderMaterial({
    uniforms: misUniforms,
    side: THREE.DoubleSide,
    wireframe: false,
    vertexShader: `
        uniform float u_tiempo;
        varying vec2 vUv;

        void main() {
            vUv = uv;
            
            vec3 posAlterada = position;
            
            // Efecto de bandera o mar ondulado
            posAlterada.z += sin(posAlterada.x * 3.0 + u_tiempo) * 0.5;
            posAlterada.z += cos(posAlterada.y * 2.0 + u_tiempo * 1.5) * 0.2;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(posAlterada, 1.0);
        }
    `,
    fragmentShader: `
        uniform float u_tiempo;
        uniform vec3 u_colorPrimario;
        varying vec2 vUv;
        
        void main() {
            // Patrón de rayas psicodélico
            float patron = sin(vUv.y * 40.0 + u_tiempo * 10.0);
            
            // Interpolar entre un gris oscuro y el color primario
            vec3 colorFinal = mix(vec3(0.05), u_colorPrimario, step(0.0, patron));
            
            gl_FragColor = vec4(colorFinal, 1.0);
        }
    `
});

// Geometría con alta densidad para que las olas sean suaves
const geometry = new THREE.PlaneGeometry(10, 10, 64, 64);
const mesh = new THREE.Mesh(geometry, materialAvanzado);
mesh.rotation.x = -Math.PI / 2; // Acostar como un mar
scene.add(mesh);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    misUniforms.u_resolucion.value.set(window.innerWidth, window.innerHeight);
});

// Ciclo de animación
const reloj = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Actualizar el tiempo en la GPU
    materialAvanzado.uniforms.u_tiempo.value = reloj.getElapsedTime();

    renderer.render(scene, camera);
}

animate();
