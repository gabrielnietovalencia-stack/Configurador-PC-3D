 import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

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
const scene    = new THREE.Scene();
scene.background = new THREE.Color(0x111116);
const camera   = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 3, 6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.05;

// ── LUCES ──
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 8, 5); scene.add(dirLight);
scene.add(Object.assign(new THREE.DirectionalLight(0x8888ff, 0.4), { position: new THREE.Vector3(-5,-3,-5) }));
scene.add(new THREE.GridHelper(10, 20, 0x00ffff, 0x333333)).position.y = -0.5;

// ── TRANSFORM CONTROLS ──
const transformControl = new TransformControls(camera, renderer.domElement);
transformControl.addEventListener('dragging-changed', e => controls.enabled = !e.value);
scene.add(transformControl);

// ── COMPATIBILIDAD ──
const COMPAT_DB = {
    'mobo_pro.glb':     { socket:'AM4',     ramTipo:'DDR4' },
    'mobo_generic.glb': { socket:'AM4',     ramTipo:'DDR4' },
    'mobo_z790.glb':    { socket:'LGA1700', ramTipo:'DDR5' },
    'mobo_b660.glb':    { socket:'LGA1700', ramTipo:'DDR4' },
    'cpu_5900x.glb':    { socket:'AM4',  marca:'amd' },
    'cpu_5600x.glb':    { socket:'AM4',  marca:'amd' },
    'cpu_i9.glb':       { socket:'LGA1700', marca:'intel' },
    'cpu_i5.glb':       { socket:'LGA1700', marca:'intel' },
    'ram_ddr4.glb':     { ramTipo:'DDR4' },
    'ram_ddr5.glb':     { ramTipo:'DDR5' },
};
const archivoActual = { caja:null, placa:null, cpu:null, ram:null, grafica:null };

function verificarCompatibilidad() {
    const errores = [];
    const placa = archivoActual.placa ? COMPAT_DB[archivoActual.placa] : null;
    const cpu   = archivoActual.cpu   ? COMPAT_DB[archivoActual.cpu]   : null;
    const ram   = archivoActual.ram   ? COMPAT_DB[archivoActual.ram]   : null;
    if (placa && cpu  && placa.socket  !== cpu.socket)   errores.push(`Socket CPU (${cpu.socket}) incompatible con placa (${placa.socket})`);
    if (placa && ram  && placa.ramTipo !== ram.ramTipo)  errores.push(`RAM ${ram.ramTipo} incompatible con placa (requiere ${placa.ramTipo})`);
    const todo = !!(archivoActual.placa && archivoActual.cpu && archivoActual.ram);
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada(errores, todo);
}

// ── NORMALIZACIÓN ──
const TAMAÑOS = { caja:2.5, placa:1.0, cpu:0.45, ram:0.7, grafica:0.9 };
const SUELO   = -0.5;

function normalizarModelo(model, tipo) {
    const box1 = new THREE.Box3().setFromObject(model);
    const sz   = box1.getSize(new THREE.Vector3());
    const esc  = TAMAÑOS[tipo] / Math.max(sz.x, sz.y, sz.z);
    model.scale.setScalar(esc);
    const box2 = new THREE.Box3().setFromObject(model);
    const cnt  = box2.getCenter(new THREE.Vector3());
    model.position.x -= cnt.x;
    model.position.z -= cnt.z;
    model.position.y  = SUELO - box2.min.y + model.position.y;
    return esc;
}

