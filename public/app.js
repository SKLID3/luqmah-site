(() => {
  const whatsapp = '966566536790';
  const storageKey = 'luqmah-thawq-order-v1';
  const cards = [...document.querySelectorAll('.dish-card')];
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const dock = document.getElementById('cart-dock');
  const dialog = document.getElementById('cart-dialog');
  const lines = document.getElementById('cart-lines');
  const empty = document.getElementById('cart-empty');
  const checkout = document.getElementById('checkout-link');
  const year = document.getElementById('current-year');
  const numberFormat = new Intl.NumberFormat('ar-SA');
  const dishNames = new Map(cards.map((card) => [card.dataset.id, card.dataset.name]));
  let activeFilter = 'all';
  let cart = readCart();

  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return Object.fromEntries(Object.entries(raw).filter(([id, qty]) => dishNames.has(id) && Number.isInteger(qty) && qty > 0));
    } catch {
      return {};
    }
  }

  function saveCart() {
    try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch { /* Cart still works for this page session. */ }
  }

  function countUnits() {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }

  function setQuantity(id, next) {
    if (!dishNames.has(id)) return;
    if (next > 0) cart[id] = Math.min(99, next);
    else delete cart[id];
    saveCart();
    renderCart();
  }

  function makeCartLine(id, quantity) {
    const row = document.createElement('article');
    row.className = 'cart-line';
    const name = document.createElement('strong');
    name.className = 'cart-line-name';
    name.textContent = dishNames.get(id);
    const remove = document.createElement('button');
    remove.className = 'remove-item';
    remove.type = 'button';
    remove.dataset.remove = id;
    remove.textContent = 'حذف';
    remove.setAttribute('aria-label', `احذف ${dishNames.get(id)} من طلبك`);
    const controls = document.createElement('div');
    controls.className = 'quantity-control cart-quantity';
    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.dataset.decrease = id;
    decrease.textContent = '−';
    decrease.setAttribute('aria-label', `أنقص كمية ${dishNames.get(id)}`);
    const value = document.createElement('span');
    value.textContent = numberFormat.format(quantity);
    value.setAttribute('aria-label', `الكمية ${quantity}`);
    const increase = document.createElement('button');
    increase.type = 'button';
    increase.dataset.increase = id;
    increase.textContent = '＋';
    increase.setAttribute('aria-label', `زد كمية ${dishNames.get(id)}`);
    controls.append(decrease, value, increase);
    row.append(name, controls, remove);
    return row;
  }

  function makeMessage() {
    const selected = Object.entries(cart).filter(([id, qty]) => dishNames.has(id) && qty > 0);
    const items = selected.map(([id, qty]) => `• ${dishNames.get(id)} × ${numberFormat.format(qty)}`);
    return `السلام عليكم، هذا طلبي من لقمة وذوق:\n\n${items.join('\n')}\n\nفضلاً أكّد لي التفاصيل والتكلفة. شكرًا.`;
  }

  function renderCart() {
    const units = countUnits();
    const kinds = Object.keys(cart).length;
    const kindLabel = kinds === 1 ? 'صنف واحد' : kinds === 2 ? 'صنفان' : kinds <= 10 ? 'أصناف' : 'صنفًا';
    dock.hidden = units === 0;
    document.getElementById('header-cart-count').textContent = numberFormat.format(kinds);
    document.getElementById('dock-count').textContent = numberFormat.format(kinds);
    document.getElementById('dock-label').textContent = `${kindLabel} في طلبك`;
    lines.replaceChildren(...Object.entries(cart).map(([id, qty]) => makeCartLine(id, qty)));
    empty.hidden = kinds !== 0;
    checkout.hidden = kinds === 0;
    checkout.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(makeMessage())}`;
    cards.forEach((card) => {
      const id = card.dataset.id;
      const qty = cart[id] || 0;
      const add = card.querySelector('[data-add]');
      const control = card.querySelector('[data-card-quantity]');
      const value = card.querySelector('[data-quantity]');
      add.hidden = qty > 0;
      control.hidden = qty === 0;
      if (value) value.textContent = numberFormat.format(qty);
    });
    if (dialog.open && units === 0) empty.hidden = false;
  }

  function openCart() {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.matches('[data-filter]')) {
      activeFilter = target.dataset.filter || 'all';
      filterButtons.forEach((button) => {
        const selected = button === target;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      document.querySelectorAll('.menu-group').forEach((group) => {
        group.hidden = activeFilter !== 'all' && group.dataset.group !== activeFilter;
      });
    }
    if (target.matches('[data-add]')) setQuantity(target.dataset.add, (cart[target.dataset.add] || 0) + 1);
    if (target.matches('[data-increase]')) setQuantity(target.dataset.increase, (cart[target.dataset.increase] || 0) + 1);
    if (target.matches('[data-decrease]')) setQuantity(target.dataset.decrease, (cart[target.dataset.decrease] || 0) - 1);
    if (target.matches('[data-remove]')) setQuantity(target.dataset.remove, 0);
    if (target.id === 'header-cart') {
      if (countUnits() > 0) openCart();
      else document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
    }
    if (target.id === 'open-cart') openCart();
    if (target.id === 'close-cart') dialog.close();
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  if (year) year.textContent = String(new Date().getFullYear());
  renderCart();
})();
