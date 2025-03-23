document.addEventListener('DOMContentLoaded', function() {
  // Seleciona todos os elementos com a classe 'animate-on-scroll'
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  // Configura o observer de interseção
  const observerOptions = {
    root: null, // usar a viewport como referência
    rootMargin: '0px', // sem margem
    threshold: 0.15 // animar quando pelo menos 15% do elemento estiver visível
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Adiciona a classe que ativa a animação
        entry.target.classList.add('animated');
        // Para de observar o elemento após animar
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Começa a observar todos os elementos
  animatedElements.forEach(element => {
    observer.observe(element);
  });
  
  // Fallback para navegadores que não suportam IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    console.log("IntersectionObserver não suportado, usando fallback");
    
    // Função para verificar se um elemento está visível
    function checkIfInView() {
      const windowHeight = window.innerHeight;
      const windowTop = window.scrollY;
      const windowBottom = windowTop + windowHeight;
      
      animatedElements.forEach(element => {
        const elementBounds = element.getBoundingClientRect();
        const elementTop = elementBounds.top + windowTop;
        const elementBottom = elementTop + elementBounds.height;
        
        // Se o elemento estiver visível
        if (elementBottom > windowTop && elementTop < windowBottom) {
          element.classList.add('animated');
        }
      });
    }
    
    // Adiciona listeners de evento para scroll e redimensionamento
    window.addEventListener('scroll', checkIfInView);
    window.addEventListener('resize', checkIfInView);
    
    // Verifica inicialmente
    setTimeout(checkIfInView, 100);
  }
});
