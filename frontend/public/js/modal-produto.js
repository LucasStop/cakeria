const ProductModal = {
  isInitialized: false,
  overlayElement: null,

  init() {
    console.log('[ProductModal] Inicializando...');

    if (this.isInitialized) {
      console.log('[ProductModal] Já inicializado, ignorando');
      return;
    }

    this.createModalStructure();

    this.setupGlobalFunction();

    this.setupExistingButtons();

    this.isInitialized = true;
    console.log('[ProductModal] Inicialização concluída');
  },

  createModalStructure() {
    console.log('[ProductModal] Criando estrutura do modal...');

    if (document.getElementById('product-modal-overlay')) {
      console.log('[ProductModal] Modal já existe no DOM');
      this.overlayElement = document.getElementById('product-modal-overlay');
      return;
    }

    const modalHTML = `
      <div id="product-modal-overlay" class="product-modal-overlay" style="display:none">
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

    this.overlayElement = document.getElementById('product-modal-overlay');

    this.setupModalEvents();

    this.loadModalStyles();

    console.log('[ProductModal] Estrutura do modal criada');
  },

  setupModalEvents() {
    if (!this.overlayElement) return;

    const closeBtn = this.overlayElement.querySelector('.product-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    this.overlayElement.addEventListener('click', event => {
      if (event.target === this.overlayElement) {
        this.closeModal();
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && this.isModalOpen()) {
        this.closeModal();
      }
    });
  },

  loadModalStyles() {
    if (document.querySelector('link[href*="product-modal.css"]')) {
      return;
    }

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/css/product-modal.css';
    document.head.appendChild(styleLink);
    console.log('[ProductModal] CSS carregado');
  },

  setupGlobalFunction() {
    console.log('[ProductModal] Configurando função global verDetalhesProduto');

    const originalFunction = window.verDetalhesProduto;

    window.verDetalhesProduto = productId => {
      console.log('[ProductModal] verDetalhesProduto chamada para produto:', productId);

      if (!this.isInitialized) {
        this.init();
      }

      this.showProductDetails(productId);
    };

    if (typeof originalFunction === 'function') {
      console.log('[ProductModal] Função original substituída');
    }
  },

  setupExistingButtons() {
    console.log('[ProductModal] Configurando botões existentes...');

    const detailButtons = document.querySelectorAll(
      '.btn-ver-detalhes, [data-action="ver-detalhes"], [onclick*="verDetalhesProduto"]'
    );

    detailButtons.forEach(button => {
      if (button.dataset.modalHandlerAttached) {
        return;
      }

      let productId = button.dataset.id || button.dataset.productId;

      if (!productId && button.hasAttribute('onclick')) {
        const onclickAttr = button.getAttribute('onclick');
        const match = onclickAttr.match(/verDetalhesProduto\s*\(\s*(\d+)\s*\)/);
        if (match && match[1]) {
          productId = match[1];
        }
      }

      if (productId) {
        if (button.hasAttribute('onclick')) {
          button.removeAttribute('onclick');
        }

        button.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          this.showProductDetails(productId);
        });

        button.dataset.modalHandlerAttached = 'true';
        console.log(`[ProductModal] Botão configurado para produto ${productId}`);
      }
    });
  },

  async showProductDetails(productId) {
    console.log(`[ProductModal] Exibindo detalhes do produto ${productId}`);

    this.openModal();

    try {
      const produto = await this.fetchProductDetails(productId);

      this.renderProductDetails(produto);
    } catch (error) {
      console.error('[ProductModal] Erro ao carregar detalhes:', error);
      this.showErrorMessage(
        'Não foi possível carregar os detalhes do produto. Tente novamente mais tarde.'
      );
    }
  },

  openModal() {
    console.log('[ProductModal] Abrindo modal');

    if (!this.overlayElement) {
      this.createModalStructure();
    }

    this.overlayElement.style.display = 'flex';

    setTimeout(() => {
      this.overlayElement.classList.add('active');
    }, 10);

    document.body.style.overflow = 'hidden';

    const modalContent = document.getElementById('product-modal-content');
    if (modalContent) {
      modalContent.innerHTML = `
        <div class="product-modal-loading">
          <div class="product-modal-spinner"></div>
          <p>Carregando detalhes do produto...</p>
        </div>
      `;
    }
  },

  closeModal() {
    console.log('[ProductModal] Fechando modal');

    if (!this.overlayElement) return;

    this.overlayElement.classList.remove('active');

    setTimeout(() => {
      this.overlayElement.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
  },

  isModalOpen() {
    return (
      this.overlayElement &&
      this.overlayElement.style.display !== 'none' &&
      this.overlayElement.classList.contains('active')
    );
  },

  async fetchProductDetails(productId) {
    console.log(`[ProductModal] Buscando detalhes do produto ${productId}`);

    try {
      // Primeiro, tenta usar a API global se disponível
      if (window.API) {
        // Tenta o método específico de produtos se existir
        if (window.API.produtos && typeof window.API.produtos.obterPorId === 'function') {
          return await window.API.produtos.obterPorId(productId);
        }
        
        // Tenta usar o método genérico request da API
        if (typeof window.API.request === 'function') {
          try {
            return await window.API.request(`/product/${productId}`, { method: 'GET' });
          } catch (apiError) {
            console.warn('[ProductModal] Falha ao usar API.request:', apiError);
          }
        }
      }
      
      // Fallback para fetch direto
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
          console.warn(`[ProductModal] Falha ao buscar em ${endpoint}:`, endpointError);
        }
      }

      throw new Error('Não foi possível carregar os detalhes do produto');
    } catch (error) {
      console.error('[ProductModal] Erro ao buscar detalhes do produto:', error);
      throw error;
    }
  },

  renderProductDetails(produto) {
    const modalContent = document.getElementById('product-modal-content');
    if (!modalContent) return;

    // Permite substituição personalizada do renderizador
    if (window.renderProductDetails && typeof window.renderProductDetails === 'function') {
      window.renderProductDetails(produto, modalContent);
      return;
    }

    // Determina a URL da imagem
    let imageUrl;
    if (window.ImageHelper && typeof window.ImageHelper.getProductImageUrl === 'function') {
      imageUrl = window.ImageHelper.getProductImageUrl(produto.id);
    } else if (produto.image_url) {
      imageUrl = produto.image_url;
    } else {
      imageUrl = `${window.API?.BASE_URL || 'http://localhost:3001/api'}/product/image/${produto.id}`;
    }

    const formattedPrice = this.formatCurrency(produto.price);
    const estoque = produto.stock || produto.quantidade || 0;
    const estoqueClass = estoque > 10 ? 'in-stock' : estoque > 0 ? 'low-stock' : 'out-of-stock';
    const estoqueText = estoque > 10 
      ? `Em estoque (${estoque} unidades)` 
      : estoque > 0 
        ? `Estoque baixo (${estoque} unidades)` 
        : 'Fora de estoque';

    modalContent.innerHTML = `
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
            <span>${produto.category?.name || 'Não categorizado'}</span>
          </div>
          ${produto.size ? `
          <div class="product-modal-meta-item">
            <strong>Tamanho</strong>
            <span>${produto.size}</span>
          </div>
          ` : ''}
          ${produto.expiration_date ? `
          <div class="product-modal-meta-item ${this.isExpired(produto.expiration_date) ? 'expired' : ''}">
            <strong>Validade</strong>
            <span>${this.formatExpirationDate(produto.expiration_date)}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="stock-info ${estoqueClass}">
          <i class="fas ${estoque > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${estoqueText}
        </div>
        
        ${estoque > 0 ? `
        <div class="product-modal-quantity">
          <label for="product-quantity">Quantidade:</label>
          <div class="quantity-control">
            <div class="quantity-btn minus">-</div>
            <input type="number" id="product-quantity" class="quantity-input" value="1" min="1" max="${estoque}">
            <div class="quantity-btn plus">+</div>
          </div>
        </div>
        
        <div class="product-modal-actions">
          <button class="add-to-cart-btn" data-id="${produto.id}">
            <i class="fas fa-shopping-cart"></i>
            Adicionar ao Carrinho
          </button>
        </div>
        ` : `
        <div class="product-modal-actions" style="opacity: 0.6;">
          <button class="add-to-cart-btn" disabled>
            <i class="fas fa-shopping-cart"></i>
            Produto Indisponível
          </button>
        </div>
        `}
      </div>
    `;

    // Configura os controles de quantidade
    if (estoque > 0) {
      const minusBtn = modalContent.querySelector('.quantity-btn.minus');
      const plusBtn = modalContent.querySelector('.quantity-btn.plus');
      const quantityInput = modalContent.querySelector('.quantity-input');
      
      if (minusBtn && plusBtn && quantityInput) {
        minusBtn.addEventListener('click', () => {
          const currentValue = parseInt(quantityInput.value);
          if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
          }
        });
        
        plusBtn.addEventListener('click', () => {
          const currentValue = parseInt(quantityInput.value);
          if (currentValue < estoque) {
            quantityInput.value = currentValue + 1;
          }
        });
        
        quantityInput.addEventListener('change', () => {
          let value = parseInt(quantityInput.value);
          if (isNaN(value) || value < 1) {
            value = 1;
          } else if (value > estoque) {
            value = estoque;
          }
          quantityInput.value = value;
        });
      }
      
      // Configura o botão de adicionar ao carrinho
      const addToCartBtn = modalContent.querySelector('.add-to-cart-btn');
      if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
          const quantidade = parseInt(quantityInput?.value || 1);
          if (window.addToCart && typeof window.addToCart === 'function') {
            window.addToCart(produto, quantidade);
            this.showAddedToCartMessage(produto.name, quantidade);
          } else {
            console.log(`[ProductModal] Produto ${produto.id} adicionado ao carrinho: ${quantidade} unidades`);
            this.showAddedToCartMessage(produto.name, quantidade);
          }
        });
      }
    }
  },
  
  showAddedToCartMessage(productName, quantity) {
    const toastId = 'cart-toast-' + Date.now();
    const toastHTML = `
      <div id="${toastId}" class="cart-toast">
        <i class="fas fa-check-circle"></i>
        <span>${quantity} unidade${quantity > 1 ? 's' : ''} de ${productName} adicionada${quantity > 1 ? 's' : ''} ao carrinho</span>
        <button class="cart-toast-close">&times;</button>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toast = document.getElementById(toastId);
    
    setTimeout(() => {
      toast.classList.add('active');
    }, 10);
    
    const closeBtn = toast.querySelector('.cart-toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.remove('active');
        setTimeout(() => {
          toast.remove();
        }, 300);
      });
    }
    
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
    
    // Fechar o modal após adicionar ao carrinho
    setTimeout(() => {
      this.closeModal();
    }, 1000);
  },

  isExpired(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expirationDate = new Date(dateString);
    return expirationDate < today;
  },
  
  formatExpirationDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expirationDate = new Date(dateString);
    expirationDate.setHours(0, 0, 0, 0);
    
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `<span class="expired-text">Vencido em ${date.toLocaleDateString('pt-BR')}</span>`;
    } else if (diffDays <= 7) {
      return `<span class="expiring-soon">Vence em ${diffDays} dia${diffDays !== 1 ? 's' : ''}</span>`;
    }
    
    return date.toLocaleDateString('pt-BR');
  },

  showErrorMessage(message) {
    const modalContent = document.getElementById('product-modal-content');
    if (!modalContent) return;

    modalContent.innerHTML = `
      <div class="product-modal-error">
        <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #e53e3e; margin-bottom: 20px;"></i>
        <p>${message}</p>
        <button class="btn btn-primary" style="margin-top: 20px;">Fechar</button>
      </div>
    `;

    const closeBtn = modalContent.querySelector('.btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
  },

  formatCurrency(value) {
    if (typeof value !== 'number') {
      value = parseFloat(value) || 0;
    }
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('[ProductModal] DOM carregado, configurando sistema...');

  ProductModal.setupGlobalFunction();

  if (
    window.location.pathname.includes('/produtos') ||
    document.querySelector('.products-list') ||
    document.querySelector('.featured-products')
  ) {
    console.log('[ProductModal] Página de produtos detectada, inicializando completamente');
    ProductModal.init();
  } else {
    console.log('[ProductModal] Não é página de produtos, inicialização completa adiada');

    setTimeout(() => {
      const hasProductButtons = document.querySelector(
        '.btn-ver-detalhes, [data-action="ver-detalhes"], [onclick*="verDetalhesProduto"]'
      );
      if (hasProductButtons) {
        console.log('[ProductModal] Botões de produto encontrados, inicializando...');
        ProductModal.init();
      } else {
        console.log(
          '[ProductModal] Nenhum botão de produto encontrado, modal não será inicializado'
        );
      }
    }, 2000);
  }
});

window.ProductModal = ProductModal;
