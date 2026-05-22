import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── CARGA ──
setTimeout(() => {
    const p = document.getElementById('pantalla-carga');
    if (p) { p.style.opacity = '0'; setTimeout(() => p.style.display = 'none', 500); }
}, 4000);
const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = () => {
    const p = document.getElementById('pantalla-carga');
    if (p) { p.style.opacity = '0'; setTimeout(() => p.style.display = 'none', 500); }
};

// ── ESCENA ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111116);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 3, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ── LUCES ──
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 8, 5);
scene.add(dirLight);
const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
fillLight.position.set(-5, -3, -5);
scene.add(fillLight);

// ── CUADRÍCULA ──
const gridHelper = new THREE.GridHelper(10, 20, 0x00ffff, 0x333333);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// ========================================================
// CONFIGURACIÓN MANUAL DE CADA MODELO GLB
// Aquí están las coordenadas que tú calibraste manualmente.
// Para añadir un modelo nuevo, copia el bloque y ajusta los valores.
// ========================================================
const CONFIG_MODELOS = {
    // ── CAJAS ──
    'case_corsair.glb': {
        escala: 4.38335949743193,
        pos:    { x: -0.0012212289042001223, y: -0.46223731273980867, z: 0.004363321447276913 },
        rot:    { x: 0, y: 0, z: 0 }
    },
    'case_fractal.glb': {
        // Ajusta estos valores cuando tengas el modelo de Fractal
        // Por ahora usa los mismos que Corsair como punto de partida
        escala: 4.38335949743193,
        pos:    { x: 0, y: -0.46, z: 0 },
        rot:    { x: 0, y: 0, z: 0 }
    },

    // ── PLACAS BASE ──
    'mobo_pro.glb': {
        escala: 0.23441940463062447,
        pos:    { x: 0.44508416116312954, y: 1.2066575437401268, z: -0.6695229579883121 },
        rot:    { x: 1.5739146500977332, y: 0.018214774560915116, z: 1.694773775031612 }
    },
    'mobo_generic.glb': {
        // Ajusta cuando tengas el modelo
        escala: 0.23441940463062447,
        pos:    { x: 0.44508416116312954, y: 1.2066575437401268, z: -0.6695229579883121 },
        rot:    { x: 1.5739146500977332, y: 0.018214774560915116, z: 1.694773775031612 }
    },
    'mobo_z790.glb': {
        escala: 0.23441940463062447,
        pos:    { x: 0.44508416116312954, y: 1.2066575437401268, z: -0.6695229579883121 },
        rot:    { x: 1.5739146500977332, y: 0.018214774560915116, z: 1.694773775031612 }
    },
    'mobo_b660.glb': {
        escala: 0.23441940463062447,
        pos:    { x: 0.44508416116312954, y: 1.2066575437401268, z: -0.6695229579883121 },
        rot:    { x: 1.5739146500977332, y: 0.018214774560915116, z: 1.694773775031612 }
    },

    // ── GPUs ──
    'gpu_4090.glb': {
        escala: 0.002822309152042788,
        pos:    { x: 0.24930784974290898, y: 0.8782206284370628, z: -0.6530687989599044 },
        rot:    { x: 3.0178850846808407, y: -1.5492430132602115, z: -1.7126768605325078 }
    },
    'gpu_3090.glb': {
        // Ajusta cuando tengas el modelo
        escala: 0.002822309152042788,
        pos:    { x: 0.24930784974290898, y: 0.8782206284370628, z: -0.6530687989599044 },
        rot:    { x: 3.0178850846808407, y: -1.5492430132602115, z: -1.7126768605325078 }
    },
};

// Configuración por defecto para placeholders (CPU, RAM sin GLB)
const CONFIG_POR_DEFECTO = {
    caja:    { escala: 4.38, pos: { x: 0, y: -0.46, z: 0 }, rot: { x: 0, y: 0, z: 0 } },
    placa:   { escala: 0.23, pos: { x: 0.44, y: 1.2, z: -0.67 }, rot: { x: 1.57, y: 0, z: 1.69 } },
    cpu:     { escala: 0.45, pos: { x: 0.1, y: 1.1, z: -0.5 }, rot: { x: 1.57, y: 0, z: 0 } },
    ram:     { escala: 0.7,  pos: { x: 0.6, y: 1.3, z: -0.6 }, rot: { x: 1.57, y: 0, z: 0 } },
    grafica: { escala: 0.002822, pos: { x: 0.25, y: 0.88, z: -0.65 }, rot: { x: 3.01, y: -1.55, z: -1.71 } },
};

