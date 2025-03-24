function initScrollAnimations() {
  console.log("Inicializando animações de scroll");
  
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  // Função para verificar se um elemento está visível na viewport
  const isElementInViewport = (el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
      rect.bottom >= 0
    );
  };
  
  // Função para animar elementos visíveis
  const animateElements = () => {
    animatedElements.forEach(element => {
      if (isElementInViewport(element)) {
        element.classList.add('animated');
      }
    });
  };
  
  // Verificar na carga inicial
  animateElements();
  
  // Adicionar evento de scroll
  window.addEventListener('scroll', animateElements);
  
  return {
    destroy: function() {
      window.removeEventListener('scroll', animateElements);
    }
  };
}

// Se a página for carregada diretamente, inicializar as animações
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initScrollAnimations, 1);
} else {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
}
