/**
 * Inicialização global do modal de produto - Versão robusta
 * Este script garante que o modal de detalhes funcione em todas as páginas,
 * incluindo a página inicial (index.html)
 */

// Namespace para nosso modal de produto
const ProductModal = {
  // Estado interno
  isInitialized: false,
  overlayElement: null,
  
  // Inicialização do modal
  init() {
    console.log('[ProductModal] Inicializando...');
    
    // Se já inicializado, não fazer nada
    if (this.isInitialized) {
      console.log('[ProductModal] Já inicializado, ignorando');
      return;
    }
    
    // Criar a estrutura do modal no DOM, mas mantê-la oculta
    this.createModalStructure();
    
    // Substituir a função global verDetalhesProduto
    this.setupGlobalFunction();
    
    // Adicionar listeners aos botões "Ver Detalhes" existentes
    this.setupExistingButtons();
    
    // Marcar como inicializado
    this.isInitialized = true;
    console.log('[ProductModal] Inicialização concluída');
  },
  
  // Criar estrutura do modal
  createModalStructure() {
    console.log('[ProductModal] Criando estrutura do modal...');
    
    // Verificar se o modal já existe
    if (document.getElementById('product-modal-overlay')) {
      console.log('[ProductModal] Modal já existe no DOM');
      this.overlayElement = document.getElementById('product-modal-overlay');
      return;
    }
    
    // Criar estrutura do modal
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
    
    // Adicionar ao final do body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Guardar referência ao elemento do modal
    this.overlayElement = document.getElementById('product-modal-overlay');
    
    // Configurar eventos do modal
    this.setupModalEvents();
    
    // Garantir que o CSS do modal esteja carregado
    this.loadModalStyles();
    
    console.log('[ProductModal] Estrutura do modal criada');
  },
  
  // Configurar eventos do modal
  setupModalEvents() {
    if (!this.overlayElement) return;
    
    // Botão de fechar
    const closeBtn = this.overlayElement.querySelector('.product-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }
    
    // Fechar ao clicar fora
    this.overlayElement.addEventListener('click', (event) => {
      if (event.target === this.overlayElement) {
        this.closeModal();
      }
    });
    
    // Fechar com tecla ESC
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isModalOpen()) {
        this.closeModal();
      }
    });
  },
  
  // Carregar estilos do modal
  loadModalStyles() {
    // Verificar se o CSS já está carregado
    if (document.querySelector('link[href*="product-modal.css"]')) {
      return;
    }
    
    // Carregar CSS do modal
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/css/product-modal.css';
    document.head.appendChild(styleLink);
    console.log('[ProductModal] CSS carregado');
  },
  
  // Substituir função global
  setupGlobalFunction() {
    console.log('[ProductModal] Configurando função global verDetalhesProduto');
    
    // Armazenar a implementação original se existir
    const originalFunction = window.verDetalhesProduto;
    
    // Substituir por nossa implementação
    window.verDetalhesProduto = (productId) => {
      console.log('[ProductModal] verDetalhesProduto chamada para produto:', productId);
      
      // Inicializar o modal se ainda não foi feito
      if (!this.isInitialized) {
        this.init();
      }
      
      // Mostrar o modal e carregar os detalhes
      this.showProductDetails(productId);
    };
    
    // Se havia uma implementação original, logar isso
    if (typeof originalFunction === 'function') {
      console.log('[ProductModal] Função original substituída');
    }
  },
  
  // Configurar botões existentes
  setupExistingButtons() {
    console.log('[ProductModal] Configurando botões existentes...');
    
    // Selecionar possíveis botões "Ver Detalhes"
    const detailButtons = document.querySelectorAll('.btn-ver-detalhes, [data-action="ver-detalhes"], [onclick*="verDetalhesProduto"]');
    
    detailButtons.forEach(button => {
      // Verificar se já configuramos este botão
      if (button.dataset.modalHandlerAttached) {
        return;
      }
      
      // Obter ID do produto
      let productId = button.dataset.id || button.dataset.productId;
      
      // Se não tem ID nos data attributes, tentar extrair do onclick
      if (!productId && button.hasAttribute('onclick')) {
        const onclickAttr = button.getAttribute('onclick');
        const match = onclickAttr.match(/verDetalhesProduto\s*\(\s*(\d+)\s*\)/);
        if (match && match[1]) {
          productId = match[1];
        }
      }
      
      // Se encontramos um ID, substituir o evento onclick
      if (productId) {
        // Remover onclick original para evitar conflitos
        if (button.hasAttribute('onclick')) {
          button.removeAttribute('onclick');
        }
        
        // Adicionar novo evento de clique
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.showProductDetails(productId);
        });
        
        // Marcar como configurado
        button.dataset.modalHandlerAttached = 'true';
        console.log(`[ProductModal] Botão configurado para produto ${productId}`);
      }
    });
  },
  
  // Exibir detalhes do produto
  async showProductDetails(productId) {
    console.log(`[ProductModal] Exibindo detalhes do produto ${productId}`);
    
    // Abrir modal com estado de carregamento
    this.openModal();
    
    try {
      // Buscar detalhes do produto
      const produto = await this.fetchProductDetails(productId);
      
      // Renderizar detalhes no modal
      this.renderProductDetails(produto);
    } catch (error) {
      console.error('[ProductModal] Erro ao carregar detalhes:', error);
      this.showErrorMessage('Não foi possível carregar os detalhes do produto. Tente novamente mais tarde.');
    }
  },
  
  // Abrir o modal
  openModal() {
    console.log('[ProductModal] Abrindo modal');
    
    // Garantir que o modal existe
    if (!this.overlayElement) {
      this.createModalStructure();
    }
    
    // Exibir o modal com estado de carregamento
    this.overlayElement.style.display = 'flex';
    
    // Aplicar classe para adicionar transição
    setTimeout(() => {
      this.overlayElement.classList.add('active');
    }, 10);
    
    // Impedir scroll do body
    document.body.style.overflow = 'hidden';
    
    // Resetar conteúdo para loading
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
  
  // Fechar o modal
  closeModal() {
    console.log('[ProductModal] Fechando modal');
    
    if (!this.overlayElement) return;
    
    // Remover classe primeiro para ativar transição
    this.overlayElement.classList.remove('active');
    
    // Ocultar após a transição
    setTimeout(() => {
      this.overlayElement.style.display = 'none';
      
      // Restaurar scroll do body
      document.body.style.overflow = '';
    }, 300);
  },
  
  // Verificar se o modal está aberto
  isModalOpen() {
    return this.overlayElement && 
           this.overlayElement.style.display !== 'none' && 
           this.overlayElement.classList.contains('active');
  },
  
  // Buscar detalhes do produto
  async fetchProductDetails(productId) {
    console.log(`[ProductModal] Buscando detalhes do produto ${productId}`);
    
    try {
      // Usar a API.produtos.obterPorId se disponível
      if (window.API && window.API.produtos && typeof window.API.produtos.obterPorId === 'function') {
        return await window.API.produtos.obterPorId(productId);
      } else {
        // Fallback para fetch direto
        const baseUrl = window.API?.BASE_URL || 'http://localhost:3001/api';
        
        // Tentar diferentes possíveis endpoints
        const possibleEndpoints = [
          `/products/${productId}`,
          `/produtos/${productId}`,
          `/product/${productId}`,
          `/produto/${productId}`
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
      }
    } catch (error) {
      console.error('[ProductModal] Erro ao buscar detalhes do produto:', error);
      throw error;
    }
  },
  
  // Renderizar detalhes do produto
  renderProductDetails(produto) {
    const modalContent = document.getElementById('product-modal-content');
    if (!modalContent) return;
    
    // Usar o script productDetails.js se disponível
    if (window.renderProductDetails && typeof window.renderProductDetails === 'function') {
      window.renderProductDetails(produto);
      return;
    }
    
    // Renderização básica caso o script productDetails.js não esteja disponível
    const imageUrl = window.ImageHelper ? 
      window.ImageHelper.getProductImageUrl(produto.id) : 
      `${window.API?.BASE_URL || 'http://localhost:3001/api'}/products/image/${produto.id}`;
    
    // Formatar o preço
    const formattedPrice = this.formatCurrency(produto.price);
    
    // HTML básico do produto
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
        <div class="product-modal-actions">
          <button class="add-to-cart-btn" data-id="${produto.id}">
            <i class="fas fa-shopping-cart"></i>
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    `;
    
    // Configurar evento do botão de adicionar ao carrinho
    const addToCartBtn = modalContent.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        // Adicionar ao carrinho (se existir função)
        if (window.addToCart) {
          window.addToCart(produto, 1);
        }
        // Fechar o modal
        this.closeModal();
      });
    }
  },
  
  // Mostrar mensagem de erro
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
  
  // Formatar preço como moeda
  formatCurrency(value) {
    if (typeof value !== 'number') {
      value = parseFloat(value) || 0;
    }
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }
};

// Inicializar o modal quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  // Não inicializar o modal imediatamente, apenas configurar a função global
  console.log('[ProductModal] DOM carregado, configurando sistema...');
  
  // Inicializar apenas a parte crítica: função global
  ProductModal.setupGlobalFunction();
  
  // Inicializar completamente se estamos na página de produtos
  if (window.location.pathname.includes('/produtos') || 
      document.querySelector('.products-list') || 
      document.querySelector('.featured-products')) {
    console.log('[ProductModal] Página de produtos detectada, inicializando completamente');
    ProductModal.init();
  } else {
    console.log('[ProductModal] Não é página de produtos, inicialização completa adiada');
    
    // Inicialização "preguiçosa" após 2 segundos para outras páginas
    setTimeout(() => {
      // Verificar se há botões que precisam do modal
      const hasProductButtons = document.querySelector('.btn-ver-detalhes, [data-action="ver-detalhes"], [onclick*="verDetalhesProduto"]');
      if (hasProductButtons) {
        console.log('[ProductModal] Botões de produto encontrados, inicializando...');
        ProductModal.init();
      } else {
        console.log('[ProductModal] Nenhum botão de produto encontrado, modal não será inicializado');
      }
    }, 2000);
  }
});

// Exportar o módulo para uso global
window.ProductModal = ProductModal;
