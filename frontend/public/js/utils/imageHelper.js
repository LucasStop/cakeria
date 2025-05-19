const ImageHelper = {
  getProductImageUrl: function (productId) {
    if (!productId) return '/assets/default-product.png';
    return `${API.BASE_URL || 'http://localhost:3001/api'}/product/image/${productId}`;
  },

  createProductImageTag: function (productId, altText = 'Imagem do produto', className = '') {
    return `<img 
      src="${this.getProductImageUrl(productId)}" 
      alt="${altText}"
      class="${className}"
      onerror="this.onerror=null; this.src='/assets/default-product.png';"
    >`;
  },
};

window.ImageHelper = ImageHelper;
