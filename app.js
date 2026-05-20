import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// ========================================================
// 🚀 PANTALLA DE CARGA
// ========================================================

setTimeout(() => {

    const pantalla = document.getElementById('pantalla-carga');

    if (pantalla) {

        pantalla.style.opacity = '0';

        setTimeout(() => {
            pantalla.style.display = 'none';
        }, 500);
    }

}, 2000);

// ========================================================
// 🌍 ESCENA
// ========================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x0f172a);

// ========================================================
// 📷 CÁMARA
// ========================================================

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 2, 6);

// ========================================================
// 🖥️ RENDERER OPTIMIZADO
// ========================================================

const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: 'low-power'
});

renderer.setSize(window.innerWidth, window.innerHeight);

// 🔥 MUY IMPORTANTE PARA RENDIMIENTO
renderer.setPixelRatio(1);

document.body.appendChild(renderer.domElement);

// ========================================================
// 🎮 CONTROLES
// ========================================================

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.minDistance = 2;
controls.maxDistance = 12;

controls.autoRotateSpeed = 1;

// ========================================================
// 💡 ILUMINACIÓN LIGERA
// ========================================================

const hemiLight = new THREE.HemisphereLight(
    0xffffff,
    0x444444,
    2
);

scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(
    0xffffff,
    1.5
);

dirLight.position.set(3, 5, 2);

scene.add(dirLight);

// ========================================================
// 🧱 SUELO SIMPLE
// ========================================================

const suelo = new THREE.Mesh(

    new THREE.PlaneGeometry(20, 20),

    new THREE.MeshBasicMaterial({
        color: 0x1e293b
    })
);

suelo.rotation.x = -Math.PI / 2;
suelo.position.y = -1;

scene.add(suelo);

// ========================================================
// 🧲 TRANSFORM CONTROLS
// ========================================================

const transformControl = new TransformControls(
    camera,
    renderer.domElement
);

transformControl.addEventListener(
    'dragging-changed',
    function (event) {

        controls.enabled = !event.value;
    }
);

scene.add(transformControl);

// ========================================================
// 📦 VARIABLES
// ========================================================

const loader = new GLTFLoader();

let piezasActivas = {
    caja: null,
    placa: null,
    grafica: null
};

let preciosActivos = {
    caja: 0,
    placa: 0,
    grafica: 0
};

// ========================================================
// ⚙️ CONFIGURACIÓN
// ========================================================

const posicionesDefault = {

    caja: {
        position: [0, 0, 0],
        rotation: [0, 0, 0]
    },

    placa: {
        position: [0, 0.4, 0],
        rotation: [0, 0, 0]
    },

    grafica: {
        position: [0.7, 0.7, 0],
        rotation: [0, 0, 0]
    }
};

// ========================================================
// 🔥 NORMALIZAR MODELOS AUTOMÁTICAMENTE
// ========================================================

function normalizarModelo(model, targetSize = 2) {

    const box = new THREE.Box3().setFromObject(model);

    const size = new THREE.Vector3();

    box.getSize(size);

    const maxAxis = Math.max(
        size.x,
        size.y,
        size.z
    );

    const scale = targetSize / maxAxis;

    model.scale.setScalar(scale);

    // Centrado

    box.setFromObject(model);

    const center = new THREE.Vector3();

    box.getCenter(center);

    model.position.sub(center);
}

// ========================================================
// ⚡ OPTIMIZACIÓN
// ========================================================

function optimizarModelo(model) {

    model.traverse((child) => {

        if (child.isMesh) {

            child.frustumCulled = true;

            if (child.material) {

                child.material.metalness = 0.2;
                child.material.roughness = 0.8;
            }
        }
    });
}

// ========================================================
// 📍 POSICIÓN AUTOMÁTICA
// ========================================================

function aplicarTransformaciones(model, tipo) {

    const data = posicionesDefault[tipo];

    model.position.set(
        data.position[0],
        data.position[1],
        data.position[2]
    );

    model.rotation.set(
        data.rotation[0],
        data.rotation[1],
        data.rotation[2]
    );
}

// ========================================================
// 💰 PRECIO TOTAL
// ========================================================

function actualizarPrecioTotal() {

    const total =
        preciosActivos.caja +
        preciosActivos.placa +
        preciosActivos.grafica;

    const precioHTML =
        document.getElementById('precio-total');

    if (precioHTML) {

        precioHTML.innerText = `${total}€`;
    }
}

