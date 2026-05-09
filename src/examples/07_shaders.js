import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

// ─────────────────────────────────────────────────────────────────────────────
// ESCENA BASE
// ─────────────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 6, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);

// ─────────────────────────────────────────────────────────────────────────────
// UNIFORMS COMPARTIDOS
// ─────────────────────────────────────────────────────────────────────────────
const uniforms = {
    u_tiempo:      { value: 0.0 },
    u_resolucion:  { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_amplitud:    { value: 0.4 },
    u_frecuencia:  { value: 3.5 },
    u_velocidad:   { value: 1.0 },
    u_colorAgua:   { value: new THREE.Color(0x006994) },
    u_colorCima:   { value: new THREE.Color(0x88ddff) },
    u_mousePos:    { value: new THREE.Vector2(0.5, 0.5) }
};

// ─────────────────────────────────────────────────────────────────────────────
// SHADER MATERIAL — OCÉANO ANIMADO
// Vértices desplazados en la GPU con suma de ondas seno/coseno
// ─────────────────────────────────────────────────────────────────────────────
const materialOceano = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.DoubleSide,

    vertexShader: `
        uniform float u_tiempo;
        uniform float u_amplitud;
        uniform float u_frecuencia;
        uniform float u_velocidad;

        varying vec2  vUv;
        varying float vElevacion;

        void main() {
            vUv = uv;
            vec3 pos = position;

            // Suma de tres ondas en distintas direcciones para mayor naturalidad
            float onda1 = sin(pos.x * u_frecuencia       + u_tiempo * u_velocidad)       * u_amplitud;
            float onda2 = sin(pos.y * u_frecuencia * 0.8 + u_tiempo * u_velocidad * 1.3) * u_amplitud * 0.6;
            float onda3 = cos((pos.x + pos.y) * u_frecuencia * 0.5 + u_tiempo * 0.8)    * u_amplitud * 0.35;

            vElevacion = onda1 + onda2 + onda3;
            pos.z += vElevacion;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,

    fragmentShader: `
        uniform vec3  u_colorAgua;
        uniform vec3  u_colorCima;
        uniform float u_tiempo;

        varying vec2  vUv;
        varying float vElevacion;

        void main() {
            // Mapear elevación al rango 0..1 para mezclar colores
            float mezcla = smoothstep(-0.45, 0.45, vElevacion);
            vec3 color   = mix(u_colorAgua, u_colorCima, mezcla);

            // Destellos en las crestas (espuma)
            float espuma = smoothstep(0.30, 0.45, vElevacion);
            color = mix(color, vec3(1.0), espuma * 0.5);

            gl_FragColor = vec4(color, 1.0);
        }
    `
});

// Plano con alta subdivisión (más segmentos = olas más suaves)
const geoMar = new THREE.PlaneGeometry(14, 14, 256, 256);
const meshMar = new THREE.Mesh(geoMar, materialOceano);
meshMar.rotation.x = -Math.PI / 2;
scene.add(meshMar);

// ─────────────────────────────────────────────────────────────────────────────
// SHADER MATERIAL — ESFERA PROCEDURAL (Patrones UV)
// Fragment shader con patrón de rejilla y pulso de color
// ─────────────────────────────────────────────────────────────────────────────
const uniformsEsfera = {
    u_tiempo:    { value: 0.0 },
    u_colorA:    { value: new THREE.Color(0x00ffcc) },
    u_colorB:    { value: new THREE.Color(0xff4400) },
    u_celdas:    { value: 8.0 }
};

const materialEsfera = new THREE.ShaderMaterial({
    uniforms: uniformsEsfera,
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
            vUv    = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float u_tiempo;
        uniform vec3  u_colorA;
        uniform vec3  u_colorB;
        uniform float u_celdas;

        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
            // Rejilla animada con fract
            vec2 grid = fract(vUv * u_celdas);
            float lineaX = step(0.90, grid.x);
            float lineaY = step(0.90, grid.y);
            float rejilla = clamp(lineaX + lineaY, 0.0, 1.0);

            // Pulso temporal de color
            float t = (sin(u_tiempo * 2.0) + 1.0) * 0.5;
            vec3 colorRejilla = mix(u_colorA, u_colorB, t);

            // Iluminación básica con la normal
            float luz = dot(vNormal, normalize(vec3(1.0, 2.0, 1.0)));
            luz = clamp(luz * 0.5 + 0.5, 0.0, 1.0);

            vec3 colorBase = vec3(0.05) * luz;
            vec3 colorFinal = mix(colorBase, colorRejilla * luz, rejilla);

            gl_FragColor = vec4(colorFinal, 1.0);
        }
    `
});

