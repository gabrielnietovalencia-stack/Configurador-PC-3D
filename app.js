import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── ESCENA ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111116);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ── CONTROLES ──
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1;
controls.maxDistance = 20;

// ── LUCES ──
scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 8, 5);
dirLight.castShadow = true;
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0x8888ff, 0.6);
dirLight2.position.set(-5, -3, -5);
scene.add(dirLight2);

const pointLight = new THREE.PointLight(0x00ffff, 0.8, 20);
pointLight.position.set(0, 3, 3);
scene.add(pointLight);

// ── GRID ──
const grid = new THREE.GridHelper(10, 20, 0x00ffff, 0x222233);
grid.position.y = -0.5;
scene.add(grid);

// ── PANTALLA DE CARGA ──
function ocultarCarga() {
    const p = document.getElementById('pantalla-carga');
    if (p) {
        p.style.opacity = '0';
        setTimeout(() => { p.style.display = 'none'; }, 600);
    }
}
setTimeout(ocultarCarga, 3000);

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
    if (placa && cpu && placa.socket  !== cpu.socket)   errores.push(`Socket CPU (${cpu.socket}) incompatible con placa (${placa.socket})`);
    if (placa && ram && placa.ramTipo !== ram.ramTipo)  errores.push(`RAM ${ram.ramTipo} incompatible con placa (requiere ${placa.ramTipo})`);
    const todo = !!(archivoActual.placa && archivoActual.cpu && archivoActual.ram);
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada(errores, todo);
}

// ── NORMALIZACIÓN Y POSICIONAMIENTO ──
const TAMAÑOS = { caja: 2.5, placa: 1.0, cpu: 0.45, ram: 0.7, grafica: 0.9 };

// Offset de posición para separar visualmente los componentes
const OFFSETS = {
    caja:    { x:  0,    y: 0,    z: 0    },
    placa:   { x: -1.5,  y: 0.1,  z: 0.5  },
    cpu:     { x:  1.5,  y: 0.1,  z: 0.5  },
    ram:     { x:  2.2,  y: 0.3,  z: -0.3 },
    grafica: { x:  0,    y: 0.1,  z: -1.8 },
};

const SUELO = -0.5;

function normalizarModelo(model, tipo) {
    const box1 = new THREE.Box3().setFromObject(model);
    const sz   = box1.getSize(new THREE.Vector3());
    const esc  = TAMAÑOS[tipo] / Math.max(sz.x, sz.y, sz.z);
    model.scale.setScalar(esc);

    const box2 = new THREE.Box3().setFromObject(model);
    const cnt  = box2.getCenter(new THREE.Vector3());

    const off = OFFSETS[tipo] || { x: 0, y: 0, z: 0 };
    model.position.x = off.x - cnt.x;
    model.position.z = off.z - cnt.z;
    model.position.y = SUELO - box2.min.y + model.position.y + off.y;
}

// ── PLACEHOLDERS DETALLADOS ──
function crearCPU(marca) {
    const g = new THREE.Group();
    const esIntel = marca === 'intel';
    const pcbColor = esIntel ? 0x005060 : 0x006030;

    // PCB base
    g.add(new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.04, 1.05),
        new THREE.MeshStandardMaterial({ color: pcbColor, metalness: 0.2, roughness: 0.8 })
    ));

    // IHS base
    const ihsBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.015, 0.82),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.95, roughness: 0.05 })
    );
    ihsBase.position.y = 0.027;
    g.add(ihsBase);

    // IHS elevado
    const ihs = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.065, 0.75),
        new THREE.MeshStandardMaterial({ color: 0xc8c8cc, metalness: 0.9, roughness: 0.08 })
    );
    ihs.position.y = 0.055;
    g.add(ihs);

    // Top IHS
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.008, 0.68),
        new THREE.MeshStandardMaterial({ color: 0xd8d8dc, metalness: 0.85, roughness: 0.05 })
    );
    top.position.y = 0.091;
    g.add(top);

    // Logo color
    const logo = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.002, 0.07),
        new THREE.MeshStandardMaterial({ color: esIntel ? 0x0071c5 : 0xed1c24, roughness: 1 })
    );
    logo.position.set(-0.12, 0.096, 0);
    g.add(logo);

    // Pines
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.05 });
    const pinGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.025, 6);
    for (let x = -4; x <= 4; x++) {
        for (let z = -4; z <= 4; z++) {
            const pin = new THREE.Mesh(pinGeo, pinMat);
            pin.position.set(x * 0.1, -0.03, z * 0.1);
            g.add(pin);
        }
    }
    return g;
}

