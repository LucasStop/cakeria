// Script para atualizar o contador do carrinho em todas as páginas
document.addEventListener('DOMContentLoaded', function() {
  updateCartCounter();
  
  // Adiciona ouvinte para eventos de atualização do carrinho
  document.addEventListener('cartUpdated', function() {
    updateCartCounter();
  });
});

// Atualiza o contador do carrinho no header
function updateCartCounter() {
  try {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
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
