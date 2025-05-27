document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('product-modal-overlay')) {
    createModalStructure();
  }

  if (!localStorage.getItem('cart')) {
    localStorage.setItem('cart', JSON.stringify([]));
  }

  // Adicionar estilos para o badge de status e mensagem de indisponibilidade
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 500;
      text-align: center;
    }
    
    .status-badge.active {
      background-color: #4CAF50;
      color: white;
    }
    
    .status-badge.inactive {
      background-color: #F44336;
      color: white;
    }
    
    .product-inactive-message {
      color: #F44336;
      font-size: 0.9em;
      margin-top: 8px;
      font-weight: 500;
    }
    
    .add-to-cart-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background-color: #cccccc !important;
      border-color: #bbbbbb !important;
      color: #666666 !important;
    }
    
    .add-to-cart-btn:disabled .fa-shopping-cart {
      opacity: 0.7;
    }
    
    .product-modal-meta-item {
      margin-bottom: 8px;
    }
    
    .product-modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #eee;
    }
    
    .expired-text, .expiring-soon {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.85em;
    }
      .expired-text {
      background-color: #ffebee;
      color: #d32f2f;
    }
    
    .expiring-soon {
      background-color: #fff8e1;
      color: #ff8f00;
    }
    
    .product-status-message {
      font-size: 0.9em;
      padding: 5px 10px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .product-status-message.inactive {
      background-color: #ffebee;
      color: #d32f2f;
    }
    
    .product-status-message.out-of-stock {
      background-color: #e8eaf6;
      color: #3f51b5;
    }
    
    .product-status-message.expired {
      background-color: #fce4ec;
      color: #e91e63;
    }
      /* Adicionar um efeito visual para produtos inativos */
    .product-modal-image img {
      transition: filter 0.3s ease;
    }
    
    .product-inactive .product-modal-image img {
      filter: grayscale(80%);
    }
    
    /* Estilizar botões de quantidade desabilitados */
    .quantity-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: #f0f0f0;
      color: #999;
    }
    
    .quantity-input:disabled {
      background-color: #f5f5f5;
      color: #999;
      border-color: #ddd;
    }
  `;
  document.head.appendChild(styleElement);
});

function createModalStructure() {
  const modalHTML = `
    <div id="product-modal-overlay" class="product-modal-overlay">
      <div class="product-modal">
        <div class="product-modal-header">
          <h2>Detalhes do Produto</h2>
          <button class="product-modal-close" aria-label="Fechar">&times;</button>
        </div>
        <div id="product-modal-content" class="product-modal-body">
          <div class="product-modal-loading">
            <div class="product-modal-spinner"></div>
            <p>Carregando detalhes do produto...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modalOverlay = document.getElementById('product-modal-overlay');
  const closeBtn = modalOverlay.querySelector('.product-modal-close');

  closeBtn.addEventListener('click', function () {
    closeProductModal();
  });

  modalOverlay.addEventListener('click', function (event) {
    if (event.target === modalOverlay) {
      closeProductModal();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeProductModal();
    }
  });
}

window.verDetalhesProduto = async function (productId) {
  try {
    openProductModal();

    const produto = await loadProductDetails(productId);

    renderProductDetails(produto);
  } catch (error) {
    console.error('Erro ao carregar detalhes do produto:', error);
    showErrorInModal(
      'Não foi possível carregar os detalhes do produto. Tente novamente mais tarde.'
    );
  }
};

function openProductModal() {
  const modalOverlay = document.getElementById('product-modal-overlay');
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  const modalContent = document.getElementById('product-modal-content');
  modalContent.innerHTML = `
    <div class="product-modal-loading">
      <div class="product-modal-spinner"></div>
      <p>Carregando detalhes do produto...</p>
    </div>
  `;
}

function closeProductModal() {
  const modalOverlay = document.getElementById('product-modal-overlay');
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

async function loadProductDetails(productId) {
  try {
    if (window.API && window.API.produtos && typeof window.API.produtos.obterPorId === 'function') {
      return await window.API.produtos.obterPorId(productId);
    } else {
      const baseUrl = window.API?.BASE_URL || 'http://localhost:3001/api';

      const possibleEndpoints = [
        `/products/${productId}`,
        `/produtos/${productId}`,
        `/product/${productId}`,
        `/produto/${productId}`,
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          const response = await fetch(`${baseUrl}${endpoint}`);
          if (response.ok) {
            return await response.json();
          }
        } catch (endpointError) {
          console.warn(`Falha ao buscar em ${endpoint}:`, endpointError);
        }
      }

      throw new Error('Não foi possível carregar os detalhes do produto');
    }
  } catch (error) {
    console.error('Erro ao buscar detalhes do produto:', error);
    throw error;
  }
}

