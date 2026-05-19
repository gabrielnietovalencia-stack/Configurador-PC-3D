<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Configurador PC 3D</title>
    <style>
        body { margin: 0; overflow: hidden; background-color: #111; font-family: sans-serif; }
        canvas { display: block; }
        
        #menu {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(20, 20, 20, 0.85);
            padding: 20px;
            border-radius: 10px;
            color: white;
            width: 220px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            border: 1px solid #333;
            z-index: 10;
        }
        h3 { margin-top: 0; color: #00ffff; border-bottom: 1px solid #333; padding-bottom: 5px; }
        .seccion { margin-bottom: 15px; }
        .titulo-sec { font-size: 12px; text-transform: uppercase; color: #aaa; margin-bottom: 5px; }
        
        button {
            display: block;
            width: 100%;
            background: #252525;
            color: #fff;
            border: 1px solid #444;
            padding: 8px;
            margin-bottom: 5px;
            border-radius: 5px;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
        }
        button:hover {
            background: #00ffff;
            color: #000;
            font-weight: bold;
        }

        /* NUEVO: Cuadro de resumen */
        #resumen {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #333;
            font-size: 13px;
            color: #00ff88;
        }
    </style>
    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
            }
        }
    </script>
</head>
<body>

    <div id="menu">
        <h3>Configurador PC</h3>
        
        <div class="seccion">
            <div class="titulo-sec">Chasis (Cajas)</div>
            <button onclick="cambiarComponente('caja', 'case_corsair.glb', 'Corsair iCUE')">Corsair Case</button>
            <button onclick="cambiarComponente('caja', 'case_fractal.glb', 'Fractal North')">Fractal Case</button>
            <button onclick="cambiarComponente('caja', 'case_nzxt.glb', 'NZXT H9')">NZXT Case</button>
        </div>

        <div class="seccion">
            <div class="titulo-sec">Placa Base</div>
            <button onclick="cambiarComponente('placa', 'mobo_pro.glb', 'ASUS Pro WS')">Mobo Pro</button>
            <button onclick="cambiarComponente('placa', 'mobo_generic.glb', 'Mobo Genérica')">Mobo Generic</button>
        </div>

        <div class="seccion">
            <div class="titulo-sec">Tarjeta Gráfica</div>
            <button onclick="cambiarComponente('grafica', 'gpu_3090.glb', 'RTX 3090 Ti')">RTX 3090</button>
            <button onclick="cambiarComponente('grafica', 'gpu_4090.glb', 'RTX 4090 ROG')">RTX 4090</button>
            <button onclick="cambiarComponente('grafica', 'gpu_9070.glb', 'RTX 9070 (Concept)')">RTX 9070</button>
        </div>

        <div id="resumen">
            <strong>Componentes activos:</strong>
            <div id="txt-caja">Caja: Ninguna</div>
            <div id="txt-placa">Placa: Ninguna</div>
            <div id="txt-grafica">Gráfica: Ninguna</div>
        </div>
    </div>

    <script type="module" src="app.js"></script>
</body>
</html>