function aplicarConfig(model, nombreArchivo, tipo) {
    const cfg = CONFIG_MODELOS[nombreArchivo] || CONFIG_POR_DEFECTO[tipo];
    model.scale.setScalar(cfg.escala);
    model.position.set(cfg.pos.x, cfg.pos.y, cfg.pos.z);
    model.rotation.set(cfg.rot.x, cfg.rot.y, cfg.rot.z);
}

// ── COMPATIBILIDAD ──
const COMPAT_DB = {
    'mobo_pro.glb':     { socket: 'AM4',     ramTipo: 'DDR4' },
    'mobo_generic.glb': { socket: 'AM4',     ramTipo: 'DDR4' },
    'mobo_z790.glb':    { socket: 'LGA1700', ramTipo: 'DDR5' },
    'mobo_b660.glb':    { socket: 'LGA1700', ramTipo: 'DDR4' },
    'cpu_5900x.glb':    { socket: 'AM4',     marca: 'amd'   },
    'cpu_5600x.glb':    { socket: 'AM4',     marca: 'amd'   },
    'cpu_i9.glb':       { socket: 'LGA1700', marca: 'intel' },
    'cpu_i5.glb':       { socket: 'LGA1700', marca: 'intel' },
    'ram_ddr4.glb':     { ramTipo: 'DDR4' },
    'ram_ddr5.glb':     { ramTipo: 'DDR5' },
};
const archivoActual = { caja: null, placa: null, cpu: null, ram: null, grafica: null };

function verificarCompatibilidad() {
    const errores = [];
    const placa = archivoActual.placa ? COMPAT_DB[archivoActual.placa] : null;
    const cpu   = archivoActual.cpu   ? COMPAT_DB[archivoActual.cpu]   : null;
    const ram   = archivoActual.ram   ? COMPAT_DB[archivoActual.ram]   : null;
    if (placa && cpu && placa.socket  !== cpu.socket)  errores.push(`Socket CPU (${cpu.socket}) incompatible con placa (${placa.socket})`);
    if (placa && ram && placa.ramTipo !== ram.ramTipo) errores.push(`RAM ${ram.ramTipo} incompatible con placa (requiere ${placa.ramTipo})`);
    const todo = !!(archivoActual.placa && archivoActual.cpu && archivoActual.ram);
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada(errores, todo);
}

// ── PLACEHOLDERS ──
function crearCPU(marca) {
    const g = new THREE.Group();
    const esIntel = (marca === 'intel');
    const pcbColor = esIntel ? 0x005060 : 0x006030;

    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.04, 1.05),
        new THREE.MeshStandardMaterial({ color: pcbColor, metalness: 0.2, roughness: 0.8 })));

    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.05 });
    const pinGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.025, 6);
    for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
            if (Math.abs(x) === 5 && Math.abs(z) === 5) continue;
            const pin = new THREE.Mesh(pinGeo, pinMat);
            pin.position.set(x * 0.087, -0.03, z * 0.087);
            g.add(pin);
        }
    }

    const capMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.6, roughness: 0.4 });
    const capGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.05, 8);
    [[-0.45,0.04,0],[0.45,0.04,0],[0,0.04,-0.45],[0,0.04,0.45],
     [-0.45,0.04,0.22],[0.45,0.04,-0.22]].forEach(([x,y,z]) => {
        const c = new THREE.Mesh(capGeo, capMat); c.position.set(x,y,z); g.add(c);
    });

    const ihsBase = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.015, 0.82),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.95, roughness: 0.05 }));
    ihsBase.position.y = 0.027; g.add(ihsBase);

    const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.065, 0.75),
        new THREE.MeshStandardMaterial({ color: 0xc8c8cc, metalness: 0.9, roughness: 0.08 }));
    ihs.position.y = 0.055; g.add(ihs);

    const top = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.005, 0.68),
        new THREE.MeshStandardMaterial({ color: 0xd8d8dc, metalness: 0.85, roughness: 0.04 }));
    top.position.y = 0.091; g.add(top);

    const logo = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.002, 0.07),
        new THREE.MeshStandardMaterial({ color: esIntel ? 0x0071c5 : 0xed1c24, roughness: 1 }));
    logo.position.set(-0.12, 0.096, 0); g.add(logo);

    return g;
}