function crearRAM(tipo) {
    const g = new THREE.Group();
    const esDDR5 = tipo === 'DDR5';

    // PCB
    g.add(new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 1.5, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x1a3a1a, metalness: 0.1, roughness: 0.8 })
    ));

    // Disipador
    const hs = new THREE.Mesh(
        new THREE.BoxGeometry(0.175, 1.12, 0.055),
        new THREE.MeshStandardMaterial({ color: esDDR5 ? 0x1a1a3a : 0x2a1a1a, metalness: 0.8, roughness: 0.3 })
    );
    hs.position.y = 0.18;
    g.add(hs);

    // Banda color
    const band = new THREE.Mesh(
        new THREE.BoxGeometry(0.176, 0.12, 0.056),
        new THREE.MeshStandardMaterial({ color: esDDR5 ? 0x5555ee : 0xcc2222, metalness: 0.6, roughness: 0.3 })
    );
    band.position.y = 0.62;
    g.add(band);

    // Conector dorado
    const conn = new THREE.Mesh(
        new THREE.BoxGeometry(0.155, 0.22, 0.038),
        new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.9, roughness: 0.1 })
    );
    conn.position.y = -0.64;
    g.add(conn);

    return g;
}

function crearGPU() {
    const g = new THREE.Group();

    // PCB
    g.add(new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.08, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x0f0f18, metalness: 0.3, roughness: 0.7 })
    ));

    // Disipador principal
    const heatsink = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.25, 0.85),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.7, roughness: 0.3 })
    );
    heatsink.position.y = 0.16;
    g.add(heatsink);

    // Ventiladores x2
    [-0.55, 0.55].forEach(xPos => {
        const fanRing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.32, 0.05, 32),
            new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.6, roughness: 0.4 })
        );
        fanRing.rotation.x = Math.PI / 2;
        fanRing.position.set(xPos, 0.28, 0);
        g.add(fanRing);

        const fanHub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16),
            new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.8, roughness: 0.2 })
        );
        fanHub.rotation.x = Math.PI / 2;
        fanHub.position.set(xPos, 0.28, 0);
        g.add(fanHub);

        // Aspas
        for (let i = 0; i < 7; i++) {
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.22, 0.03, 0.04),
                new THREE.MeshStandardMaterial({ color: 0x2a2a3f, metalness: 0.5, roughness: 0.5 })
            );
            blade.position.set(xPos, 0.28, 0);
            blade.rotation.z = (i / 7) * Math.PI * 2;
            blade.translateX(0.14);
            g.add(blade);
        }
    });

    // Conector PCIe
    const pcie = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.06, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.9, roughness: 0.1 })
    );
    pcie.position.set(0, -0.07, 0.5);
    g.add(pcie);

    return g;
}

function crearCaja() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.6, roughness: 0.4 });
    const matVidrio = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.1, roughness: 0.0, transparent: true, opacity: 0.3 });

    // Cuerpo principal
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 2.4), mat));

    // Panel lateral de vidrio
    const vidrio = new THREE.Mesh(new THREE.BoxGeometry(0.02, 2.0, 2.2), matVidrio);
    vidrio.position.x = 0.61;
    g.add(vidrio);

    // Botón de encendido
    const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16),
        new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 })
    );
    btn.rotation.z = Math.PI / 2;
    btn.position.set(0.62, 0.8, -0.9);
    g.add(btn);

    // Ranuras de ventilación frontales
    for (let i = 0; i < 5; i++) {
        const slot = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.05, 1.8),
            new THREE.MeshStandardMaterial({ color: 0x111118 })
        );
        slot.position.set(0.61, -0.5 + i * 0.15, 0);
        g.add(slot);
    }

    return g;
}

