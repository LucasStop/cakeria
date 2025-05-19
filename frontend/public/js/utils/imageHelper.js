/**
 * Utilitário para gerenciar URLs de imagens em toda a aplicação
 */

const ImageHelper = {
  /**
   * Retorna a URL completa para a imagem de um produto com base no ID do produto
   * @param {number|string} productId - ID do produto
   * @returns {string} URL completa para a imagem
   */
  getProductImageUrl: function(productId) {
    if (!productId) return '/assets/default-product.png'; // Imagem padrão se não houver ID
    
    // Usar a rota específica para buscar imagens do backend
    return `${API.BASE_URL || 'http://localhost:3001/api'}/product/image/${productId}`;
  },
  
  /**
   * Cria uma tag <img> com tratamento de erro para produtos
   * @param {number|string} productId - ID do produto
   * @param {string} altText - Texto alternativo para a imagem
   * @param {string} className - Classes CSS para a tag img
   * @returns {string} HTML da tag <img> com fallback para imagem padrão
   */
  createProductImageTag: function(productId, altText = 'Imagem do produto', className = '') {
    return `<img 
      src="${this.getProductImageUrl(productId)}" 
      alt="${altText}"
      class="${className}"
      onerror="this.onerror=null; this.src='/assets/default-product.png';"
    >`;
  }
};

// Disponibilizar globalmente
window.ImageHelper = ImageHelper;
