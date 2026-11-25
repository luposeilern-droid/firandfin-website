(() => {
  const products = {
    vest: { name: 'Fur & Fin Heated Vest', category: 'Heated vests', image: 'vest-concept.svg' },
    'cap-navy': { name: 'Fur & Fin Cap — Navy', category: 'Caps · Navy', image: 'cap-navy-white.png', photo: 'cap-navy', colour: 'Navy' },
    'cap-brown': { name: 'Fur & Fin Cap — Brown', category: 'Caps · Brown', image: 'cap-brown-white.png', photo: 'cap-brown', colour: 'Brown' },
    'cap-green': { name: 'Fur & Fin Cap — Dark Green', category: 'Caps · Dark Green', image: 'cap-green-white.png', photo: 'cap-green', colour: 'Dark Green' }
  };
  const dialog = document.querySelector('.product-dialog');
  let selectedProduct;
  const viewControls = document.querySelector('.cap-view-controls');
  const setCapView = view => {
    const back = view === 'back';
    const image = document.getElementById('dialog-image');
    image.src = 'images/' + (back ? selectedProduct.image.replace('-white.png', '-back-white.png') : selectedProduct.image);
    image.alt = selectedProduct.colour + ' Fur & Fin cap — ' + (back ? 'back with HUNT MORE WORRY LESS embroidery' : 'front with antler and fin logo');
    document.getElementById('dialog-image-label').textContent = selectedProduct.colour + ' · ' + (back ? 'Back' : 'Front');
    viewControls.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.capView === view)));
  };
  viewControls.querySelectorAll('button').forEach(button => button.addEventListener('click', () => setCapView(button.dataset.capView)));
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      let count = 0;
      document.querySelectorAll('[data-product]').forEach(item => {
        item.hidden = selected !== 'all' && item.dataset.product !== selected;
        if (!item.hidden) count++;
      });
      document.querySelector('.product-count').textContent = count + (count === 1 ? ' product' : ' products');
    });
  });
  document.querySelectorAll('[data-open]').forEach(button => {
    button.addEventListener('click', () => {
      const product = products[button.dataset.open];
      selectedProduct = product;
      viewControls.hidden = !product.photo;
      document.getElementById('dialog-title').textContent = product.name;
      document.getElementById('dialog-category').textContent = product.category;
      const image = document.getElementById('dialog-image');
      image.src = 'images/' + product.image;
      image.alt = product.photo ? product.colour + ' Fur & Fin cap with embroidered antler and fin logo' : 'Design concept for ' + product.name;
      image.parentElement.className = 'dialog-image' + (product.photo ? ' cap-photo ' + product.photo : '');
      document.getElementById('dialog-image-label').textContent = product.photo ? product.colour : 'Design concept';
      document.getElementById('dialog-description').textContent = product.photo ? product.colour + ' cap with the embroidered Fur & Fin antler and fin logo. The back features the slogan “HUNT MORE WORRY LESS”. Prices and launch details will be announced.' : 'Part of the first Fur & Fin collection. Final product photos, available options and full details will be shared at launch.';
      document.getElementById('product-enquiry').href = 'mailto:lupo.seilern@icloud.com?subject=' + encodeURIComponent('Question about ' + product.name);
      if (product.photo) setCapView('front');
      dialog.showModal();
    });
  });
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });
})();