// ── PLACEHOLDERS DETALLADOS ──
function crearCPU(marca) {
    const g = new THREE.Group();
    const esIntel = marca === 'intel';

    // PCB/Sustrato
    const pcbColor = esIntel ? 0x005060 : 0x006030;
    const pcb = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.04, 1.05),
        new THREE.MeshStandardMaterial({ color: pcbColor, metalness: 0.2, roughness: 0.8 })
    );
    g.add(pcb);

    // Pines de contacto en la parte inferior (cuadrícula)
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.05 });
    const pinGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.025, 6);
    for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
            if (Math.abs(x) === 5 && Math.abs(z) === 5) continue; // esquinas vacías
            const pin = new THREE.Mesh(pinGeo, pinMat);
            pin.position.set(x * 0.087, -0.03, z * 0.087);
            g.add(pin);
        }
    }

    // Condensadores alrededor del IHS
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2a, metalness: 0.6, roughness: 0.4 });
    const capGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.05, 8);
    [[-0.45,0.04,0],[0.45,0.04,0],[0,0.04,-0.45],[0,0.04,0.45],
     [-0.45,0.04,0.22],[0.45,0.04,-0.22],[-0.22,0.04,0.45],[0.22,0.04,-0.45]
    ].forEach(([x,y,z]) => {
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(x,y,z);
        g.add(cap);
    });

    // IHS base (plate más ancha)
    const ihsBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.015, 0.82),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.95, roughness: 0.05 })
    );
    ihsBase.position.y = 0.027;
    g.add(ihsBase);

    // IHS elevado (la "caja" central de metal)
    const ihsMat = new THREE.MeshStandardMaterial({ color: 0xc8c8cc, metalness: 0.9, roughness: 0.08 });
    const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.065, 0.75), ihsMat);
    ihs.position.y = 0.055;
    g.add(ihs);

    // Chanfer/borde biselado del IHS (más claro arriba)
    const topMat = new THREE.MeshStandardMaterial({ color: 0xd8d8dc, metalness: 0.85, roughness: 0.05 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.008, 0.68), topMat);
    top.position.y = 0.091;
    g.add(top);

    // Logotipo/marca en el IHS (pequeño plano con color)
    const logoColor = esIntel ? 0x0071c5 : 0xed1c24;
    const logo = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.002, 0.07),
        new THREE.MeshStandardMaterial({ color: logoColor, metalness: 0, roughness: 1 })
    );
    logo.position.set(-0.12, 0.096, 0);
    g.add(logo);

    // Texto zona gris del IHS
    const gris = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.002, 0.18),
        new THREE.MeshStandardMaterial({ color: 0x888890, metalness: 0.5, roughness: 0.6 })
    );
    gris.position.set(0.1, 0.096, 0);
    g.add(gris);

    // Muesca de socket (Intel: una esquina, AMD: dos entalladuras)
    if (esIntel) {
        const notch = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.05, 0.14),
            new THREE.MeshStandardMaterial({ color: pcbColor })
        );
        notch.position.set(-0.52, 0.02, -0.28);
        g.add(notch);
    } else {
        // AMD: esquina cortada (triángulo)
        [-1, 1].forEach(side => {
            const notch = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.05, 0.04),
                new THREE.MeshStandardMaterial({ color: pcbColor })
            );
            notch.position.set(side * 0.52, 0.02, 0);
            g.add(notch);
        });
    }

    return g;
}

