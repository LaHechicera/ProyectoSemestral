// Este script maneja la lógica de guardado de decisiones y redirección para las páginas de historia.
document.addEventListener('DOMContentLoaded', () => {
    console.log('storyLogic.js: Script de lógica de historia cargado.');

    const userId = localStorage.getItem('usuarioId'); // Obtener el ID del usuario
    // Si no hay ID de usuario, no podemos guardar decisiones, solo loguear una advertencia.
    if (!userId) {
        console.warn('storyLogic.js: No se encontró el ID de usuario en localStorage. Las decisiones no se guardarán.');
    }

    //Guarda el texto de la decisión en la base de datos y luego redirige a la URL de destino.
    async function saveDecisionAndRedirect(buttonText, targetUrl) {
        if (userId && window.api && window.api.saveStoryDecision) {
            try {
                console.log('storyLogic.js: Intentando guardar decisión para userId:', userId, 'Decisión:', buttonText);
                const result = await window.api.saveStoryDecision(userId, buttonText);
                if (result.success) {
                    console.log('storyLogic.js: Decisión guardada exitosamente:', result.message);
                } else {
                    console.error('storyLogic.js: Error al guardar decisión:', result.message);
                }
            } catch (error) {
                console.error('storyLogic.js: Error IPC al guardar decisión:', error);
            }
        } else {
            console.warn('storyLogic.js: No se pudo guardar la decisión. API no disponible o userId no encontrado.');
        }

        // Siempre redirigir, independientemente del resultado del guardado para no interrumpir el flujo.
        console.log('storyLogic.js: Redirigiendo a:', targetUrl);
        window.location.href = targetUrl;
    }

    // Seleccionar todos los botones con la clase 'decision-button'
    const decisionButtons = document.querySelectorAll('.decision-button');

    if (decisionButtons.length > 0) {
        console.log(`storyLogic.js: Encontrados ${decisionButtons.length} botones de decisión. Adjuntando listeners.`);
        decisionButtons.forEach(button => {
            const targetUrl = button.dataset.targetUrl; // Obtener la URL de un atributo de datos
            if (targetUrl) {
                button.addEventListener('click', () => {
                    const decisionText = button.textContent.trim();
                    console.log('storyLogic.js: Botón clicado. Texto:', decisionText, 'URL:', targetUrl);
                    saveDecisionAndRedirect(decisionText, targetUrl);
                });
            } else {
                console.error('storyLogic.js: Botón sin atributo data-target-url:', button);
            }
        });
    } else {
        console.warn('storyLogic.js: No se encontraron botones con la clase "decision-button" en esta página.');
    }
});
