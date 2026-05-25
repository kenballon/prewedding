const imageAltText = 'Pre-wedding moodboard reference';
const swipeThreshold = 48;

let gallery;
let dialog;
let dialogImage;
let dialogClose;
let dialogPrevious;
let dialogNext;
let imageList = [];
let activeImageIndex = 0;
let pointerStart = null;
const preloadedImages = new Set();

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
    card.dataset.index = String(index);
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
    imageList = images;

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

function preloadImage(index) {
    if (!imageList.length) {
        return;
    }

    const image = imageList[(index + imageList.length) % imageList.length];

    if (preloadedImages.has(image.image)) {
        return;
    }

    const preload = new Image();
    preload.src = image.image;
    preloadedImages.add(image.image);
}

function preloadNeighborImages(index) {
    preloadImage(index - 1);
    preloadImage(index + 1);
}

function showImage(index) {
    if (!imageList.length) {
        return;
    }

    activeImageIndex = (index + imageList.length) % imageList.length;
    const image = imageList[activeImageIndex];
    dialogImage.src = image.image;
    dialogImage.alt = `${imageAltText} ${activeImageIndex + 1}`;
    preloadNeighborImages(activeImageIndex);
}

function openPreview(index) {
    showImage(index);
    dialog.showModal();
}

function closePreview() {
    dialog.close();
    dialogImage.removeAttribute('src');
    dialogImage.alt = '';
}

function showPreviousImage() {
    showImage(activeImageIndex - 1);
}

function showNextImage() {
    showImage(activeImageIndex + 1);
}

function handleGalleryClick(event) {
    const card = event.target.closest('.card-item');

    if (!card) {
        return;
    }

    const index = Number.parseInt(card.dataset.index, 10);

    if (!Number.isNaN(index)) {
        openPreview(index);
    }
}

function handleDialogClick(event) {
    if (event.target === dialog) {
        closePreview();
    }
}

function clearDialogImage() {
    dialogImage.removeAttribute('src');
    dialogImage.alt = '';
}

function handleDialogKeydown(event) {
    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            showPreviousImage();
            break;
        case 'ArrowRight':
            event.preventDefault();
            showNextImage();
            break;
        default:
            break;
    }
}

function handlePointerDown(event) {
    if (!event.isPrimary) {
        return;
    }

    pointerStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
    };

    if (dialogImage.setPointerCapture) {
        dialogImage.setPointerCapture(event.pointerId);
    }
}

function handlePointerUp(event) {
    if (!pointerStart || event.pointerId !== pointerStart.id) {
        return;
    }

    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    pointerStart = null;

    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY)) {
        return;
    }

    if (deltaX > 0) {
        showPreviousImage();
    } else {
        showNextImage();
    }
}

function bindEvents() {
    gallery.addEventListener('click', handleGalleryClick);
    dialogClose.addEventListener('click', closePreview);
    dialogPrevious.addEventListener('click', showPreviousImage);
    dialogNext.addEventListener('click', showNextImage);
    dialog.addEventListener('click', handleDialogClick);
    dialog.addEventListener('cancel', clearDialogImage);
    dialog.addEventListener('keydown', handleDialogKeydown);
    dialogImage.addEventListener('pointerdown', handlePointerDown);
    dialogImage.addEventListener('pointerup', handlePointerUp);
    dialogImage.addEventListener('pointercancel', () => {
        pointerStart = null;
    });
}

function init() {
    gallery = document.querySelector('.card-grid-wrapper');
    dialog = document.querySelector('.image-dialog');
    dialogImage = document.querySelector('.dialog-image');
    dialogClose = document.querySelector('.dialog-close');
    dialogPrevious = document.querySelector('.dialog-nav.previous');
    dialogNext = document.querySelector('.dialog-nav.next');

    if (!gallery || !dialog || !dialogImage || !dialogClose || !dialogPrevious || !dialogNext) {
        return;
    }

    bindEvents();
    getImages()
        .then(renderImages)
        .catch((error) => {
            console.error(error);
            renderStatus('Unable to load references right now.');
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