function crearRAM(tipo) {
    const g = new THREE.Group();
    const esDDR5 = tipo === 'DDR5';

    // PCB verde
    const pcb = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 1.5, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x1a3a1a, metalness: 0.1, roughness: 0.8 })
    );
    g.add(pcb);

    // Disipador metálico (cubre 80% del stick)
    const hsMat = new THREE.MeshStandardMaterial({
        color: esDDR5 ? 0x1a1a3a : 0x2a1a1a,
        metalness: 0.8, roughness: 0.3
    });
    const hs = new THREE.Mesh(new THREE.BoxGeometry(0.175, 1.12, 0.055), hsMat);
    hs.position.y = 0.18;
    g.add(hs);

    // Banda de color del disipador
    const bandColor = esDDR5 ? 0x5555ee : 0xcc2222;
    const band = new THREE.Mesh(
        new THREE.BoxGeometry(0.176, 0.12, 0.056),
        new THREE.MeshStandardMaterial({ color: bandColor, metalness: 0.6, roughness: 0.3 })
    );
    band.position.y = 0.62;
    g.add(band);

    // Aletas del disipador (laterales)
    [-0.09, 0.09].forEach(side => {
        for (let i = 0; i < 5; i++) {
            const fin = new THREE.Mesh(
                new THREE.BoxGeometry(0.008, 0.9, 0.01),
                new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 })
            );
            fin.position.set(side, 0.18 + (i-2)*0.06, 0.033);
            g.add(fin);
        }
    });

    // Chips de memoria (visible en la parte baja del PCB sin disipador)
    const chipMat = new THREE.MeshStandardMaterial({ color: 0x111820, metalness: 0.3, roughness: 0.7 });
    for (let i = 0; i < 4; i++) {
        const chip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.02), chipMat);
        chip.position.set(0, -0.56 + i * 0.0, 0.025); // zona sin disipador
        // Solo muestra chips en la zona inferior
        chip.position.y = -0.5 + i * 0.01;
        g.add(chip);
    }

    // Conector dorado inferior
    const connMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 0.9, roughness: 0.1 });
    const conn = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.22, 0.038), connMat);
    conn.position.y = -0.64;
    g.add(conn);

    // Pines del conector
    const pinMat2 = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1.0, roughness: 0.05 });
    for (let i = -4; i <= 4; i++) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.18, 0.04), pinMat2);
        pin.position.set(i * 0.016, -0.64, 0);
        g.add(pin);
    }

    // Muesca del conector (para evitar instalación incorrecta)
    const notch = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.25, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x1a3a1a })
    );
    notch.position.set(0.03, -0.64, 0);
    g.add(notch);

    return g;
}

function crearPlaceholder(tipo, nombreArchivo) {
    if (tipo === 'cpu') {
        const info = COMPAT_DB[nombreArchivo] || {};
        return crearCPU(info.marca || 'intel');
    }
    if (tipo === 'ram') {
        const info = COMPAT_DB[nombreArchivo] || {};
        return crearRAM(info.ramTipo || 'DDR4');
    }

    // Fallback genérico para caja / placa / gráfica
    const g   = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.6, roughness: 0.4 });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1), mat));
    return g;
}

// ── GUI ──
const TIPOS   = ['caja','placa','cpu','ram','grafica'];
const NOMBRES = { caja:'CAJA', placa:'PLACA BASE', cpu:'CPU', ram:'RAM', grafica:'GRÁFICA' };
const ICONOS  = { caja:'📦',   placa:'🎛️',          cpu:'🔲',  ram:'💾',  grafica:'🎮' };

let piezasActivas  = { caja:null, placa:null, cpu:null, ram:null, grafica:null };
let preciosActivos = { caja:0,    placa:0,    cpu:0,   ram:0,   grafica:0    };

const gui    = new GUI({ title:'🛠️ Calibrador 3D Avanzado' });
const params = { piezaAEditar:'Ninguna', modoRaton:'translate', autoRotar:false };
TIPOS.forEach(t => { params[t+'_Scale']=1; params[t+'_X']=0; params[t+'_Y']=0; params[t+'_Z']=0; params[t+'_RotX']=0; params[t+'_RotY']=0; params[t+'_RotZ']=0; });

const fr = gui.addFolder('🧲 HERRAMIENTAS DE RATÓN');
fr.add(params,'piezaAEditar',['Ninguna','Caja','Placa','CPU','RAM','Grafica']).name('👉 Agarrar pieza').onChange(v => {
    const m = {Ninguna:null,Caja:'caja',Placa:'placa',CPU:'cpu',RAM:'ram',Grafica:'grafica'};
    const t = m[v]; if (!t) { transformControl.detach(); return; }
    if (piezasActivas[t]) transformControl.attach(piezasActivas[t]);
});
fr.add(params,'modoRaton',{Mover:'translate',Rotar:'rotate',Escalar:'scale'}).name('Acción').onChange(v => transformControl.setMode(v));

