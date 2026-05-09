# Three.js: Construyendo Mundos en 3D — Repositorio Oficial del Libro

Bienvenido al repositorio oficial de código fuente del libro/curso interactivo **[Three.js: Construyendo mundos en 3D (De los fundamentos a la interactividad)](https://www.desarrollolibre.net/libros/threejs-construyendo-mundos-en-3d-de-los-fundamentos-a-la-interactividad)** publicado en **Desarrollo Libre**.

Este proyecto contiene todos los ejemplos prácticos correspondientes a los capítulos del libro, estructurados bajo una arquitectura web moderna.

---

## 🚀 Tecnologías y Arquitectura Moderna

El código ha sido escrito y optimizado utilizando los estándares actuales de desarrollo Frontend y WebGL:

* **Vite:** Se utiliza como servidor de desarrollo y herramienta de construcción superrápida con soporte para *Hot Module Replacement (HMR)*.
* **Módulos ES (ESM):** Código estructurado utilizando `import * as THREE from 'three'` en lugar de scripts globales obsoletos.
* **Dependencias NPM Clave:**
  * `three` (Versión más reciente)
  * `gsap` (Para animaciones e interpolaciones fluidas)
  * `lil-gui` (Para controles y menús de depuración en tiempo real)

---

## 📚 Índice de Ejemplos Prácticos

El repositorio contiene implementaciones completas y comentadas en la carpeta `src/examples/`, cubriendo desde los fundamentos hasta técnicas avanzadas a nivel de producción:

1. **Fundamentos y Primitivas** — Escena, Cámara y Renderer básicos.
2. **Materiales** — MeshBasic, Lambert, Phong y texturas simples.
3. **Iluminación** — Luces direccionales, ambientales, focos y mapas de sombras.
4. **Interacción (Raycaster)** — Clics, hovers y selección de objetos 3D.
5. **Carga de Modelos 3D** — Importación de archivos GLTF y GLB desde Blender.
6. **Físicas (Cannon.js)** — Gravedad, colisiones y cuerpos rígidos.
7. **Shaders y GLSL** — Materiales personalizados procesados directamente en la GPU.
8. **Animaciones Avanzadas** — Uso de `AnimationMixer` para reproducir animaciones exportadas.
9. **PBR y Texturas Realistas** — Mapas de normales, rugosidad, metalicidad, HDR y refracción.
10. **Sistemas de Partículas** — Lluvia, galaxias y efectos masivos usando `InstancedMesh` y `Float32Array`.
11. **WebXR (Realidad Virtual y Aumentada)** — Experiencias inmersivas, teletransportación y agarre de objetos con gafas VR.
12. **Rendimiento y Optimización** — Minimización de Draw Calls, LOD, manejo de memoria (Garbage Collector) e `InstancedMesh`.

---

## ⚙️ Cómo ejecutar el proyecto en tu máquina

Para poder jugar y modificar los ejemplos interactivos, sigue estos tres simples pasos en tu terminal:

1. **Instalar las dependencias (necesitas Node.js instalado):**
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo local:**
   ```bash
   npm run dev
   ```

3. **Ver el resultado:**
   Abre tu navegador en la URL que indique la consola (generalmente `http://localhost:5173`). Desde el menú principal (`index.html`), podrás navegar por todos los ejercicios y visualizar los cambios en el código al instante gracias a Vite.

---

## 📖 Material de Estudio

Todo el código de este repositorio está pensado para ser consumido junto a la teoría exhaustiva del curso. 

👉 **Aprende la teoría paso a paso leyendo el libro oficial completo aquí:**  
[Three.js: Construyendo mundos en 3D (De los fundamentos a la interactividad) en Desarrollolibre.net](https://www.desarrollolibre.net/libros/threejs-construyendo-mundos-en-3d-de-los-fundamentos-a-la-interactividad)

¡Disfruta construyendo la web inmersiva!