function crearRAM(ramTipo) {
    const g = new THREE.Group();
    const esDDR5 = (ramTipo === 'DDR5');

    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.5, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x1a3a1a, metalness: 0.1, roughness: 0.8 })));

    const hs = new THREE.Mesh(new THREE.BoxGeometry(0.175, 1.12, 0.055),
        new THREE.MeshStandardMaterial({ color: esDDR5 ? 0x1a1a3a : 0x2a1a1a, metalness: 0.8, roughness: 0.3 }));
    hs.position.y = 0.18; g.add(hs);

    const band = new THREE.Mesh(new THREE.BoxGeometry(0.176, 0.12, 0.057),
        new THREE.MeshStandardMaterial({ color: esDDR5 ? 0x5555ee : 0xcc2222, metalness: 0.6, roughness: 0.3 }));
    band.position.y = 0.62; g.add(band);

    const conn = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.22, 0.038),
        new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.9, roughness: 0.1 }));
    conn.position.y = -0.64; g.add(conn);

    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.05 });
    for (let i = -4; i <= 4; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.18, 0.04), pinMat);
        pin.position.set(i * 0.016, -0.64, 0); g.add(pin);
    }
    return g;
}

function crearPlaceholder(tipo, nombreArchivo) {
    if (tipo === 'cpu') return crearCPU((COMPAT_DB[nombreArchivo] || {}).marca || 'intel');
    if (tipo === 'ram') return crearRAM((COMPAT_DB[nombreArchivo] || {}).ramTipo || 'DDR4');
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),
        new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.6, roughness: 0.4 })));
    return g;
}

// ── PIEZAS ──
const TIPOS   = ['caja', 'placa', 'cpu', 'ram', 'grafica'];
const NOMBRES = { caja:'CAJA', placa:'PLACA BASE', cpu:'CPU', ram:'RAM', grafica:'GRÁFICA' };

let piezasActivas  = { caja:null, placa:null, cpu:null, ram:null, grafica:null };
let preciosActivos = { caja:0,    placa:0,    cpu:0,   ram:0,   grafica:0    };

const loader = new GLTFLoader(loadingManager);

function actualizarTotal() {
    const el = document.getElementById('precio-total');
    if (el) el.innerText = Object.values(preciosActivos).reduce((a,b) => a+b, 0).toLocaleString('es-ES');
}

window.cambiarComponente = function(tipo, nombreArchivo, nombreBonito, precio) {
    if (piezasActivas[tipo]) {
        scene.remove(piezasActivas[tipo]);
        piezasActivas[tipo] = null;
    }
    preciosActivos[tipo] = precio;
    archivoActual[tipo]  = nombreArchivo;
    actualizarTotal();
    verificarCompatibilidad();

    const el = document.getElementById('txt-'+tipo);
    if (el) el.innerHTML = '<span style="color:#00ffff">⏳ '+nombreBonito+'...</span>';

    function colocar(model) {
        aplicarConfig(model, nombreArchivo, tipo);
        scene.add(model);
        piezasActivas[tipo] = model;
        if (el) el.innerHTML = '<strong>'+NOMBRES[tipo]+':</strong> '+nombreBonito+' — '+precio.toLocaleString('es-ES')+'€';
    }

    loader.load(
        'models/'+nombreArchivo,
        gltf => colocar(gltf.scene),
        undefined,
        () => colocar(crearPlaceholder(tipo, nombreArchivo))
    );
};

window.reiniciarPC = function() {
    TIPOS.forEach(t => {
        if (piezasActivas[t]) { scene.remove(piezasActivas[t]); piezasActivas[t] = null; }
        preciosActivos[t] = 0; archivoActual[t] = null;
        const el = document.getElementById('txt-'+t);
        if (el) el.innerHTML = '<span style="color:#4a6070">'+NOMBRES[t]+': —</span>';
    });
    actualizarTotal();
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada([], false);
};

// Carga inicial
window.cambiarComponente('caja',    'case_corsair.glb', 'Corsair iCUE 4000D',  150);
window.cambiarComponente('placa',   'mobo_pro.glb',     'ASUS Pro WS X570',    350);
window.cambiarComponente('cpu',     'cpu_5900x.glb',    'Ryzen 9 5900X',       550);
window.cambiarComponente('ram',     'ram_ddr4.glb',     'Kingston DDR4 32GB',   90);
window.cambiarComponente('grafica', 'gpu_4090.glb',     'RTX 4090',           2000);

// ── ANIMACIÓN ──
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
