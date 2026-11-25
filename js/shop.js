(() => {
  const products = {
    vest: { name: 'Fur & Fin Heated Vest', category: 'Heated vests', image: 'vest-concept.svg' },
    cap: { name: 'Fur & Fin Cap', category: 'Caps', image: 'cap-concept.svg' }
  };
  const dialog = document.querySelector('.product-dialog');
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
      document.getElementById('dialog-title').textContent = product.name;
      document.getElementById('dialog-category').textContent = product.category;
      const image = document.getElementById('dialog-image');
      image.src = 'images/' + product.image;
      image.alt = 'Design concept for ' + product.name;
      document.getElementById('product-enquiry').href = 'mailto:lupo.seilern@icloud.com?subject=' + encodeURIComponent('Question about ' + product.name);
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