// ========================================================
// 🚀 CARGAR COMPONENTES
// ========================================================

window.cambiarComponente = function (
    tipo,
    nombreArchivo,
    nombreBonito,
    precio
) {

    // ocultar modelo anterior

    if (piezasActivas[tipo]) {

        if (
            transformControl.object ===
            piezasActivas[tipo]
        ) {

            transformControl.detach();
        }

        scene.remove(piezasActivas[tipo]);
    }

    // actualizar precio

    preciosActivos[tipo] = precio;

    actualizarPrecioTotal();

    // cargar modelo

    loader.load(

        `models/${nombreArchivo}`,

        (gltf) => {

            const model = gltf.scene;

            // 🔥 NORMALIZAR
            normalizarModelo(model);

            // ⚡ OPTIMIZAR
            optimizarModelo(model);

            // 📍 POSICIONAR
            aplicarTransformaciones(
                model,
                tipo
            );

            // añadir escena

            scene.add(model);

            piezasActivas[tipo] = model;

            // actualizar texto UI

            const texto =
                document.getElementById(`txt-${tipo}`);

            if (texto) {

                texto.innerHTML = `
                    <strong>${tipo.toUpperCase()}</strong>
                    <br>
                    ${nombreBonito}
                    <br>
                    ${precio}€
                `;
            }
        },

        undefined,

        (error) => {

            console.error(
                'Error cargando modelo:',
                error
            );
        }
    );
};

// ========================================================
// 🧹 REINICIAR PC
// ========================================================

window.reiniciarPC = function () {

    transformControl.detach();

    ['caja', 'placa', 'grafica'].forEach((tipo) => {

        if (piezasActivas[tipo]) {

            scene.remove(
                piezasActivas[tipo]
            );

            piezasActivas[tipo] = null;
        }

        preciosActivos[tipo] = 0;

        const texto =
            document.getElementById(`txt-${tipo}`);

        if (texto) {

            texto.innerHTML = `
                <span style="color:gray">
                    ${tipo.toUpperCase()} vacío
                </span>
            `;
        }
    });

    actualizarPrecioTotal();
};

// ========================================================
// 🎛️ GUI SIMPLE
// ========================================================

const gui = new GUI();

const settings = {

    autoRotate: false,

    seleccionar: 'ninguna',

    modo: 'translate'
};

// auto rotación

gui.add(
    settings,
    'autoRotate'
).name('🔄 Auto Rotar');

// modo mover / rotar / escala

gui.add(
    settings,
    'modo',
    {
        mover: 'translate',
        rotar: 'rotate',
        escala: 'scale'
    }

).name('🛠️ Herramienta')

.onChange((v) => {

    transformControl.setMode(v);
});

// seleccionar pieza

gui.add(
    settings,
    'seleccionar',
    {
        ninguna: 'ninguna',
        caja: 'caja',
        placa: 'placa',
        grafica: 'grafica'
    }

).name('📦 Seleccionar')

.onChange((v) => {

    if (v === 'ninguna') {

        transformControl.detach();

        return;
    }

    if (piezasActivas[v]) {

        transformControl.attach(
            piezasActivas[v]
        );
    }
});

// ========================================================
// 🚀 CARGA INICIAL
// ========================================================

cambiarComponente(
    'caja',
    'case_corsair.glb',
    'Corsair iCUE',
    150
);

cambiarComponente(
    'placa',
    'mobo_pro.glb',
    'ASUS Pro WS',
    350
);

cambiarComponente(
    'grafica',
    'gpu_4090.glb',
    'RTX 4090 ROG',
    2000
);

// ========================================================
// 🎥 ANIMACIÓN OPTIMIZADA
// ========================================================

let lastTime = 0;

function animate(time) {

    requestAnimationFrame(animate);

    // 🔥 LIMITADOR FPS
    if (time - lastTime < 1000 / 30) return;

    lastTime = time;

    // auto rotar

    controls.autoRotate =
        settings.autoRotate &&
        !transformControl.object;

    controls.update();

    renderer.render(
        scene,
        camera
    );
}

animate();

// ========================================================
// 📱 RESPONSIVE
// ========================================================

window.addEventListener('resize', () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
});