TIPOS.forEach(t => {
    const f = gui.addFolder(ICONOS[t]+' '+NOMBRES[t]+' (Manual)');
    f.add(params,t+'_Scale',0.001,200,0.01).name('Escala').onChange(v => { if(piezasActivas[t]) piezasActivas[t].scale.setScalar(v); });
    ['X','Y','Z'].forEach(e => f.add(params,t+'_'+e,-10,10,0.01).name('Mover '+e).onChange(v => { if(piezasActivas[t]) piezasActivas[t].position[e.toLowerCase()]=v; }));
    ['RotX','RotY','RotZ'].forEach(r => f.add(params,t+'_'+r,-6.28,6.28,0.01).name('Rotar '+r.slice(-1)).onChange(v => { if(piezasActivas[t]) piezasActivas[t].rotation[r.slice(-1).toLowerCase()]=v; }));
    f.close();
});
gui.add(params,'autoRotar').name('🔄 Auto-Rotación');

transformControl.addEventListener('change', () => {
    const obj = transformControl.object; if (!obj) return;
    const t = TIPOS.find(t => piezasActivas[t] === obj); if (!t) return;
    params[t+'_X']=obj.position.x; params[t+'_Y']=obj.position.y; params[t+'_Z']=obj.position.z;
    params[t+'_RotX']=obj.rotation.x; params[t+'_RotY']=obj.rotation.y; params[t+'_RotZ']=obj.rotation.z;
    params[t+'_Scale']=obj.scale.x;
    gui.controllersRecursive().forEach(c => c.updateDisplay());
});

// ── CARGA DE COMPONENTES ──
const loader = new GLTFLoader(loadingManager);

function actualizarTotal() {
    const el = document.getElementById('precio-total');
    if (el) el.innerText = Object.values(preciosActivos).reduce((a,b)=>a+b,0).toLocaleString('es-ES');
}

window.cambiarComponente = function(tipo, nombreArchivo, nombreBonito, precio) {
    if (piezasActivas[tipo]) {
        if (transformControl.object === piezasActivas[tipo]) transformControl.detach();
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
        const esc = normalizarModelo(model, tipo);
        params[tipo+'_Scale']=esc; params[tipo+'_X']=model.position.x;
        params[tipo+'_Y']=model.position.y; params[tipo+'_Z']=model.position.z;
        params[tipo+'_RotX']=params[tipo+'_RotY']=params[tipo+'_RotZ']=0;
        gui.controllersRecursive().forEach(c=>c.updateDisplay());
        scene.add(model);
        piezasActivas[tipo] = model;
        if (el) el.innerHTML = '<strong>'+NOMBRES[tipo]+':</strong> '+nombreBonito+' &mdash; '+precio.toLocaleString('es-ES')+'€';
    }

    loader.load('models/'+nombreArchivo, gltf => colocar(gltf.scene), undefined, () => {
        console.warn('GLB no encontrado: '+nombreArchivo+' → placeholder');
        colocar(crearPlaceholder(tipo, nombreArchivo));
    });
};

window.reiniciarPC = function() {
    transformControl.detach();
    TIPOS.forEach(t => {
        if (piezasActivas[t]) { scene.remove(piezasActivas[t]); piezasActivas[t]=null; }
        preciosActivos[t]=0; archivoActual[t]=null;
        params[t+'_Scale']=1; params[t+'_X']=params[t+'_Y']=params[t+'_Z']=0;
        params[t+'_RotX']=params[t+'_RotY']=params[t+'_RotZ']=0;
        const el=document.getElementById('txt-'+t);
        if (el) el.innerHTML='<span style="color:#4a6070">'+NOMBRES[t]+': —</span>';
    });
    gui.controllersRecursive().forEach(c=>c.updateDisplay());
    actualizarTotal();
    if (window.onCompatibilidadActualizada) window.onCompatibilidadActualizada([],false);
};

// ── ANIMACIÓN ──
function animate() {
    requestAnimationFrame(animate);
    controls.autoRotate      = transformControl.object ? false : params.autoRotar;
    controls.autoRotateSpeed = 1.5;
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
