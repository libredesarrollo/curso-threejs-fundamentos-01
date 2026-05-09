import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import GUI from 'lil-gui';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN INICIAL Y OPTIMIZACIONES GLOBALES
// ─────────────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 15, 30);

// OPTIMIZACIÓN: antialias a false si usamos efectos, o true si no.
// powerPreference high-performance para la gráfica dedicada
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
// OPTIMIZACIÓN CRÍTICA: Limitar el ratio de píxeles a 2 máximo
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
// OPTIMIZACIÓN: Sombras PCF suaves pero no tan pesadas como PCFSoft en algunos casos, aunque aquí PCFSoft está bien si la resolución es baja
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ─────────────────────────────────────────────────────────────────────────────
// ESTADÍSTICAS (Stats.js)
// ─────────────────────────────────────────────────────────────────────────────
const stats = new Stats();
stats.showPanel(0); // 0: FPS, 1: MS, 2: Memoria
document.body.appendChild(stats.dom);

// ─────────────────────────────────────────────────────────────────────────────
// ILUMINACIÓN OPTIMIZADA
// ─────────────────────────────────────────────────────────────────────────────
// HemisphereLight es súper barata computacionalmente
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(20, 30, 20);
dirLight.castShadow = true;
// OPTIMIZACIÓN: Mapa de sombras de 1024x1024 en lugar de 4096. 
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
// OPTIMIZACIÓN: Ajustar el frustum de la cámara de sombra para aprovechar la resolución
dirLight.shadow.camera.near = 10;
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.radius = 2; // Ligero blur para disimular la resolución
scene.add(dirLight);

// ─────────────────────────────────────────────────────────────────────────────
// ENTORNO
// ─────────────────────────────────────────────────────────────────────────────
const sueloGeo = new THREE.PlaneGeometry(200, 200);
const sueloMat = new THREE.MeshLambertMaterial({ color: 0x3d8c40 }); // Lambert es más rápido que Standard
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true; // Recibe pero NO castShadow
scene.add(suelo);

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE INSTANCED MESH (EL NÚCLEO DE LA OPTIMIZACIÓN)
// ─────────────────────────────────────────────────────────────────────────────
const CUENTA_OBJETOS = 15000;

// Reutilización extrema: 1 sola geometría y 1 solo material para 15,000 objetos
// Usamos BoxGeometry en lugar de esferas o cilindros porque tiene menos polígonos
const cajaGeo = new THREE.BoxGeometry(1, 1, 1);
const cajaMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

// Creamos un InstancedMesh
let instancedMesh = new THREE.InstancedMesh(cajaGeo, cajaMat, CUENTA_OBJETOS);
instancedMesh.castShadow = true; // 15,000 objetos proyectando sombra ¡en una sola pasada!
instancedMesh.receiveShadow = true;

// Variable dummy para no instanciar matrices en el bucle
const dummy = new THREE.Object3D();
const colorDummy = new THREE.Color();

// Datos para animación individual (velocidades) sin objetos pesados
const velocidades = new Float32Array(CUENTA_OBJETOS);

function poblarInstancias() {
    for (let i = 0; i < CUENTA_OBJETOS; i++) {
        // Posición
        dummy.position.set(
            (Math.random() - 0.5) * 100,
            Math.random() * 20 + 0.5,
            (Math.random() - 0.5) * 100
        );
        
        // Rotación
        dummy.rotation.x = Math.random() * Math.PI;
        dummy.rotation.y = Math.random() * Math.PI;
        
        // Escala
        dummy.scale.setScalar(0.5 + Math.random() * 1.5);
        
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);

        // Color individual (soportado por InstancedMesh)
        colorDummy.setHSL(Math.random(), 0.8, 0.5);
        instancedMesh.setColorAt(i, colorDummy);

        // Almacenar velocidad para animar después
        velocidades[i] = 0.01 + Math.random() * 0.04;
    }
    
    // Notificamos a la GPU que los datos iniciales están listos
    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.instanceColor.needsUpdate = true;
    
    scene.add(instancedMesh);
}

poblarInstancias();

// ─────────────────────────────────────────────────────────────────────────────
// INTERFAZ DE USUARIO PARA DEBUG (GUI)
// ─────────────────────────────────────────────────────────────────────────────
const gui = new GUI({ title: 'Monitor de Rendimiento' });
const params = {
    animar: true,
    sombras: true,
    infoRender: () => {
        console.clear();
        console.log('%c INFO DEL RENDERER (VER FPS ARRIBA)', 'color: #00ff00; font-weight: bold; font-size: 14px');
        console.log('Llamadas de dibujo (Draw Calls):', renderer.info.render.calls);
        console.log('Triángulos (Polígonos):', renderer.info.render.triangles);
        console.log('Geometrías en Memoria:', renderer.info.memory.geometries);
        console.log('Materiales en Memoria:', renderer.info.memory.textures);
        alert(`Abre la consola F12 para ver la magia de la optimización.\nDraw Calls: ${renderer.info.render.calls}\n(15,000 cubos en 1 llamada)`);
    }
};

gui.add(params, 'animar').name('Animar 15k instancias');
gui.add(params, 'sombras').name('Sombras dinámicas').onChange(v => {
    dirLight.castShadow = v;
    // Debemos obligar al material a actualizarse si las sombras cambian
    scene.traverse(child => {
        if (child.material) child.material.needsUpdate = true;
    });
});
gui.add(params, 'infoRender').name('🖨️ Log Info GPU');

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
function animate() {
    requestAnimationFrame(animate);
    
    stats.begin(); // Inicio de medición de frames

    controls.update();

    // OPTIMIZACIÓN: Mutar las matrices directamente sobre las instancias
    if (params.animar) {
        for (let i = 0; i < CUENTA_OBJETOS; i++) {
            // Extraer la matriz actual de la instancia i al objeto dummy
            instancedMesh.getMatrixAt(i, dummy.matrix);
            
            // Recomponer la matriz a posición/rotación/escala para modificarla cómodamente
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
            
            // Aplicar rotación sobre sí mismos
            dummy.rotation.x += velocidades[i];
            dummy.rotation.y += velocidades[i];
            
            // Volver a componer la matriz
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        // Obligatorio avisar que se modificaron los datos
        instancedMesh.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);

    stats.end(); // Fin de medición de frames
}

// Empezar loop
animate();
