// Carrinho de compras
document.addEventListener('DOMContentLoaded', initCart);

// Inicializa o carrinho
function initCart() {
  loadCartItems();
  setupEventListeners();
}

// Carrega os itens do carrinho
function loadCartItems() {
  const cartItems = getCartItems();
  const cartItemsElement = document.getElementById('cart-items');
  const cartEmptyElement = document.getElementById('cart-empty');
  const cartContentElement = document.getElementById('cart-content');

  if (!cartItemsElement || !cartEmptyElement || !cartContentElement) {
    console.error('Elementos do carrinho não encontrados');
    return;
  }

  if (cartItems.length === 0) {
    cartEmptyElement.style.display = 'block';
    cartContentElement.style.display = 'none';
    return;
  }

  cartEmptyElement.style.display = 'none';
  cartContentElement.style.display = 'grid';

  // Limpa o container de itens
  cartItemsElement.innerHTML = '';

  // Adiciona cada item ao carrinho
  cartItems.forEach(item => {
    const itemElement = createCartItemElement(item);
    cartItemsElement.appendChild(itemElement);
  });

  // Atualiza o resumo do carrinho
  updateCartSummary();
}

// Cria um elemento de item do carrinho
function createCartItemElement(item) {
  const div = document.createElement('div');
  div.className = 'cart-item';
  div.dataset.id = item.id;

  // Define a URL da imagem
  let imageUrl;
  if (window.ImageHelper && typeof window.ImageHelper.getProductImageUrl === 'function') {
    imageUrl = window.ImageHelper.getProductImageUrl(item.id);
  } else if (item.image_url) {
    imageUrl = item.image_url;
  } else {
    imageUrl = `${window.API?.BASE_URL || 'http://localhost:3001/api'}/product/image/${item.id}`;
  }

  div.innerHTML = `
    <div class="cart-item-image">
      <img src="${imageUrl}" alt="${item.name}" onerror="this.onerror=null; this.src='/assets/default-product.png';">
    </div>
    <div class="cart-item-details">
      <div class="cart-item-name">${item.name}</div>
      <div class="cart-item-price">${formatCurrency(item.price)}</div>
    </div>
    <div class="cart-item-actions">
      <div class="cart-item-quantity">
        <div class="quantity-btn minus" data-id="${item.id}">-</div>
        <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
        <div class="quantity-btn plus" data-id="${item.id}">+</div>
      </div>
      <button class="remove-item" data-id="${item.id}">
        <i class="fas fa-trash-alt"></i> Remover
      </button>
    </div>
  `;

  return div;
}

// Configura os event listeners
function setupEventListeners() {
  // Botão de continuar comprando
  const btnContinueShopping = document.getElementById('btn-continue-shopping');
  if (btnContinueShopping) {
    btnContinueShopping.addEventListener('click', () => {
      window.location.href = './produtos.html';
    });
  }

  // Botão de finalizar compra
  const btnCheckout = document.getElementById('btn-checkout');
  if (btnCheckout) {
    btnCheckout.addEventListener('click', () => {
      if (!isUserLoggedIn()) {
        showLoginRequiredMessage();
        return;
      }
      window.location.href = './checkout.html';
    });
  }

  // Botão de limpar carrinho
  const btnClearCart = document.getElementById('btn-clear-cart');
  if (btnClearCart) {
    btnClearCart.addEventListener('click', showClearCartModal);
  }

  // Escuta eventos nos itens do carrinho (delegação de eventos)
  const cartItemsElement = document.getElementById('cart-items');
  if (cartItemsElement) {
    cartItemsElement.addEventListener('click', handleCartItemsClick);
    cartItemsElement.addEventListener('change', handleCartItemsChange);
  }

  // Modal de limpar carrinho
  const clearCartModal = document.getElementById('clear-cart-modal');
  if (clearCartModal) {
    const closeButtons = clearCartModal.querySelectorAll('.close, #cancel-clear-cart');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        clearCartModal.style.display = 'none';
      });
    });

    const confirmButton = clearCartModal.querySelector('#confirm-clear-cart');
    if (confirmButton) {
      confirmButton.addEventListener('click', () => {
        clearCart();
        clearCartModal.style.display = 'none';
        showToast('Carrinho limpo com sucesso!');
      });
    }
  }

  // Fecha modais ao clicar fora
  window.addEventListener('click', event => {
    if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });
}