function renderProductDetails(produto) {
  const modalContent = document.getElementById('product-modal-content');

  const imageUrl = window.ImageHelper
    ? window.ImageHelper.getProductImageUrl(produto.id)
    : `${window.API?.BASE_URL || 'http://localhost:3001/api'}/product/image/${produto.id}`;

  const formattedPrice = formatCurrency(produto.price);

  const stockStatus = getStockStatus(produto.stock);

  const categoryName = getCategoryName(produto);

  const expiryDate = getFormattedExpiryDate(produto);
  
  // Obter informações do status do produto
  const productStatus = getProductStatusMessage(produto);
  const productDetailsHTML = `
    <div class="product-modal-image">
      <img src="${imageUrl}" alt="${produto.name}" onerror="this.onerror=null; this.src='/assets/default-product.png';">
    </div>
    <div class="product-modal-info">
      <h2 class="product-modal-title">${produto.name}</h2>
      <div class="product-modal-price">${formattedPrice}</div>
      
      <div class="product-modal-description">
        ${produto.description || 'Sem descrição disponível.'}
      </div>
      
      <div class="product-modal-meta">
        <div class="product-modal-meta-item">
          <strong>Categoria</strong>
          <span>${categoryName}</span>
        </div>
        
        <div class="product-modal-meta-item">
          <strong>Tamanho</strong>
          <span>${produto.size || 'Padrão'}</span>
        </div>
        
        <div class="product-modal-meta-item ${expiryDate === 'Vencido' ? 'expired' : ''}">
          <strong>Validade</strong>
          <span>${expiryDate}</span>
        </div>
          <div class="product-modal-meta-item">
          <strong>Status</strong>
          <span class="status-badge ${productStatus.status}">${productStatus.statusText}</span>
        </div>
      </div>
        <div class="product-modal-quantity">
        <label for="product-quantity">Quantidade:</label>
        <div class="quantity-control">
          <div class="quantity-btn minus ${!productStatus.canAddToCart ? 'disabled' : ''}">-</div>
          <input type="number" id="product-quantity" class="quantity-input" value="1" min="1" max="${produto.stock || 10}" ${!productStatus.canAddToCart ? 'disabled' : ''}>
          <div class="quantity-btn plus ${!productStatus.canAddToCart ? 'disabled' : ''}">+</div>
        </div>
      </div>
        <div class="product-modal-actions">
        <button class="add-to-cart-btn" data-id="${produto.id}" ${!productStatus.canAddToCart ? 'disabled' : ''}>
          <i class="fas fa-shopping-cart"></i>
          ${!productStatus.canAddToCart ? `Produto ${productStatus.statusText}` : 'Adicionar ao Carrinho'}
        </button>
        ${!productStatus.canAddToCart ? `<p class="product-inactive-message">${productStatus.message}</p>` : ''}
      </div>
    </div>
  `;
  modalContent.innerHTML = productDetailsHTML;

  const modalElement = document.querySelector('.product-modal');
  
  // Adicionar classe ao modal se o produto estiver inativo
  if (!productStatus.canAddToCart) {
    modalElement.classList.add('product-inactive');
  } else {
    modalElement.classList.remove('product-inactive');
  }

  const existingFooter = modalElement.querySelector('.product-modal-footer');
  if (existingFooter) {
    existingFooter.remove();
  }
  const footerHTML = `
    <div class="product-modal-footer">
      <div class="stock-info ${stockStatus.class}">${stockStatus.text}</div>
      ${!productStatus.canAddToCart ? 
        `<div class="product-status-message ${productStatus.status}">
          <i class="fas fa-exclamation-circle"></i> ${productStatus.message}
        </div>` : 
        ''}
    </div>
  `;
  modalElement.insertAdjacentHTML('beforeend', footerHTML);

  setupQuantityButtons(produto.stock || 10);

  setupAddToCartButton(produto);
}

