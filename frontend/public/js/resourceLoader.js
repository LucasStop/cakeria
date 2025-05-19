document.addEventListener('DOMContentLoaded', function () {
  const isHomePage =
    window.location.pathname === '/' ||
    window.location.pathname.includes('index.html') ||
    window.location.pathname.endsWith('/');

  const hasProductInteraction =
    document.querySelector('.product-card') ||
    document.querySelector('[onclick*="verDetalhesProduto"]');

  if (isHomePage || hasProductInteraction) {
    loadProductCSS();

    initializeProductModal();
  }
});

function loadProductCSS() {
  if (!document.querySelector('link[href*="product-modal.css"]')) {
    const modalStyle = document.createElement('link');
    modalStyle.rel = 'stylesheet';
    modalStyle.href = '/css/product-modal.css';
    document.head.appendChild(modalStyle);
  }

  if (!document.querySelector('link[href*="produtos.css"]')) {
    const produtosStyle = document.createElement('link');
    produtosStyle.rel = 'stylesheet';
    produtosStyle.href = '/css/produtos.css';
    document.head.appendChild(produtosStyle);
  }
}

function initializeProductModal() {
  if (!window.ProductDetails && !document.querySelector('script[src*="detalhes-produto.js"]')) {
    const script = document.createElement('script');
    script.src = '/js/detalhes-produto.js';
    document.body.appendChild(script);

    script.onload = fixProductDetailFunction;
  } else {
    fixProductDetailFunction();
  }
}

function fixProductDetailFunction() {
  if (!window.verDetalhesProduto || typeof window.verDetalhesProduto !== 'function') {
    console.warn(
      'A função verDetalhesProduto não está disponível ou foi sobrescrita incorretamente.'
    );

    window.verDetalhesProduto = function (productId) {
      if (window.ProductDetails) {
        if (window.ProductDetails.openModal) {
          window.ProductDetails.openModal();
        }

        loadProductDetails(productId)
          .then(produto => {
            if (window.renderProductDetails) {
              window.renderProductDetails(produto);
            }
          })
          .catch(error => {
            console.error('Erro ao carregar detalhes do produto:', error);
            if (window.showErrorInModal) {
              window.showErrorInModal('Não foi possível carregar os detalhes do produto.');
            }
          });
        return;
      }

      console.warn('Fallback para carregarDetalhesProduto');
      if (window.carregarDetalhesProduto) {
        window.carregarDetalhesProduto(productId);
      } else {
        console.error('Função carregarDetalhesProduto não encontrada');
      }
    };
  }
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

window.ResourceLoader = {
  loadProductCSS,
  initializeProductModal,
  fixProductDetailFunction,
};
