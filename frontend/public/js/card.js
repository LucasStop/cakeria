// Função para renderizar os itens do carrinho
function renderCart() {
  const cartItems = document.getElementById('cart-items');
  if (!cartItems) return;

  const items = getCartItems();

  items.forEach(item => {
    // Usar o helper para obter a URL da imagem do produto
    const imageUrl = window.ImageHelper ? 
      window.ImageHelper.getProductImageUrl(item.id) : 
      `${API.BASE_URL}/product/image/${item.id}`;
      
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div class="cart-item-image">
        <img src="${imageUrl}" alt="${item.name}" 
          onerror="this.onerror=null; this.src='/assets/default-product.png';">
      </div>
      <div class="cart-item-details">
        <h3>${item.name}</h3>
        <p>R$ ${formatPrice(item.price)}</p>
        <div class="cart-item-quantity">
          <button class="quantity-btn minus" data-id="${item.id}">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="quantity-btn plus" data-id="${item.id}">+</button>
        </div>
      </div>
      <button class="cart-item-remove" data-id="${item.id}">
        <i class="fas fa-trash"></i>
      </button>
    `;

    cartItems.appendChild(cartItem);
  });
}

// Função para obter os itens do carrinho
function getCartItems() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  return cart;
}

// Função para formatar o preço
function formatPrice(price) {
  return parseFloat(price).toFixed(2).replace('.', ',');
}

// Função para adicionar eventos aos botões de quantidade
function setupCartEventListeners() {
  const cartItems = document.getElementById('cart-items');
  if (!cartItems) return;

  cartItems.addEventListener('click', event => {
    const target = event.target;
    const itemId = target.dataset.id;

    if (target.classList.contains('quantity-btn')) {
      const cart = getCartItems();
      const item = cart.find(i => i.id === itemId);

      if (target.classList.contains('plus')) {
        item.quantity += 1;
      } else if (target.classList.contains('minus') && item.quantity > 1) {
        item.quantity -= 1;
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      renderCart();
    }

    if (target.classList.contains('cart-item-remove')) {
      const cart = getCartItems().filter(i => i.id !== itemId);
      localStorage.setItem('cart', JSON.stringify(cart));
      renderCart();
    }
  });
}

// Inicializar o carrinho
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  setupCartEventListeners();
});