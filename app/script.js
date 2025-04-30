function registrarDecision(decision, destino) {
    fetch('/guardar-decision', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            usuario_id: 1, // Esto podría ser dinámico según el usuario actual
            decision: decision,
            ubicacion: 'SalaDelReyOPHombre'
        })
    }).then(() => {
        window.location.href = destino;
    }).catch(err => console.error('Error al enviar decisión:', err));
}