const meshEsfera = new THREE.Mesh(
    new THREE.SphereGeometry(2, 64, 64),
    materialEsfera
);
meshEsfera.position.set(-5, 2.2, 0);
scene.add(meshEsfera);

// ─────────────────────────────────────────────────────────────────────────────
// SHADER MATERIAL — TORO CON DISTORSIÓN DE VÉRTICES
// ─────────────────────────────────────────────────────────────────────────────
const uniformsToro = {
    u_tiempo:    { value: 0.0 },
    u_distorsion:{ value: 0.3 },
    u_colorA:    { value: new THREE.Color(0xcc00ff) },
    u_colorB:    { value: new THREE.Color(0xffcc00) }
};

const materialToro = new THREE.ShaderMaterial({
    uniforms: uniformsToro,
    vertexShader: `
        uniform float u_tiempo;
        uniform float u_distorsion;

        varying vec2  vUv;
        varying float vDesplazamiento;

        void main() {
            vUv = uv;

            vec3 pos = position;
            // Distorsión basada en la normal del vértice
            float noise = sin(pos.x * 5.0 + u_tiempo) * cos(pos.z * 5.0 + u_tiempo * 0.7);
            vDesplazamiento = noise;
            pos += normal * noise * u_distorsion;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3  u_colorA;
        uniform vec3  u_colorB;
        varying float vDesplazamiento;

        void main() {
            float t = (vDesplazamiento + 1.0) * 0.5;
            vec3 color = mix(u_colorA, u_colorB, t);
            gl_FragColor = vec4(color, 1.0);
        }
    `
});

const meshToro = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.5, 0.5, 128, 32),
    materialToro
);
meshToro.position.set(5, 2.2, 0);
scene.add(meshToro);

// ─────────────────────────────────────────────────────────────────────────────
// MOUSE POSITION
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('mousemove', (e) => {
    uniforms.u_mousePos.value.set(
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// GUI
// ─────────────────────────────────────────────────────────────────────────────
const gui = new GUI({ title: 'Shaders GLSL' });

const oceanoFolder = gui.addFolder('🌊 Océano');
oceanoFolder.add(uniforms.u_amplitud,    'value', 0, 1.5, 0.01).name('Amplitud');
oceanoFolder.add(uniforms.u_frecuencia,  'value', 0.5, 10, 0.1).name('Frecuencia');
oceanoFolder.add(uniforms.u_velocidad,   'value', 0, 5,   0.1).name('Velocidad');
oceanoFolder.addColor({ color: '#006994' }, 'color')
    .name('Color agua').onChange(v => uniforms.u_colorAgua.value.set(v));
oceanoFolder.addColor({ color: '#88ddff' }, 'color')
    .name('Color cresta').onChange(v => uniforms.u_colorCima.value.set(v));

const esferaFolder = gui.addFolder('🔮 Esfera');
esferaFolder.add(uniformsEsfera.u_celdas, 'value', 1, 20, 0.5).name('Celdas rejilla');
esferaFolder.addColor({ color: '#00ffcc' }, 'color')
    .name('Color A').onChange(v => uniformsEsfera.u_colorA.value.set(v));
esferaFolder.addColor({ color: '#ff4400' }, 'color')
    .name('Color B').onChange(v => uniformsEsfera.u_colorB.value.set(v));

const toroFolder = gui.addFolder('💜 Toro Knot');
toroFolder.add(uniformsToro.u_distorsion, 'value', 0, 1, 0.01).name('Distorsión');
toroFolder.addColor({ color: '#cc00ff' }, 'color')
    .name('Color A').onChange(v => uniformsToro.u_colorA.value.set(v));
toroFolder.addColor({ color: '#ffcc00' }, 'color')
    .name('Color B').onChange(v => uniformsToro.u_colorB.value.set(v));

// ─────────────────────────────────────────────────────────────────────────────
// RESIZE
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    uniforms.u_resolucion.value.set(w, h);
});

// ─────────────────────────────────────────────────────────────────────────────
// LOOP DE ANIMACIÓN
// ─────────────────────────────────────────────────────────────────────────────
const reloj = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const t = reloj.getElapsedTime();

    // Actualizar tiempo en todos los shaders
    uniforms.u_tiempo.value           = t;
    uniformsEsfera.u_tiempo.value     = t;
    uniformsToro.u_tiempo.value       = t;

    // Rotar los objetos lentamente
    meshEsfera.rotation.y = t * 0.3;
    meshToro.rotation.y   = t * 0.5;
    meshToro.rotation.x   = t * 0.2;

    controls.update();
    renderer.render(scene, camera);
}

animate();
