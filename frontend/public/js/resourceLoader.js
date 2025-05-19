/**
 * Resource Loader - Carrega dinamicamente recursos CSS e JS conforme necessário
 */

document.addEventListener('DOMContentLoaded', function() {
  // Verificar se estamos na página inicial (index.html)
  const isHomePage = window.location.pathname === '/' || 
                     window.location.pathname.includes('index.html') || 
                     window.location.pathname.endsWith('/');
  
  // Verificar se o usuário pode interagir com produtos na página atual
  const hasProductInteraction = document.querySelector('.product-card') || 
                               document.querySelector('[onclick*="verDetalhesProduto"]');
  
  // Se estamos na home page ou temos interação com produtos, carregamos os recursos necessários
  if (isHomePage || hasProductInteraction) {
    // Carregar CSS necessário para o modal e filtros de produtos
    loadProductCSS();
    
    // Inicializar o modal de produtos
    initializeProductModal();
  }
});

/**
 * Carrega os arquivos CSS necessários para produtos
 */
function loadProductCSS() {
  // Verificar se os arquivos CSS já foram carregados
  if (!document.querySelector('link[href*="product-modal.css"]')) {
    // Carregar CSS do modal de produtos
    const modalStyle = document.createElement('link');
    modalStyle.rel = 'stylesheet';
    modalStyle.href = '/css/product-modal.css';
    document.head.appendChild(modalStyle);
  }
  
  if (!document.querySelector('link[href*="produtos.css"]')) {
    // Carregar CSS de produtos (para filtros e layouts)
    const produtosStyle = document.createElement('link');
    produtosStyle.rel = 'stylesheet';
    produtosStyle.href = '/css/produtos.css';
    document.head.appendChild(produtosStyle);
  }
}

/**
 * Inicializa o modal de detalhes do produto
 */
function initializeProductModal() {
  // Garantir que o script de detalhes do produto seja carregado
  if (!window.ProductDetails && !document.querySelector('script[src*="productDetails.js"]')) {
    const script = document.createElement('script');
    script.src = '/js/productDetails.js';
    document.body.appendChild(script);
    
    // Depois que o script for carregado, verificar se precisamos corrigir a função verDetalhesProduto
    script.onload = fixProductDetailFunction;
  } else {
    // Se o script já está carregado, apenas corrigir a função se necessário
    fixProductDetailFunction();
  }
}

/**
 * Corrige possíveis conflitos na função verDetalhesProduto
 */
function fixProductDetailFunction() {
  // Se houve algum problema com a função verDetalhesProduto, restaurar sua funcionalidade
  if (!window.verDetalhesProduto || typeof window.verDetalhesProduto !== 'function') {
    console.warn('A função verDetalhesProduto não está disponível ou foi sobrescrita incorretamente.');
    
    window.verDetalhesProduto = function(productId) {
      // Se o ProductDetails está disponível, usar a implementação do modal
      if (window.ProductDetails) {
        if (window.ProductDetails.openModal) {
          window.ProductDetails.openModal();
        }
        
        // Carregar os detalhes do produto
        loadProductDetails(productId).then(produto => {
          if (window.renderProductDetails) {
            window.renderProductDetails(produto);
          }
        }).catch(error => {
          console.error('Erro ao carregar detalhes do produto:', error);
          if (window.showErrorInModal) {
            window.showErrorInModal('Não foi possível carregar os detalhes do produto.');
          }
        });
        return;
      }
      
      // Implementação de fallback
      console.warn('Fallback para carregarDetalhesProduto');
      if (window.carregarDetalhesProduto) {
        window.carregarDetalhesProduto(productId);
      } else {
        console.error('Função carregarDetalhesProduto não encontrada');
      }
    };
  }
}

/**
 * Carrega os detalhes do produto de forma similar à implementação no productDetails.js
 */
async function loadProductDetails(productId) {
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

// Expor funções globalmente para uso em outras partes do código
window.ResourceLoader = {
  loadProductCSS,
  initializeProductModal,
  fixProductDetailFunction
};
