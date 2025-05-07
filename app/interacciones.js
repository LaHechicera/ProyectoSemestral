function guardarDecision(texto, destino) {
    const usuarioId = localStorage.getItem('usuarioId');

    if (!usuarioId) {
        alert('Usuario no registrado.');
        return;
    }

    const data = {
        usuarioId,
        decision: texto || 'Sin texto',
        tiempoJuego: Date.now(),
        opciones: destino || 'Sin destino'
    };

    console.log('Enviando decisión al backend:', data);
    window.electronAPI.guardarDecision(data); // puente Electron
    window.location.href = destino;
}

function registrarUsuario(nombre, callback) {
    if (!nombre || nombre.trim() === '') {
        alert('Por favor ingresa un nombre válido.');
        return;
    }

    console.log('Registrando usuario con nombre:', nombre);
    window.electronAPI.registrarUsuario(nombre);

    // Este listener puede ejecutarse muchas veces si no se gestiona bien
    const listener = (id) => {
        console.log('ID de usuario recibido:', id);
        localStorage.setItem('usuarioId', id);
        callback(id);
        window.electronAPI.removeUsuarioRegistradoListener(listener); // 👈 importante
    };

    window.electronAPI.onUsuarioRegistrado(listener);
}
