const gallery = document.querySelector('.card-grid-wrapper');
const dialog = document.querySelector('.image-dialog');
const dialogImage = document.querySelector('.dialog-image');
const dialogClose = document.querySelector('.dialog-close');

const imageAltText = 'Pre-wedding moodboard reference';

async function getImages() {
    const response = await fetch('data.json');

    if (!response.ok) {
        throw new Error(`Failed to load images: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data.images) ? data.images : [];
}

function createImageCard(image, index) {
    const card = document.createElement('button');
    card.className = 'card-item';
    card.type = 'button';
    card.dataset.id = image.id;
    card.dataset.src = image.image;
    card.setAttribute('aria-label', `Open reference ${index + 1}`);

    const img = document.createElement('img');
    img.src = image.image;
    img.alt = `${imageAltText} ${index + 1}`;
    img.loading = index < 6 ? 'eager' : 'lazy';
    img.decoding = 'async';

    card.append(img);
    return card;
}

function renderStatus(message) {
    gallery.replaceChildren();

    const status = document.createElement('p');
    status.className = 'gallery-status';
    status.textContent = message;
    gallery.append(status);
}

function renderImages(images) {
    if (!images.length) {
        renderStatus('No references found yet.');
        return;
    }

    const fragment = document.createDocumentFragment();
    images.forEach((image, index) => {
        fragment.append(createImageCard(image, index));
    });

    gallery.replaceChildren(fragment);
}

function openPreview(src, alt) {
    dialogImage.src = src;
    dialogImage.alt = alt;
    dialog.showModal();
}

function closePreview() {
    dialog.close();
    dialogImage.removeAttribute('src');
    dialogImage.alt = '';
}

gallery?.addEventListener('click', (event) => {
    const card = event.target.closest('.card-item');

    if (!card) {
        return;
    }

    const image = card.querySelector('img');
    openPreview(card.dataset.src, image.alt);
});

dialogClose?.addEventListener('click', closePreview);

dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) {
        closePreview();
    }
});

dialog?.addEventListener('cancel', () => {
    dialogImage.removeAttribute('src');
    dialogImage.alt = '';
});

getImages()
    .then(renderImages)
    .catch((error) => {
        console.error(error);
        renderStatus('Unable to load references right now.');
    });
