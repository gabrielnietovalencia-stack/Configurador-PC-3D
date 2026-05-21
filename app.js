// Busca donde cargues tus cajas (Corsair, Fractal, NZXT) y pon esto dentro:
loader.load('models/tu_archivo_aqui.gltf', function (gltf) { // <-- Asegúrate de poner el nombre correcto de cada modelo
    const model = gltf.scene;

    // 1. ARREGLAR EL COLOR NEGRO (Como pasa con la Fractal)
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
                child.material.roughness = 0.6; 
                child.material.metalness = 0.2; 
            }
        }
    });

    // 2. ARREGLAR EL TAMAÑO (Para que la Corsair no sea una hormiga ni la Fractal un gigante)
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size); 
    const center = new THREE.Vector3();
    box.getCenter(center); 

    // Centrar el pivote del modelo en el medio de la rejilla
    model.position.x += (model.position.x - center.x);
    model.position.y += (model.position.y - center.y);
    model.position.z += (model.position.z - center.z);

    // Forzar a que todas midan exactamente lo mismo de alto (por ejemplo, 5 unidades)
    const targetHeight = 5.0; 
    const scaleFactor = targetHeight / size.y;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Apoyar la base de la caja justo encima del suelo gris
    const updatedBox = new THREE.Box3().setFromObject(model);
    model.position.y = -updatedBox.min.y; 

    // Añadir el modelo corregido a la escena
    scene.add(model);
});