// Trata cliques nos itens do carrinho
function handleCartItemsClick(event) {
  const target = event.target;
  
  // Botão de diminuir quantidade
  if (target.classList.contains('minus') || target.closest('.minus')) {
    const button = target.classList.contains('minus') ? target : target.closest('.minus');
    const productId = button.dataset.id;
    decreaseQuantity(productId);
  }
  
  // Botão de aumentar quantidade
  else if (target.classList.contains('plus') || target.closest('.plus')) {
    const button = target.classList.contains('plus') ? target : target.closest('.plus');
    const productId = button.dataset.id;
    increaseQuantity(productId);
  }
  
  // Botão de remover item
  else if (target.classList.contains('remove-item') || target.closest('.remove-item')) {
    const button = target.classList.contains('remove-item') ? target : target.closest('.remove-item');
    const productId = button.dataset.id;
    removeItem(productId);
  }
}

// Trata mudanças nos inputs dos itens do carrinho
function handleCartItemsChange(event) {
  const target = event.target;
  
  // Input de quantidade
  if (target.classList.contains('quantity-input')) {
    const productId = target.dataset.id;
    const newQuantity = parseInt(target.value);
    
    if (isNaN(newQuantity) || newQuantity < 1) {
      loadCartItems(); // Recarrega para corrigir o valor
      return;
    }
    
    updateItemQuantity(productId, newQuantity);
  }
}

// Diminui a quantidade de um item
function decreaseQuantity(productId) {
  const cartItems = getCartItems();
  const itemIndex = cartItems.findIndex(item => item.id == productId);
  
  if (itemIndex === -1) return;
  
  if (cartItems[itemIndex].quantity > 1) {
    cartItems[itemIndex].quantity--;
    saveCartItems(cartItems);
    updateCartItemUI(productId, cartItems[itemIndex].quantity);
    updateCartSummary();
  } else {
    removeItem(productId);
  }
}

// Aumenta a quantidade de um item
function increaseQuantity(productId) {
  const cartItems = getCartItems();
  const itemIndex = cartItems.findIndex(item => item.id == productId);
  
  if (itemIndex === -1) return;
  
  cartItems[itemIndex].quantity++;
  saveCartItems(cartItems);
  updateCartItemUI(productId, cartItems[itemIndex].quantity);
  updateCartSummary();
}

// Atualiza a quantidade de um item específico
function updateItemQuantity(productId, quantity) {
  const cartItems = getCartItems();
  const itemIndex = cartItems.findIndex(item => item.id == productId);
  
  if (itemIndex === -1) return;
  
  cartItems[itemIndex].quantity = quantity;
  saveCartItems(cartItems);
  updateCartSummary();
}

// Remove um item do carrinho
function removeItem(productId) {
  const cartItems = getCartItems().filter(item => item.id != productId);
  saveCartItems(cartItems);
  
  const itemElement = document.querySelector(`.cart-item[data-id="${productId}"]`);
  if (itemElement) {
    itemElement.classList.add('removing');
    setTimeout(() => {
      loadCartItems(); // Recarrega todos os itens para manter a consistência
    }, 300);
  } else {
    loadCartItems();
  }
  
  showToast('Item removido do carrinho');
}

// Limpa o carrinho
function clearCart() {
  localStorage.removeItem('cart');
  loadCartItems();
  updateCartCounter();
}

// Atualiza a UI de um item do carrinho
function updateCartItemUI(productId, quantity) {
  const quantityInput = document.querySelector(`.quantity-input[data-id="${productId}"]`);
  if (quantityInput) {
    quantityInput.value = quantity;
  }
}

