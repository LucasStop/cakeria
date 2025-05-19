document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('product-modal-overlay')) {
    createModalStructure();
  }

  if (!localStorage.getItem('cart')) {
    localStorage.setItem('cart', JSON.stringify([]));
  }
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
      </div>
      
      <div class="product-modal-quantity">
        <label for="product-quantity">Quantidade:</label>
        <div class="quantity-control">
          <div class="quantity-btn minus">-</div>
          <input type="number" id="product-quantity" class="quantity-input" value="1" min="1" max="${produto.stock || 10}">
          <div class="quantity-btn plus">+</div>
        </div>
      </div>
      
      <div class="product-modal-actions">
        <button class="add-to-cart-btn" data-id="${produto.id}" ${!produto.stock ? 'disabled' : ''}>
          <i class="fas fa-shopping-cart"></i>
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  `;

  modalContent.innerHTML = productDetailsHTML;

  const modalElement = document.querySelector('.product-modal');

  const existingFooter = modalElement.querySelector('.product-modal-footer');
  if (existingFooter) {
    existingFooter.remove();
  }

  const footerHTML = `
    <div class="product-modal-footer">
      <div class="stock-info ${stockStatus.class}">${stockStatus.text}</div>
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

function setupAddToCartButton(produto) {
  const addToCartBtn = document.querySelector('.add-to-cart-btn');

  addToCartBtn.addEventListener('click', function () {
    const quantity = parseInt(document.getElementById('product-quantity').value);

    addToCart(produto, quantity);
    al;
    closeProductModal();

    showCartConfirmation(produto, quantity);
  });
}

function addToCart(produto, quantity) {
  try {
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

function formatCurrency(value) {
  return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
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
};
