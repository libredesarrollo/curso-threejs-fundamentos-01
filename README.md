# Curso Three.js Fundamentos - Modernizado

Este proyecto ha sido actualizado de una estructura de scripts tradicionales a una arquitectura moderna basada en **Node.js** y **Vite**.

## Cambios Principales:

1.  **Vite como Servidor de Desarrollo**: Ahora se utiliza Vite para una carga rápida de módulos y Hot Module Replacement (HMR).
2.  **Módulos ES (ESM)**: Se eliminaron las etiquetas `<script src="...">` globales en favor de `import * as THREE from 'three'`.
3.  **Dependencias via NPM**:
    *   `three`: Versión más reciente de Three.js.
    *   `gsap`: Reemplaza a `TweenMax` para animaciones modernas.
    *   `lil-gui`: Reemplaza a `dat.gui` (más ligero y moderno).
    *   `vite`: Herramienta de construcción y servidor.
4.  **Estructura Organizada**:
    *   `src/examples/`: Contiene los archivos JavaScript refactorizados.
    *   `index.html`: Dashboard central para navegar por los ejemplos.

## Cómo usar:

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Iniciar el servidor de desarrollo:
    ```bash
    npm run dev
    ```

3.  Abrir el navegador en la URL indicada (usualmente `http://localhost:5173`).

## Notas de la Migración:

*   Se han refactorizado los ejemplos 01, 02 y 04 para demostrar el patrón moderno.
*   Para migrar el resto, simplemente crea un nuevo archivo `.js` en `src/examples/` siguiendo el patrón de los ya existentes e impórtalo en el `index.html`.
*   Las bibliotecas antiguas en la carpeta `/js` ya no son necesarias para los nuevos archivos.