// Atualiza o resumo do carrinho
function updateCartSummary() {
  const cartItems = getCartItems();
  const subtotal = calculateSubtotal(cartItems);
  const shipping = calculateShipping(cartItems);
  const total = subtotal + shipping;
  
  document.getElementById('cart-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('cart-shipping').textContent = formatCurrency(shipping);
  document.getElementById('cart-total').textContent = formatCurrency(total);
  
  updateCartCounter();
}

// Calcula o subtotal do carrinho
function calculateSubtotal(cartItems) {
  return cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

// Calcula o frete (simplificado)
function calculateShipping(cartItems) {
  if (cartItems.length === 0) return 0;
  
  const subtotal = calculateSubtotal(cartItems);
  // Frete grátis para compras acima de R$ 100
  if (subtotal >= 100) return 0;
  
  // Frete fixo de R$ 10 para compras menores
  return 10;
}

// Formata um valor para moeda
function formatCurrency(value) {
  return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

// Obtem os itens do carrinho do localStorage
function getCartItems() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (error) {
    console.error('Erro ao obter itens do carrinho:', error);
    return [];
  }
}

// Salva os itens do carrinho no localStorage
function saveCartItems(cartItems) {
  try {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // Dispara evento de atualização do carrinho
    const event = new CustomEvent('cartUpdated', {
      detail: {
        action: 'update',
        cartItems: cartItems
      }
    });
    document.dispatchEvent(event);
    
  } catch (error) {
    console.error('Erro ao salvar itens do carrinho:', error);
  }
}

// Atualiza o contador do carrinho no header
function updateCartCounter() {
  try {
    const cartItems = getCartItems();
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

    const possibleCounters = [
      document.querySelector('.cart-count'),
      document.querySelector('.cart-counter'),
      document.querySelector('.cart-badge'),
      document.querySelector('[data-cart-count]'),
    ];

    for (const counter of possibleCounters) {
      if (counter) {
        counter.textContent = totalItems;
        if (totalItems > 0) {
          counter.classList.add('active');
        } else {
          counter.classList.remove('active');
        }
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar contador do carrinho:', error);
  }
}

// Verifica se o usuário está logado
function isUserLoggedIn() {
  return !!localStorage.getItem('token');
}

// Exibe modal de limpar carrinho
function showClearCartModal() {
  const modal = document.getElementById('clear-cart-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

// Exibe mensagem de login necessário
function showLoginRequiredMessage() {
  if (window.Toast) {
    Toast.warning('É necessário fazer login para finalizar a compra', {
      position: 'top-center',
      duration: 5000,
      action: {
        text: 'Fazer login',
        callback: () => {
          window.location.href = './login.html?redirect=checkout';
        }
      }
    });
  } else {
    const goToLogin = confirm('É necessário fazer login para finalizar a compra. Deseja ir para a página de login?');
    if (goToLogin) {
      window.location.href = './login.html?redirect=checkout';
    }
  }
}

// Exibe uma mensagem toast
function showToast(message) {
  if (window.Toast) {
    Toast.success(message);
  } else {
    alert(message);
  }
}

// Expõe funções para uso global
window.CartManager = {
  addToCart: function(produto, quantity) {
    try {
      const cart = getCartItems();

      const existingProductIndex = cart.findIndex(item => item.id === produto.id);

      if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += quantity;
      } else {
        cart.push({
          id: produto.id,
          name: produto.name,
          price: produto.price,
          quantity: quantity,
          image_id: produto.image_id || null,
        });
      }

      saveCartItems(cart);
      updateCartCounter();

      return true;
    } catch (error) {
      console.error('Erro ao adicionar produto ao carrinho:', error);
      return false;
    }
  },
  removeFromCart: removeItem,
  clearCart: clearCart,
  getCartItems: getCartItems,
  calculateTotal: function() {
    const cartItems = getCartItems();
    const subtotal = calculateSubtotal(cartItems);
    const shipping = calculateShipping(cartItems);
    return {
      subtotal,
      shipping,
      total: subtotal + shipping
    };
  }
};

// Verifica se a função addToCart já existe e a preserva
if (typeof window.addToCart === 'function' && !window.originalAddToCart) {
  window.originalAddToCart = window.addToCart;
}

// Substitui ou cria a função global de adicionar ao carrinho
window.addToCart = function(produto, quantity) {
  const result = window.CartManager.addToCart(produto, quantity);
  
  // Chama a implementação original, se existir
  if (window.originalAddToCart && window.originalAddToCart !== window.addToCart) {
    window.originalAddToCart(produto, quantity);
  }
  
  return result;
};