function getCategoryName(produto) {
  if (typeof produto.category_name === 'string' && produto.category_name) {
    return produto.category_name;
  }

  if (typeof produto.categoryName === 'string' && produto.categoryName) {
    return produto.categoryName;
  }

  if (produto.category) {
    if (typeof produto.category === 'string') {
      return produto.category;
    }

    if (typeof produto.category === 'object' && produto.category !== null) {
      return (
        produto.category.name ||
        produto.category.nome ||
        `ID: ${produto.category.id || produto.category}`
      );
    }
  }

  if (produto.categoria) {
    if (typeof produto.categoria === 'string') {
      return produto.categoria;
    }

    if (typeof produto.categoria === 'object' && produto.categoria !== null) {
      return (
        produto.categoria.name ||
        produto.categoria.nome ||
        `ID: ${produto.categoria.id || produto.categoria}`
      );
    }
  }

  return 'Não categorizado';
}

function getFormattedExpiryDate(produto) {
  const possibleFields = [
    'expiration_date',
    'expirationDate',
    'expiry_date',
    'expiryDate',
    'validade',
    'validity',
    'validUntil',
    'date_expiry',
    'expiry',
  ];

  let expiryValue = null;
  for (const field of possibleFields) {
    if (produto[field]) {
      expiryValue = produto[field];
      break;
    }
  }

  if (!expiryValue) return 'Não especificada';

  try {
    const expiryDate = new Date(expiryValue);

    if (isNaN(expiryDate.getTime())) {
      return 'Data inválida';
    }

    const today = new Date();
    if (expiryDate < today) {
      const diffTime = Math.abs(today - expiryDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        return '<span class="expired-text">Vencido hoje</span>';
      }
      return `<span class="expired-text">Vencido há ${diffDays} dias</span>`;
    }

    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    if (expiryDate <= nextWeek) {
      const diffTime = Math.abs(expiryDate - today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        return '<span class="expiring-soon">Vence hoje!</span>';
      }
      return `<span class="expiring-soon">Vence em ${diffDays} dias</span>`;
    }

    return expiryDate.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao processar data de validade:', error);
    return 'Data inválida';
  }
}

function setupQuantityButtons(maxStock) {
  const minusBtn = document.querySelector('.quantity-btn.minus');
  const plusBtn = document.querySelector('.quantity-btn.plus');
  const quantityInput = document.getElementById('product-quantity');
  
  // Verificar se os botões estão desabilitados
  const isDisabled = minusBtn.classList.contains('disabled');
  
  if (!isDisabled) {
    minusBtn.addEventListener('click', function () {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    });

    plusBtn.addEventListener('click', function () {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue < maxStock) {
        quantityInput.value = currentValue + 1;
      }
    });

    quantityInput.addEventListener('change', function () {
      let value = parseInt(this.value);

      if (isNaN(value) || value < 1) {
        value = 1;
      } else if (value > maxStock) {
        value = maxStock;
      }

      this.value = value;
    });
  }
}

function setupAddToCartButton(produto) {
  const addToCartBtn = document.querySelector('.add-to-cart-btn');

  addToCartBtn.addEventListener('click', function () {
    // Verificar a disponibilidade do produto
    const availabilityCheck = isProductAvailable(produto);
    
    if (!availabilityCheck.available) {
      showErrorInModal(`Este produto não pode ser adicionado ao carrinho.<br>${availabilityCheck.reason}`);
      return;
    }
    
    const quantity = parseInt(document.getElementById('product-quantity').value);
    if (addToCart(produto, quantity)) {
      closeProductModal();
      showCartConfirmation(produto, quantity);
    }
  });
}

