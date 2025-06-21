document.addEventListener('DOMContentLoaded', () => {
    const giphyImageContainer = document.getElementById('giphy-image-container');
    console.log('Contenedor Giphy encontrado:', giphyImageContainer);

    const specificGifUrl = 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDduOGl3dXk0ZzQ3MTgwZ3pncWczNXUxeHNldTFvc3J0OXNsZDJ4byZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/kBViUe2sIkuB9AGlAa/giphy.gif';
    console.log('URL del GIF específico:', specificGifUrl);

    if (giphyImageContainer) {
        giphyImageContainer.innerHTML = '';

        const imgElement = document.createElement('img');
        imgElement.src = specificGifUrl;
        imgElement.alt = 'GIF específico de Giphy';
        imgElement.classList.add('giphy-gif'); //clase en CSS
        imgElement.onerror = () => {
            console.error('Error al cargar la imagen del GIF. URL:', specificGifUrl);
            giphyImageContainer.innerHTML = '<p>No se pudo cargar el GIF específico.</p>';
        };
        imgElement.onload = () => {
            console.log('GIF específico cargado exitosamente.');
        };
        giphyImageContainer.appendChild(imgElement);
    } else {
        console.error('El elemento #giphy-image-container no fue encontrado en el DOM.');
    }
});