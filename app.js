const imageAltText = 'Pre-wedding moodboard reference';
const swipeThreshold = 48;
const slideDuration = 0.34;

let gallery;
let dialog;
let dialogImage;
let dialogPreviewImage;
let dialogStage;
let dialogClose;
let dialogPrevious;
let dialogNext;
let imageList = [];
let activeImageIndex = 0;
let pointerStart = null;
let isAnimating = false;
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

function getNormalizedIndex(index) {
    return (index + imageList.length) % imageList.length;
}

function setSlidePosition(element, x, opacity = 1) {
    if (window.gsap) {
        gsap.set(element, { x, opacity });
        return;
    }

    element.style.opacity = opacity;
    element.style.transform = `translate3d(${x}px, 0, 0)`;
}

function animateSlide(element, x, opacity = 1, onComplete) {
    if (window.gsap) {
        gsap.to(element, {
            x,
            opacity,
            duration: slideDuration,
            ease: 'power3.out',
            onComplete,
        });
        return;
    }

    setSlidePosition(element, x, opacity);
    onComplete?.();
}

function resetSliderPositions() {
    setSlidePosition(dialogImage, 0);
    setSlidePosition(dialogPreviewImage, 0, 0);
}

function setCurrentImage(index) {
    activeImageIndex = getNormalizedIndex(index);
    const image = imageList[activeImageIndex];
    dialogImage.src = image.image;
    dialogImage.alt = `${imageAltText} ${activeImageIndex + 1}`;
    preloadNeighborImages(activeImageIndex);
}

function preparePreviewImage(index, direction) {
    const normalizedIndex = getNormalizedIndex(index);
    const image = imageList[normalizedIndex];
    const stageWidth = dialogStage.clientWidth;

    dialogPreviewImage.src = image.image;
    dialogPreviewImage.alt = `${imageAltText} ${normalizedIndex + 1}`;
    setSlidePosition(dialogPreviewImage, direction * stageWidth);

    return normalizedIndex;
}

function clearPreviewImage() {
    dialogPreviewImage.removeAttribute('src');
    dialogPreviewImage.alt = '';
    setSlidePosition(dialogPreviewImage, 0, 0);
}

function stopSlideAnimation() {
    if (window.gsap) {
        gsap.killTweensOf([dialogImage, dialogPreviewImage]);
    }

    pointerStart = null;
    isAnimating = false;
}

function showImage(index) {
    if (!imageList.length) {
        return;
    }

    setCurrentImage(index);
    resetSliderPositions();
}

function openPreview(index) {
    showImage(index);
    dialog.showModal();
}

function closePreview() {
    stopSlideAnimation();
    dialog.close();
    dialogImage.removeAttribute('src');
    dialogImage.alt = '';
    clearPreviewImage();
}

function finishSlide(nextIndex) {
    setCurrentImage(nextIndex);
    resetSliderPositions();
    clearPreviewImage();
    isAnimating = false;
}

function animateToImage(index, direction) {
    if (isAnimating || imageList.length < 2) {
        return;
    }

    const nextIndex = preparePreviewImage(index, direction);
    const stageWidth = dialogStage.clientWidth;
    isAnimating = true;

    animateSlide(dialogImage, -direction * stageWidth);
    animateSlide(dialogPreviewImage, 0, 1, () => finishSlide(nextIndex));
}

function snapBackPreview(direction) {
    const stageWidth = dialogStage.clientWidth;
    isAnimating = true;

    animateSlide(dialogImage, 0);
    animateSlide(dialogPreviewImage, direction * stageWidth, 0, () => {
        clearPreviewImage();
        isAnimating = false;
    });
}

function showPreviousImage() {
    animateToImage(activeImageIndex - 1, -1);
}

function showNextImage() {
    animateToImage(activeImageIndex + 1, 1);
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
    stopSlideAnimation();
    dialogImage.removeAttribute('src');
    dialogImage.alt = '';
    clearPreviewImage();
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
    if (!event.isPrimary || isAnimating || imageList.length < 2) {
        return;
    }

    pointerStart = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        direction: 0,
    };

    if (dialogStage.setPointerCapture) {
        dialogStage.setPointerCapture(event.pointerId);
    }
}

function handlePointerMove(event) {
    if (!pointerStart || event.pointerId !== pointerStart.id) {
        return;
    }

    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;

    if (Math.abs(deltaX) < 6 || Math.abs(deltaX) < Math.abs(deltaY)) {
        return;
    }

    const direction = deltaX < 0 ? 1 : -1;
    const stageWidth = dialogStage.clientWidth;

    event.preventDefault();

    if (pointerStart.direction !== direction) {
        pointerStart.direction = direction;
        preparePreviewImage(activeImageIndex + direction, direction);
    }

    setSlidePosition(dialogImage, deltaX);
    setSlidePosition(dialogPreviewImage, direction * stageWidth + deltaX, 1);
}

function handlePointerUp(event) {
    if (!pointerStart || event.pointerId !== pointerStart.id) {
        return;
    }

    const deltaX = event.clientX - pointerStart.x;
    const direction = pointerStart.direction;
    pointerStart = null;

    if (!direction) {
        return;
    }

    if (Math.abs(deltaX) >= swipeThreshold) {
        const nextIndex = getNormalizedIndex(activeImageIndex + direction);
        const stageWidth = dialogStage.clientWidth;
        isAnimating = true;

        animateSlide(dialogImage, -direction * stageWidth);
        animateSlide(dialogPreviewImage, 0, 1, () => finishSlide(nextIndex));
    } else {
        snapBackPreview(direction);
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
    dialogStage.addEventListener('pointerdown', handlePointerDown);
    dialogStage.addEventListener('pointermove', handlePointerMove);
    dialogStage.addEventListener('pointerup', handlePointerUp);
    dialogStage.addEventListener('pointercancel', () => {
        stopSlideAnimation();
        resetSliderPositions();
        clearPreviewImage();
    });
}

function init() {
    gallery = document.querySelector('.card-grid-wrapper');
    dialog = document.querySelector('.image-dialog');
    dialogStage = document.querySelector('.dialog-stage');
    dialogImage = document.querySelector('.dialog-image.current');
    dialogPreviewImage = document.querySelector('.dialog-image.preview');
    dialogClose = document.querySelector('.dialog-close');
    dialogPrevious = document.querySelector('.dialog-nav.previous');
    dialogNext = document.querySelector('.dialog-nav.next');

    if (!gallery || !dialog || !dialogStage || !dialogImage || !dialogPreviewImage || !dialogClose || !dialogPrevious || !dialogNext) {
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