function addToCart(produto, quantity) {
  try {
    // Verificar se o produto está disponível para compra
    const availabilityCheck = isProductAvailable(produto);
    if (!availabilityCheck.available) {
      console.warn(`Produto não adicionado ao carrinho: ${availabilityCheck.reason}`);
      showErrorInModal(`Este produto não pode ser adicionado ao carrinho.<br>${availabilityCheck.reason}`);
      return false;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');

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
        is_active: produto.is_active, // Armazenar o status do produto no carrinho
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    const event = new CustomEvent('cartUpdated', {
      detail: {
        action: 'add',
        product: produto,
        quantity: quantity,
      },
    });
    document.dispatchEvent(event);

    updateCartCounter();

    return true;
  } catch (error) {
    console.error('Erro ao adicionar produto ao carrinho:', error);
    showErrorInModal('Ocorreu um erro ao adicionar o produto ao carrinho. Por favor, tente novamente.');
    return false;
  }
}

function showCartConfirmation(produto, quantity) {
  const existingToast = document.querySelector('.cart-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toastHTML = `
    <div class="cart-toast">
      <i class="fas fa-check-circle"></i>
      <span>
        ${quantity > 1 ? `${quantity} unidades` : 'Produto'} adicionado ao carrinho
      </span>
      <button class="cart-toast-close">&times;</button>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', toastHTML);

  const toast = document.querySelector('.cart-toast');

  setTimeout(() => {
    toast.classList.add('active');
  }, 10);

  const closeBtn = toast.querySelector('.cart-toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.remove('active');
    setTimeout(() => {
      toast.remove();
    }, 300);
  });

  setTimeout(() => {
    if (toast) {
      toast.classList.remove('active');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);

  if (window.Toast) {
    window.Toast.success(`${produto.name} adicionado ao carrinho!`, {
      position: 'bottom-right',
      duration: 3000,
    });
  }
}

function showErrorInModal(errorMessage) {
  const modalContent = document.getElementById('product-modal-content');

  modalContent.innerHTML = `
    <div class="product-modal-error">
      <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #e53e3e; margin-bottom: 20px;"></i>
      <p>${errorMessage}</p>
      <button class="btn btn-primary" style="margin-top: 20px;" onclick="closeProductModal()">Fechar</button>
    </div>
  `;
}

function getProductStatusMessage(produto) {
  if (!produto.is_active) {
    return {
      status: 'inactive',
      statusText: 'Inativo',
      message: 'Este produto está temporariamente indisponível.',
      canAddToCart: false
    };
  }
  
  if (!produto.stock || produto.stock <= 0) {
    return {
      status: 'out-of-stock',
      statusText: 'Sem estoque',
      message: 'Este produto está fora de estoque no momento.',
      canAddToCart: false
    };
  }
  
  // Verificar se o produto está expirado
  const expiryDate = getProductExpiryDate(produto);
  if (expiryDate && expiryDate < new Date()) {
    return {
      status: 'expired',
      statusText: 'Vencido',
      message: 'Este produto está com a validade expirada.',
      canAddToCart: false
    };
  }
  
  return {
    status: 'active',
    statusText: 'Ativo',
    message: '',
    canAddToCart: true
  };
}

function formatCurrency(value) {
  return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
}

function isProductAvailable(product) {
  const status = getProductStatusMessage(product);
  
  if (!status.canAddToCart) {
    return {
      available: false,
      reason: status.message
    };
  }
  
  return {
    available: true
  };
}

function getProductExpiryDate(product) {
  const possibleFields = [
    'expiration_date',
    'expirationDate',
    'expiry_date',
    'expiryDate',
    'validade',
    'validity',
    'validUntil',
    'date_expiry',
    'expiry',
  ];

  let expiryValue = null;
  for (const field of possibleFields) {
    if (product[field]) {
      expiryValue = product[field];
      break;
    }
  }

  if (!expiryValue) return null;

  try {
    const expiryDate = new Date(expiryValue);
    if (isNaN(expiryDate.getTime())) {
      return null;
    }
    return expiryDate;
  } catch (error) {
    console.error('Erro ao processar data de validade:', error);
    return null;
  }
}

function getStockStatus(stock) {
  if (!stock || stock <= 0) {
    return {
      text: 'Fora de estoque',
      class: 'out-of-stock',
    };
  } else if (stock <= 5) {
    return {
      text: `Estoque baixo: ${stock} ${stock === 1 ? 'unidade' : 'unidades'}`,
      class: 'low-stock',
    };
  } else {
    return {
      text: `${stock} ${stock === 1 ? 'unidade' : 'unidades'} em estoque`,
      class: 'in-stock',
    };
  }
}

function updateCartCounter() {
  try {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

    const possibleCounters = [
      document.querySelector('.cart-count'),
      document.querySelector('.cart-counter'),
      document.querySelector('.cart-badge'),
      document.querySelector('[data-cart_count]'),
    ];

    for (const counter of possibleCounters) {
      if (counter) {
        counter.textContent = totalItems;
        if (totalItems > 0) {
          counter.classList.add('active');
        } else {
          counter.classList.remove('active');
        }
        break;
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar contador do carrinho:', error);
  }
}

window.ProductDetails = {
  openModal: openProductModal,
  closeModal: closeProductModal,
  addToCart: addToCart,
  getCart: function () {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  },
  clearCart: function () {
    localStorage.setItem('cart', JSON.stringify([]));
    updateCartCounter();

    document.dispatchEvent(
      new CustomEvent('cartUpdated', {
        detail: { action: 'clear' },
      })
    );
  },
  isProductAvailable: isProductAvailable,
  getProductStatusMessage: getProductStatusMessage
};