function crearPlacaBase(socket) {
    const g = new THREE.Group();
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1a2a1a, metalness: 0.1, roughness: 0.8 });

    // PCB
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 1.8), pcbMat));

    // Socket CPU
    const socketMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.02, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.3, roughness: 0.7 })
    );
    socketMesh.position.set(-0.3, 0.035, -0.3);
    g.add(socketMesh);

    // Slots RAM x4
    [-0.1, 0.0, 0.1, 0.2].forEach((offset, i) => {
        const slot = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.12, 0.7),
            new THREE.MeshStandardMaterial({ color: i < 2 ? 0x003a6a : 0x1a1a1a, metalness: 0.3 })
        );
        slot.position.set(0.5 + offset * 2, 0.085, -0.2);
        g.add(slot);
    });

    // Slot PCIe principal
    const pcie = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.04, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x003a6a, metalness: 0.5 })
    );
    pcie.position.set(0, 0.045, 0.4);
    g.add(pcie);

    // Chipset
    const chipset = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.03, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x111118, metalness: 0.6, roughness: 0.4 })
    );
    chipset.position.set(0.3, 0.04, 0.1);
    g.add(chipset);

    // Condensadores
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.5 });
    const capGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.06, 8);
    [[-0.6,0,-0.6],[-0.5,0,-0.6],[-0.4,0,-0.6],[-0.6,0,-0.5],[-0.6,0,-0.4]].forEach(([x,y,z]) => {
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(x, 0.055 + y, z);
        g.add(cap);
    });

    // IO shield
    const io = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.35, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 })
    );
    io.position.set(-0.87, 0.2, -0.65);
    g.add(io);

    return g;
}

function crearPlaceholder(tipo, nombreArchivo) {
    switch(tipo) {
        case 'cpu':    return crearCPU((COMPAT_DB[nombreArchivo] || {}).marca || 'intel');
        case 'ram':    return crearRAM((COMPAT_DB[nombreArchivo] || {}).ramTipo || 'DDR4');
        case 'grafica': return crearGPU();
        case 'caja':   return crearCaja();
        case 'placa':  return crearPlacaBase((COMPAT_DB[nombreArchivo] || {}).socket || 'AM4');
        default: {
            const g = new THREE.Group();
            g.add(new THREE.Mesh(
                new THREE.BoxGeometry(1,1,1),
                new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.6, roughness: 0.4 })
            ));
            return g;
        }
    }
}

// ── ESTADO ──
const TIPOS   = ['caja','placa','cpu','ram','grafica'];
const NOMBRES = { caja:'CAJA', placa:'PLACA BASE', cpu:'CPU', ram:'RAM', grafica:'GRÁFICA' };

let piezasActivas  = { caja:null, placa:null, cpu:null, ram:null, grafica:null };
let preciosActivos = { caja:0,    placa:0,    cpu:0,    ram:0,    grafica:0   };

// ── CARGA DE COMPONENTES ──
const loader = new GLTFLoader();

function actualizarTotal() {
    const el = document.getElementById('precio-total');
    if (el) el.innerText = Object.values(preciosActivos).reduce((a,b) => a+b, 0).toLocaleString('es-ES');
}

window.cambiarComponente = function(tipo, nombreArchivo, nombreBonito, precio) {
    // Eliminar pieza anterior
    if (piezasActivas[tipo]) {
        scene.remove(piezasActivas[tipo]);
        piezasActivas[tipo] = null;
    }

    preciosActivos[tipo] = precio;
    archivoActual[tipo]  = nombreArchivo;
    actualizarTotal();
    verificarCompatibilidad();

    const el = document.getElementById('txt-' + tipo);
    if (el) el.innerHTML = `<span style="color:#00ffff">⏳ ${nombreBonito}...</span>`;

    function colocar(model) {
        normalizarModelo(model, tipo);
        scene.add(model);
        piezasActivas[tipo] = model;
        if (el) el.innerHTML = `<strong>${NOMBRES[tipo]}:</strong> ${nombreBonito} &mdash; ${precio.toLocaleString('es-ES')}€`;
        ocultarCarga();
    }

    loader.load(
        'models/' + nombreArchivo,
        gltf => colocar(gltf.scene),
        undefined,
        () => {
            console.warn('GLB no encontrado: ' + nombreArchivo + ' → usando placeholder');
            colocar(crearPlaceholder(tipo, nombreArchivo));
        }
    );
};

window.reiniciarPC = function() {
    TIPOS.forEach(t => {
        if (piezasActivas[t]) { scene.remove(piezasActivas[t]); piezasActivas[t] = null; }
        preciosActivos[t] = 0;
        archivoActual[t]  = null;
        const el = document.getElementById('txt-' + t);
        if (el) el.innerHTML = `<span style="color:#4a6070">${NOMBRES[t]}: —</span>`;
    });
    actualizarTotal();
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada([], false);
};

// ── ANIMACIÓN ──
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// ── RESIZE ──
window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
