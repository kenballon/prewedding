const imgCards = document.querySelector('.card-grid-wrapper');

class Images {
    async getImages() {
        try {
            const res = await fetch('data.json');
            const data = await res.json();
            return data.images;
        } catch (err) {
            console.log(err);
        }
    }
}


class UIRender {
    displayImages(images) {
        let uiRender = '';

        images.forEach(image => {
            uiRender += `
            <div class="card-item" data-id=${image.id}>
                <img src="${image.image}" class="img" alt="woman portrait" data-id=${image.id} >
            </div>
            `
        });

        imgCards.insertAdjacentHTML("beforeend", uiRender);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ui = new UIRender();
    const images = new Images();

    const preventBodyScroll = document.querySelector('body')

    images.getImages().then(data => {
        ui.displayImages(data);
    }).then(() => {
        // get all array of images 
        const images = document.querySelectorAll('.img');
        
        // loop to all images
        images.forEach(img => {
            // when clicked it should open the modal for image
            img.addEventListener('click', () => {     
                // create element for image wrapper in modal            
                const modal = `
                <div class="img-container" >
                        <img src="${img.getAttribute('src')}" loading="lazy" alt="woman portrait" />
                </div>
                `;

                const insertModal = document.querySelector('.modal-bg');

                insertModal.style.display = 'block';

                insertModal.innerHTML = modal;

                preventBodyScroll.classList.add('opened-modal')
            })            
        })
        
        // close image modal 
        const modalActive = document.querySelector('.modal-bg');

        modalActive.addEventListener('click', (e) => {
            let targetEl = e.target;
            targetEl = targetEl.parentNode;

            if(modalActive.style.display == 'block'){                
                // when click this should close the modal
                modalActive.style.display = 'none';
                preventBodyScroll.classList.remove('opened-modal')
            }
        })
        
    })
})






